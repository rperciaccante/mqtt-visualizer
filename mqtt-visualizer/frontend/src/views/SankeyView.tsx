import { useState, useRef, useEffect } from 'react';
import { useMqtt } from '../context/MqttContext';
import type { TopicState, SubscriberState } from '../context/MqttContext';
import { SankeyChart } from './SankeyChart';
import { TopicDetail } from '../components/TopicDetail';

interface Transform { x: number; y: number; scale: number; }

export function SankeyView() {
  const { state } = useMqtt();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 800, height: 500 });

  // Pause / freeze
  const [paused, setPaused] = useState(false);
  const [frozen, setFrozen] = useState<{ topics: Record<string, TopicState>; subscribers: Record<string, SubscriberState> } | null>(null);

  function togglePause() {
    if (!paused) setFrozen({ topics: state.topics, subscribers: state.subscribers });
    setPaused(p => !p);
  }

  const displayTopics = paused && frozen ? frozen.topics : state.topics;
  const displaySubscribers = paused && frozen ? frozen.subscribers : state.subscribers;

  // Zoom / pan
  const [xf, setXf] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const xfRef = useRef(xf);
  xfRef.current = xf;
  const dragRef = useRef<{ active: boolean; startX: number; startY: number; tx: number; ty: number }>({
    active: false, startX: 0, startY: 0, tx: 0, ty: 0,
  });

  function resetZoom() { setXf({ x: 0, y: 0, scale: 1 }); }

  useEffect(() => {
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDims({ width, height });
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Wheel zoom — must be non-passive to call preventDefault
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect(); // read rect synchronously, before any async work
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      setXf(t => {
        const newScale = Math.max(0.15, Math.min(8, t.scale * factor));
        return {
          scale: newScale,
          x: cx - (cx - t.x) * (newScale / t.scale),
          y: cy - (cy - t.y) * (newScale / t.scale),
        };
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  function onMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return;
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, tx: xfRef.current.x, ty: xfRef.current.y };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragRef.current.active) return;
    setXf(t => ({
      ...t,
      x: dragRef.current.tx + (e.clientX - dragRef.current.startX),
      y: dragRef.current.ty + (e.clientY - dragRef.current.startY),
    }));
  }
  function onMouseUp() { dragRef.current.active = false; }

  const selectedTopic = selectedNode && state.topics[selectedNode] ? selectedNode : null;

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', background: '#0f172a', overflow: 'hidden' }}
      onMouseDown={onMouseDown} onMouseMove={onMouseMove}
      onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>

      {/* Zoom/pan container */}
      <div style={{
        transform: `translate(${xf.x}px,${xf.y}px) scale(${xf.scale})`,
        transformOrigin: '0 0',
        width: dims.width, height: dims.height,
        pointerEvents: 'none',
      }}>
        <div style={{ pointerEvents: 'auto' }}>
          <SankeyChart
            topics={displayTopics}
            subscribers={displaySubscribers}
            onSelectNode={setSelectedNode}
            width={dims.width}
            height={dims.height}
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="sankey-toolbar">
        <button className={`sankey-btn ${paused ? 'sankey-btn--active' : ''}`} onClick={togglePause}>
          {paused ? '▶ Resume' : '⏸ Pause'}
        </button>
        <button className="sankey-btn" onClick={resetZoom} title="Reset zoom">⊙ Reset</button>
        <span className="sankey-zoom-label">{Math.round(xf.scale * 100)}%</span>
      </div>

      <TopicDetail
        topic={selectedTopic}
        data={selectedTopic ? state.topics[selectedTopic] : null}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  );
}
