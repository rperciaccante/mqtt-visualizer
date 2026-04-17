import { useState, useRef, useCallback, useMemo } from 'react';
import type { TopicState } from '../context/MqttContext';
import { SearchBar } from './SearchBar';
import { TopicRow, type TopicNode } from './TopicRow';

interface Props {
  topics: Record<string, TopicState>;
  onSelectTopic: (path: string) => void;
  selectedTopic: string | null;
  onRowRefs?: (refs: Map<string, HTMLDivElement>) => void;
}

function buildTree(topics: Record<string, TopicState>, filter: string): TopicNode[] {
  function build(pathParts: string[], allPaths: string[]): TopicNode[] {
    const groups: Record<string, string[]> = {};
    for (const p of allPaths) {
      const parts = p.split('/');
      if (!groups[parts[0]]) groups[parts[0]] = [];
      if (parts.length > 1) groups[parts[0]].push(parts.slice(1).join('/'));
    }
    return Object.entries(groups).map(([name, children]) => {
      const fp = pathParts.length ? `${pathParts.join('/')}/${name}` : name;
      return {
        name,
        fullPath: fp,
        children: build([...pathParts, name], children),
        data: topics[fp],
      };
    });
  }

  const lf = filter.toLowerCase();
  const filtered = Object.keys(topics).filter(p => !lf || p.toLowerCase().includes(lf));
  return build([], filtered);
}

export function TopicTree({ topics, onSelectTopic, selectedTopic, onRowRefs }: Props) {
  const [search, setSearch] = useState('');
  const rowRefs = useRef(new Map<string, HTMLDivElement>());

  const registerRef = useCallback((path: string, el: HTMLDivElement | null) => {
    if (el) rowRefs.current.set(path, el);
    else rowRefs.current.delete(path);
    onRowRefs?.(rowRefs.current);
  }, [onRowRefs]);

  const tree = useMemo(() => buildTree(topics, search), [topics, search]);

  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  const toggleExpand = useCallback((path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  return (
    <div className="topic-tree">
      <SearchBar value={search} onChange={setSearch} />
      <div className="topic-tree-rows">
        {tree.map(node => (
          <TopicRow key={node.fullPath} node={node} depth={0}
            onSelect={onSelectTopic} selectedTopic={selectedTopic} registerRef={registerRef}
            expandedPaths={expandedPaths} onToggleExpand={toggleExpand} />
        ))}
      </div>
    </div>
  );
}
