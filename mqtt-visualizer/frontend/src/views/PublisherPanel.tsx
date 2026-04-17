import { useMqtt } from '../context/MqttContext';
import { ClientCard } from '../components/ClientCard';

interface Props { onCardRef?: (id: string, el: HTMLDivElement | null) => void; }

export function PublisherPanel({ onCardRef }: Props) {
  const { state } = useMqtt();
  const publishers = Object.entries(state.publishers);
  return (
    <div className="panel panel--left">
      <div className="panel__header">Publishers</div>
      <div className="panel__content">
        {publishers.length === 0
          ? <div className="panel__empty">No publishers seen</div>
          : publishers.map(([id, p]) => (
              <ClientCard key={id} clientId={id} msgRate={p.msgRate}
                topics={p.topics} variant="publisher" onCardRef={onCardRef} />
            ))}
      </div>
    </div>
  );
}
