import { useMemo } from 'react';
import { sankey, sankeyLinkHorizontal, type SankeyExtraProperties } from 'd3-sankey';
import type { SubscriberState, TopicState } from '../context/MqttContext';

interface SankeyNode extends SankeyExtraProperties {
  name: string;        // display label (last path segment, or client id)
  fullName: string;    // full path
  kind: 'topic' | 'subscriber';
}
interface SankeyLink extends SankeyExtraProperties { source: number; target: number; value: number; }

interface Props {
  topics: Record<string, TopicState>;
  subscribers: Record<string, SubscriberState>;
  onSelectNode: (name: string) => void;
  width: number;
  height: number;
}

const NODE_COLOR = { topic: '#4c1d95', subscriber: '#14532d' };
const TEXT_COLOR = { topic: '#c4b5fd', subscriber: '#86efac' };

function safe(v: number | undefined): number {
  return Number.isFinite(v) ? (v as number) : 0;
}

/** Simple bar chart fallback when topics have no hierarchy and no subscribers */
function TopicActivityChart({ topics, width, height, onSelectNode }: {
  topics: Record<string, TopicState>;
  width: number; height: number;
  onSelectNode: (name: string) => void;
}) {
  const sorted = useMemo(
    () => Object.entries(topics).sort((a, b) => b[1].msgRate - a[1].msgRate),
    [topics],
  );

  if (sorted.length === 0) {
    return (
      <svg width={width} height={height}>
        <text x={width / 2} y={height / 2} textAnchor="middle" fill="#475569" fontSize={12}>
          No topics yet — waiting for messages…
        </text>
      </svg>
    );
  }

  const total = sorted.reduce((s, [, v]) => s + Math.max(v.msgRate, 0.1), 0);
  const barW = Math.min(340, width - 160);
  const barX = (width - barW) / 2;
  const pad = 28;
  const gap = 4;
  const availH = height - pad * 2;
  let y = pad;

  return (
    <svg width={width} height={height} style={{ fontFamily: 'monospace' }}>
      <text x={width / 2} y={14} textAnchor="middle" fill="#334155" fontSize={10}>
        TOPIC ACTIVITY
      </text>
      {sorted.map(([topic, state], i) => {
        const h = Math.max((Math.max(state.msgRate, 0.1) / total) * availH, 16);
        const curY = y;
        y += h + gap;
        const label = topic.length > 40 ? '…' + topic.slice(-39) : topic;
        return (
          <g key={i} onClick={() => onSelectNode(topic)} style={{ cursor: 'pointer' }}>
            <rect x={barX} y={curY} width={barW} height={h - gap} fill="#4c1d95" rx={3} opacity={0.8} />
            <text x={barX + 8} y={curY + (h - gap) / 2} dy="0.35em"
              fill="#c4b5fd" fontSize={Math.min(11, Math.max(h - gap - 2, 6))}>
              {label}
            </text>
            {state.msgRate > 0 && (
              <text x={barX + barW - 6} y={curY + (h - gap) / 2} dy="0.35em"
                textAnchor="end" fill="#fbbf24" fontSize={10}>
                {state.msgRate.toFixed(1)}/s
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Build Sankey nodes and links from the topic hierarchy.
 * Each topic's rate flows from its leaf up through each prefix to the root.
 * If subscribers are provided they appear as a rightmost column linked from all roots.
 */
function buildHierarchyGraph(
  topics: Record<string, TopicState>,
  subscribers: Record<string, SubscriberState>,
) {
  // 1. Compute aggregated rate for every path prefix (sum of leaf rates beneath it)
  const prefixRate = new Map<string, number>();
  for (const [topic, state] of Object.entries(topics)) {
    const rate = Math.max(state.msgRate, 0.1);
    const parts = topic.split('/');
    for (let i = 1; i <= parts.length; i++) {
      const prefix = parts.slice(0, i).join('/');
      prefixRate.set(prefix, (prefixRate.get(prefix) ?? 0) + rate);
    }
  }

  const paths = [...prefixRate.keys()];
  const subIds = Object.keys(subscribers);

  // 2. Build node list: topic paths first, then subscriber ids
  const ns: SankeyNode[] = [
    ...paths.map(p => ({
      name: p.includes('/') ? p.split('/').pop()! : p,
      fullName: p,
      kind: 'topic' as const,
    })),
    ...subIds.map(id => ({
      name: id.length > 20 ? id.slice(0, 18) + '…' : id,
      fullName: id,
      kind: 'subscriber' as const,
    })),
  ];
  const idx = (key: string) => ns.findIndex(n => n.fullName === key);

  // 3. Link each non-root path to its parent
  const ls: SankeyLink[] = [];
  for (const path of paths) {
    const lastSlash = path.lastIndexOf('/');
    if (lastSlash < 0) continue; // root — no parent link
    const parent = path.slice(0, lastSlash);
    ls.push({ source: idx(path), target: idx(parent), value: prefixRate.get(path) ?? 0.1 });
  }

  // 4. Link root topic nodes → subscribers (if any)
  if (subIds.length > 0) {
    const roots = paths.filter(p => !p.includes('/'));
    for (const root of roots) {
      for (const subId of subIds) {
        ls.push({ source: idx(root), target: idx(subId), value: prefixRate.get(root) ?? 0.1 });
      }
    }
  }

  // 5. Remove isolated nodes (d3-sankey can't place them)
  const usedIdx = new Set<number>();
  ls.forEach(l => { usedIdx.add(l.source as number); usedIdx.add(l.target as number); });
  const remap: number[] = [];
  const filteredNs: SankeyNode[] = [];
  ns.forEach((n, i) => {
    if (usedIdx.has(i)) { remap[i] = filteredNs.length; filteredNs.push(n); }
  });
  const remapped = ls.map(l => ({
    ...l,
    source: remap[l.source as number],
    target: remap[l.target as number],
  }));

  const hasHierarchy = remapped.length > 0;
  return { nodes: filteredNs, links: remapped, hasHierarchy };
}

export function SankeyChart({ topics, subscribers, onSelectNode, width, height }: Props) {
  // Only recompute when keys or rates change — not on every payload update
  const topicKeys = useMemo(() => Object.keys(topics).sort().join('\0'), [topics]);
  const subscriberKeys = useMemo(() => Object.keys(subscribers).sort().join('\0'), [subscribers]);
  const topicRates = useMemo(
    () => Object.entries(topics).map(([k, v]) => `${k}:${v.msgRate.toFixed(2)}`).sort().join('\0'),
    [topics],
  );

  const { nodes, links, hasHierarchy } = useMemo(() => {
    return buildHierarchyGraph(topics, subscribers);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicKeys, subscriberKeys, topicRates]);

  // Guarantee each node has at least MIN_PITCH px of vertical space so links are individually visible.
  // The SVG grows beyond the viewport; zoom/pan handles navigation.
  const MIN_PITCH = 24; // px per node (node body + padding)
  const effectiveHeight = Math.max(height, nodes.length * MIN_PITCH + 40);

  const layout = useMemo(() => {
    if (!hasHierarchy || nodes.length === 0 || width <= 0 || effectiveHeight <= 0) return null;
    try {
      const gen = sankey<SankeyNode, SankeyLink>()
        .nodeWidth(16)
        .nodePadding(12)
        .extent([[24, 10], [width - 24, effectiveHeight - 10]]);
      return gen({ nodes: nodes.map(n => ({ ...n })), links: links.map(l => ({ ...l })) });
    } catch {
      return null;
    }
  // effectiveHeight derives from nodes.length + height, both already in deps via nodes/height
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, links, hasHierarchy, width, effectiveHeight]);

  // No hierarchy (all topics are flat, no subscribers) — fall back to bar chart
  if (!hasHierarchy) {
    return <TopicActivityChart topics={topics} width={width} height={height} onSelectNode={onSelectNode} />;
  }

  if (!layout) return <svg width={width} height={effectiveHeight} />;

  return (
    <svg width={width} height={effectiveHeight} style={{ fontFamily: 'monospace' }}>
      {layout.links.map((link, i) => (
        <path key={i} d={sankeyLinkHorizontal()(link) ?? ''}
          fill="none" stroke="#7c3aed" strokeOpacity={0.35}
          strokeWidth={Math.max(1, safe(link.width))} />
      ))}
      {layout.nodes.map((n, i) => {
        const x0 = safe(n.x0); const x1 = safe(n.x1);
        const y0 = safe(n.y0); const y1 = safe(n.y1);
        const ymid = (y0 + y1) / 2;
        const w = x1 - x0; const h = Math.max(y1 - y0, 4);
        if (!Number.isFinite(ymid)) return null;
        const onRight = n.kind === 'subscriber' || safe(n.x1) > width * 0.6;
        return (
          <g key={i} onClick={() => onSelectNode(n.fullName)} style={{ cursor: 'pointer' }}>
            <rect x={x0} y={y0} width={w} height={h} fill={NODE_COLOR[n.kind]} rx={2} />
            <text
              x={onRight ? x1 + 4 : x0 - 4}
              y={ymid} dy="0.35em"
              textAnchor={onRight ? 'start' : 'end'}
              fill={TEXT_COLOR[n.kind]} fontSize={10}>
              {n.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
