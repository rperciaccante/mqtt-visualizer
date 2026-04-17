import { useState } from 'react';
import './App.css';
import { MqttProvider } from './context/MqttContext';
import { NavTabs } from './components/NavTabs';
import { ConnectionStatus } from './components/ConnectionStatus';
import { LiveView } from './views/LiveView';
import { SankeyView } from './views/SankeyView';
import { LogView } from './views/LogView';

type View = 'live' | 'sankey' | 'log';

export default function App() {
  const [activeView, setActiveView] = useState<View>('live');
  return (
    <MqttProvider>
      <nav className="nav-bar">
        <NavTabs activeView={activeView} onChange={setActiveView} />
        <ConnectionStatus />
      </nav>
      <div className="view-container">
        <div className={`view ${activeView === 'live' ? 'active' : ''}`}><LiveView /></div>
        <div className={`view ${activeView === 'sankey' ? 'active' : ''}`}><SankeyView /></div>
        <div className={`view ${activeView === 'log' ? 'active' : ''}`}><LogView /></div>
      </div>
    </MqttProvider>
  );
}
