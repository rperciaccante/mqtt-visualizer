import { render, screen, act } from '@testing-library/react';
import { MqttProvider, useMqtt } from '../context/MqttContext';
import { vi } from 'vitest';

// Mock WebSocket
class MockWS {
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  send = vi.fn();
  close = vi.fn();
  readyState = 1;
}

let mockWsInstance: MockWS;
vi.stubGlobal('WebSocket', class {
  constructor() { mockWsInstance = new MockWS(); return mockWsInstance; }
});

function TestConsumer() {
  const { state } = useMqtt();
  return <div data-testid="status">{state.brokerStatus}</div>;
}

test('initial state is connecting', () => {
  render(<MqttProvider><TestConsumer /></MqttProvider>);
  expect(screen.getByTestId('status').textContent).toBe('connecting');
});

test('snapshot message updates broker status', () => {
  render(<MqttProvider><TestConsumer /></MqttProvider>);
  act(() => {
    mockWsInstance.onmessage?.({
      data: JSON.stringify({ type: 'snapshot', state: {
        brokerStatus: 'connected', topics: {}, publishers: {}, subscribers: {}
      }})
    });
  });
  expect(screen.getByTestId('status').textContent).toBe('connected');
});
