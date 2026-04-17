import { useState, useRef, useCallback } from 'react';
import './LiveView.css';
import { useMqtt } from '../context/MqttContext';
import { PublisherPanel } from './PublisherPanel';
import { SubscriberPanel } from './SubscriberPanel';
import { TopicTree } from './TopicTree';
import { FlowOverlay } from './FlowOverlay';
import { TopicDetail } from '../components/TopicDetail';

export function LiveView() {
  const { state } = useMqtt();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const topicRowRefs = useRef(new Map<string, HTMLDivElement>());
  const publisherCardRefs = useRef(new Map<string, HTMLDivElement>());
  const subscriberCardRefs = useRef(new Map<string, HTMLDivElement>());

  const handleRowRefs = useCallback((refs: Map<string, HTMLDivElement>) => {
    topicRowRefs.current = refs;
  }, []);

  const handlePubRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) publisherCardRefs.current.set(id, el);
    else publisherCardRefs.current.delete(id);
  }, []);

  const handleSubRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) subscriberCardRefs.current.set(id, el);
    else subscriberCardRefs.current.delete(id);
  }, []);

  if (state.brokerStatus === 'error' && state.brokerMessage.includes('Not configured')) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12 }}>
        <div style={{ color: '#ef4444', fontSize: 16 }}>MQTT broker not configured</div>
        <div style={{ color: '#64748b', fontSize: 13 }}>Set <code>mqtt_host</code> in the add-on Configuration tab and restart.</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="live-view">
      <PublisherPanel onCardRef={handlePubRef} />
      <TopicTree
        topics={state.topics}
        onSelectTopic={setSelectedTopic}
        selectedTopic={selectedTopic}
        onRowRefs={handleRowRefs}
      />
      <SubscriberPanel onCardRef={handleSubRef} />
      <FlowOverlay
        publishers={state.publishers}
        subscribers={state.subscribers}
        topics={state.topics}
        topicRowRefs={topicRowRefs}
        publisherCardRefs={publisherCardRefs}
        subscriberCardRefs={subscriberCardRefs}
        containerRef={containerRef}
      />
      <TopicDetail
        topic={selectedTopic}
        data={selectedTopic ? state.topics[selectedTopic] ?? null : null}
        onClose={() => setSelectedTopic(null)}
      />
    </div>
  );
}
