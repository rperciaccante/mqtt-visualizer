import { useState, useMemo } from 'react';
import { useMqtt } from '../context/MqttContext';

type SortCol = 'topic' | 'source' | 'rate' | 'lastSeen' | 'lastValue';
type SortDir = 'asc' | 'desc';

function ago(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

/**
 * Infer the originating device from the topic path using common MQTT conventions.
 * MQTT doesn't expose the publisher client ID to subscribers, so this is best-effort.
 *
 * Rules (first match wins):
 *  - Tasmota prefixes (tele/stat/cmnd)  → segment[1]  e.g. tele/sonoffs3112/STATE → sonoffs3112
 *  - homeassistant/...                   → segment[2]  e.g. homeassistant/sensor/temp/state → temp
 *  - 3+ segments                         → segment[1]  e.g. frigate/garage_cam/event → garage_cam
 *  - 2 segments                          → segment[0]  e.g. frigate/events → frigate
 *  - 1 segment                           → segment[0]
 */
function inferSource(topic: string): string {
  const parts = topic.split('/');
  if (parts.length === 1) return parts[0];
  const root = parts[0].toLowerCase();
  if (['tele', 'stat', 'cmnd', 'tasmota'].includes(root)) return parts[1] ?? root;
  if (root === 'homeassistant') return parts[2] ?? parts[1] ?? root;
  if (parts.length >= 3) return parts[1];
  return parts[0]; // 2-segment: namespace is the device group
}

export function LogView() {
  const { state } = useMqtt();
  const [sortCol, setSortCol] = useState<SortCol>('rate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filter, setFilter] = useState('');

  function handleSort(col: SortCol) {
    if (col === sortCol) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortCol(col); setSortDir('desc'); }
  }

  const rows = useMemo(() => {
    const lc = filter.toLowerCase();
    return Object.entries(state.topics)
      .filter(([topic]) => !lc || topic.toLowerCase().includes(lc))
      .map(([topic, data]) => ({
        topic,
        source: inferSource(topic),
        rate: data.msgRate,
        lastSeen: data.lastSeen,
        lastValue: data.lastPayload,
      }))
      .sort((a, b) => {
        const m = sortDir === 'desc' ? -1 : 1;
        if (sortCol === 'topic') return a.topic.localeCompare(b.topic) * m;
        if (sortCol === 'source') return a.source.localeCompare(b.source) * m;
        if (sortCol === 'rate') return (a.rate - b.rate) * m;
        if (sortCol === 'lastSeen') return (a.lastSeen - b.lastSeen) * m;
        return a.lastValue.localeCompare(b.lastValue) * m;
      });
  }, [state.topics, sortCol, sortDir, filter]);

  function arrow(col: SortCol) {
    if (col !== sortCol) return <span className="log-sort-arrow log-sort-arrow--inactive">↕</span>;
    return <span className="log-sort-arrow">{sortDir === 'desc' ? '↓' : '↑'}</span>;
  }

  return (
    <div className="log-view">
      <div className="log-toolbar">
        <input
          className="log-filter"
          placeholder="Filter topics…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
        <span className="log-count">{rows.length} topic{rows.length !== 1 ? 's' : ''}</span>
        <span className="log-hint">Source is inferred from topic path — MQTT does not expose the publisher client ID</span>
      </div>
      <div className="log-table-wrap">
        <table className="log-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('source')}>Source {arrow('source')}</th>
              <th onClick={() => handleSort('topic')}>Topic {arrow('topic')}</th>
              <th onClick={() => handleSort('rate')}>Rate {arrow('rate')}</th>
              <th onClick={() => handleSort('lastSeen')}>Last seen {arrow('lastSeen')}</th>
              <th onClick={() => handleSort('lastValue')}>Last value {arrow('lastValue')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={5} className="log-empty">
                {filter ? 'No topics match filter' : 'Waiting for messages…'}
              </td></tr>
            )}
            {rows.map(row => (
              <tr key={row.topic}>
                <td className="log-source" title={`Inferred from: ${row.topic}`}>{row.source}</td>
                <td className="log-topic" title={row.topic}>{row.topic}</td>
                <td className="log-rate">{row.rate > 0 ? `${row.rate.toFixed(1)}/s` : '—'}</td>
                <td className="log-ts">{row.lastSeen ? ago(row.lastSeen) : '—'}</td>
                <td className="log-value" title={row.lastValue}>{truncate(row.lastValue, 80)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
