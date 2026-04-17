import { useState } from 'react';
import { useMqtt } from '../context/MqttContext';

type TestState = 'idle' | 'loading' | 'ok' | 'error';

export function ConnectionStatus() {
  const { state } = useMqtt();
  const label = state.wsConnected ? state.brokerStatus : 'ws disconnected';
  const dotClass = state.wsConnected ? state.brokerStatus : 'disconnected';
  const [testState, setTestState] = useState<TestState>('idle');
  const [testMsg, setTestMsg] = useState('');

  async function runTest() {
    setTestState('loading');
    setTestMsg('');
    try {
      const res = await fetch('./api/test');
      const data = await res.json() as { ok: boolean; message: string };
      setTestState(data.ok ? 'ok' : 'error');
      setTestMsg(data.message);
    } catch {
      setTestState('error');
      setTestMsg('Request failed');
    }
  }

  return (
    <div className="connection-status">
      <div className={`dot ${dotClass}`} />
      <span>{label}{state.brokerMessage ? ` — ${state.brokerMessage}` : ''}</span>
      <button className="test-btn" onClick={runTest} disabled={testState === 'loading'}>
        {testState === 'loading' ? '…' : 'Test'}
      </button>
      {testState !== 'idle' && testState !== 'loading' && (
        <span className={`test-result ${testState}`} title={testMsg}>{testMsg}</span>
      )}
    </div>
  );
}
