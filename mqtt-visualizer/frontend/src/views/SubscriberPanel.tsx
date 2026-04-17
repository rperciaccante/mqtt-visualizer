import { useMqtt } from '../context/MqttContext';
import { ClientCard } from '../components/ClientCard';

interface Props { onCardRef?: (id: string, el: HTMLDivElement | null) => void; }

export function SubscriberPanel({ onCardRef }: Props) {
  const { state } = useMqtt();
  const subscribers = Object.entries(state.subscribers);
  return (
    <div className="panel panel--right">
      <div className="panel__header">Subscribers <span className="approx-label">(approximate)</span></div>
      <div className="panel__content">
        {subscribers.length === 0
          ? <div className="panel__empty">No subscribers seen</div>
          : subscribers.map(([id, s]) => (
              <ClientCard key={id} clientId={id} connected={s.connected} variant="subscriber" onCardRef={onCardRef} />
            ))}
      </div>
    </div>
  );
}
