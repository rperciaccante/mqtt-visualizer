import type { TopicState } from '../context/MqttContext';

export interface TopicNode {
  name: string;
  fullPath: string;
  children: TopicNode[];
  data?: TopicState;
}

interface Props {
  node: TopicNode;
  depth: number;
  onSelect: (path: string) => void;
  selectedTopic: string | null;
  registerRef: (path: string, el: HTMLDivElement | null) => void;
  expandedPaths: Set<string>;
  onToggleExpand: (path: string) => void;
}

export function TopicRow({ node, depth, onSelect, selectedTopic, registerRef, expandedPaths, onToggleExpand }: Props) {
  const hasChildren = node.children.length > 0;
  const isSelected = selectedTopic === node.fullPath;
  const expanded = expandedPaths.has(node.fullPath);

  return (
    <div>
      <div
        ref={(el) => registerRef(node.fullPath, el)}
        className={`topic-row depth-${depth} ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => {
          if (hasChildren) onToggleExpand(node.fullPath);
          else onSelect(node.fullPath);
        }}
      >
        <span className="expand-icon">{hasChildren ? (expanded ? '▼' : '►') : '–'}</span>
        <span className="topic-name">{node.name}</span>
        {node.data && (
          <>
            <span className="topic-payload">{node.data.lastPayload}</span>
            {node.data.msgRate > 0 && (
              <span className="topic-rate">{node.data.msgRate.toFixed(1)}/s</span>
            )}
          </>
        )}
      </div>
      {expanded && hasChildren && node.children.map(child => (
        <TopicRow key={child.fullPath} node={child} depth={depth + 1}
          onSelect={onSelect} selectedTopic={selectedTopic} registerRef={registerRef}
          expandedPaths={expandedPaths} onToggleExpand={onToggleExpand} />
      ))}
    </div>
  );
}
