interface Props {
  clientId: string;
  msgRate?: number;
  topics?: string[];
  connected?: boolean;
  variant: 'publisher' | 'subscriber';
  onCardRef?: (clientId: string, el: HTMLDivElement | null) => void;
}

export function ClientCard({ clientId, msgRate, topics, connected, variant, onCardRef }: Props) {
  return (
    <div ref={(el) => onCardRef?.(clientId, el)} className={`client-card client-card--${variant}`}>
      <div className="client-card__id">{clientId}</div>
      {/* hide rate display when no messages have been seen (msgRate=0 means idle, not "unknown") */}
      {msgRate !== undefined && msgRate > 0 && (
        <div className="client-card__rate">{msgRate.toFixed(1)}/s</div>
      )}
      {connected !== undefined && (
        <div className={`client-card__status ${connected ? 'connected' : 'idle'}`}>
          {connected ? 'connected' : 'idle'}
        </div>
      )}
      {topics && topics.length > 0 && (
        <div className="client-card__topics">
          {topics.slice(0, 3).map(t => <span key={t} className="topic-tag">{t}</span>)}
          {topics.length > 3 && <span className="topic-tag">+{topics.length - 3}</span>}
        </div>
      )}

    </div>
  );
}
