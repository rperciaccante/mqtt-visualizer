import { useEffect, useRef, useState, useCallback, type RefObject } from 'react';
import type { PublisherState, SubscriberState, TopicState } from '../context/MqttContext';

interface Props {
  publishers: Record<string, PublisherState>;
  subscribers: Record<string, SubscriberState>;
  topics: Record<string, TopicState>;
  topicRowRefs: RefObject<Map<string, HTMLDivElement>>;
  publisherCardRefs: RefObject<Map<string, HTMLDivElement>>;
  subscriberCardRefs: RefObject<Map<string, HTMLDivElement>>;
  containerRef: RefObject<HTMLDivElement>;
}

interface Line { x1: number; y1: number; x2: number; y2: number; width: number; key: string; side: 'left' | 'right'; }

function midY(el: HTMLDivElement, container: HTMLDivElement): number {
  const er = el.getBoundingClientRect();
  const cr = container.getBoundingClientRect();
  return er.top + er.height / 2 - cr.top;
}

export function FlowOverlay({ publishers, subscribers, topics, topicRowRefs, publisherCardRefs, subscriberCardRefs, containerRef }: Props) {
  const [lines, setLines] = useState<Line[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  const recompute = useCallback(() => {
    const container = containerRef.current;
    const svg = svgRef.current;
    const topicRowMap = topicRowRefs.current;
    const publisherMap = publisherCardRefs.current;
    const subscriberMap = subscriberCardRefs.current;
    if (!container || !svg || !topicRowMap || !publisherMap || !subscriberMap) return;
    const cr = container.getBoundingClientRect();
    if (cr.width === 0) return;
    const svgWidth = cr.width;
    const newLines: Line[] = [];

    // Publisher → topic lines (left side)
    for (const [pubId, pub] of Object.entries(publishers)) {
      const pubEl = publisherMap.get(pubId);
      if (!pubEl) continue;
      const py = midY(pubEl, container);
      const totalRate = pub.msgRate || 0.1;

      for (const topic of pub.topics) {
        const topicEl = topicRowMap.get(topic);
        if (!topicEl) continue;
        const ty = midY(topicEl, container);
        const topicRate = topics[topic]?.msgRate ?? 0;
        // Publisher lines scale width by proportion of msg rate
        const w = Math.max(1, Math.min(12, (topicRate / totalRate) * 8));
        const x1 = 0; const x2 = cr.width * 0.28;
        newLines.push({ x1, y1: py, x2, y2: ty, width: w, key: `pub-${pubId}-${topic}`, side: 'left' });
      }
    }

    // Topic → subscriber lines (right side)
    for (const [subId] of Object.entries(subscribers)) {
      const subEl = subscriberMap.get(subId);
      if (!subEl) continue;
      const sy = midY(subEl, container);
      const x1 = svgWidth * 0.72; const x2 = svgWidth;
      // Subscriber lines are horizontal with fixed width — SubscriberState has no rate data
      newLines.push({ x1, y1: sy, x2, y2: sy, width: 2, key: `sub-${subId}`, side: 'right' });
    }

    setLines(newLines);
  }, [publishers, subscribers, topics, topicRowRefs, publisherCardRefs, subscriberCardRefs, containerRef]); // ^ all are RefObjects — their .current changes but the objects are stable across renders

  useEffect(() => {
    const ro = new ResizeObserver(() => requestAnimationFrame(recompute));
    if (containerRef.current) ro.observe(containerRef.current);
    requestAnimationFrame(recompute);
    return () => ro.disconnect();
  }, [recompute]);

  return (
    <svg ref={svgRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}>
      <defs>
        <linearGradient id="fl-left" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="fl-right" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </linearGradient>
      </defs>
      {lines.map(l => (
        <path
          key={l.key}
          d={`M ${l.x1},${l.y1} C ${l.x1 + 60},${l.y1} ${l.x2 - 60},${l.y2} ${l.x2},${l.y2}`}
          fill="none"
          stroke={`url(#fl-${l.side})`}
          strokeWidth={l.width}
          opacity={0.75}
        />
      ))}
    </svg>
  );
}
