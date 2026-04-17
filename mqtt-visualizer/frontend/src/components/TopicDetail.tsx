import type { TopicState } from '../context/MqttContext';

interface Props {
  topic: string | null;
  data: TopicState | null;
  onClose: () => void;
}

function prettyPayload(raw: string): string {
  if (!raw) return '(empty)';
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

export function TopicDetail({ topic, data, onClose }: Props) {
  if (!topic || !data) return null;
  const pretty = prettyPayload(data.lastPayload);
  const isMultiline = pretty.includes('\n');
  return (
    <div className="topic-detail">
      <div className="topic-detail__header">
        <span className="topic-detail__path">{topic}</span>
        <button className="topic-detail__close" onClick={onClose}>✕</button>
      </div>
      <div className="topic-detail__last">
        <div className="topic-detail__label">Last value</div>
        {isMultiline
          ? <pre className="topic-detail__payload topic-detail__payload--json">{pretty}</pre>
          : <div className="topic-detail__payload">{pretty}</div>}
      </div>
      <div className="topic-detail__history">
        <div className="topic-detail__label">Message history</div>
        <div className="topic-detail__list">
          {[...data.history].reverse().map((h, i) => (
            <div key={`${h.ts}-${i}`} className="topic-detail__entry">
              <span className="entry-payload">{prettyPayload(h.payload)}</span>
              <span className="entry-ts">{new Date(h.ts).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
