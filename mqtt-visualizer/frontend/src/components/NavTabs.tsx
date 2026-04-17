type View = 'live' | 'sankey' | 'log';

interface Props {
  activeView: View;
  onChange: (v: View) => void;
}
export function NavTabs({ activeView, onChange }: Props) {
  return (
    <>
      <button type="button" className={`nav-tab ${activeView === 'live' ? 'active' : ''}`}
        onClick={() => onChange('live')}>Live View</button>
      <button type="button" className={`nav-tab ${activeView === 'sankey' ? 'active' : ''}`}
        onClick={() => onChange('sankey')}>Sankey</button>
      <button type="button" className={`nav-tab ${activeView === 'log' ? 'active' : ''}`}
        onClick={() => onChange('log')}>Log</button>
    </>
  );
}
