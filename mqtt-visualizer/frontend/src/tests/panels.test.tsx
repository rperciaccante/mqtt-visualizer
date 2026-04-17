import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { ClientCard } from '../components/ClientCard';
import { PublisherPanel } from '../views/PublisherPanel';
import { SubscriberPanel } from '../views/SubscriberPanel';

// Mock useMqtt so panel tests control the state without a WebSocket
vi.mock('../context/MqttContext', () => ({
  useMqtt: vi.fn(),
}));

import { useMqtt } from '../context/MqttContext';
const mockUseMqtt = vi.mocked(useMqtt);

// ---------------------------------------------------------------------------
// ClientCard tests
// ---------------------------------------------------------------------------

test('publisher card renders clientId, rate, and topic tags', () => {
  render(
    <ClientCard
      clientId="publisher-abc"
      msgRate={3.5}
      topics={['sensors/temp', 'sensors/humidity']}
      variant="publisher"
    />
  );
  expect(screen.getByText('publisher-abc')).toBeInTheDocument();
  expect(screen.getByText('3.5/s')).toBeInTheDocument();
  expect(screen.getByText('sensors/temp')).toBeInTheDocument();
  expect(screen.getByText('sensors/humidity')).toBeInTheDocument();
});

test('subscriber card renders clientId and connected/idle status', () => {
  const { rerender } = render(
    <ClientCard clientId="sub-001" connected={true} variant="subscriber" />
  );
  expect(screen.getByText('sub-001')).toBeInTheDocument();
  expect(screen.getByText('connected')).toBeInTheDocument();

  rerender(<ClientCard clientId="sub-001" connected={false} variant="subscriber" />);
  expect(screen.getByText('idle')).toBeInTheDocument();
});

// ---------------------------------------------------------------------------
// PublisherPanel tests
// ---------------------------------------------------------------------------

test('PublisherPanel empty state shows "No publishers seen"', () => {
  mockUseMqtt.mockReturnValue({
    state: {
      brokerStatus: 'connected',
      brokerMessage: '',
      topics: {},
      publishers: {},
      subscribers: {},
      wsConnected: true,
    },
  });
  render(<PublisherPanel />);
  expect(screen.getByText('No publishers seen')).toBeInTheDocument();
});

test('PublisherPanel non-empty state renders client ID', () => {
  mockUseMqtt.mockReturnValue({
    state: {
      brokerStatus: 'connected',
      brokerMessage: '',
      topics: {},
      publishers: {
        'zigbee2mqtt': { topics: ['zigbee2mqtt/sensor'], msgRate: 5, lastSeen: 0 },
      },
      subscribers: {},
      wsConnected: true,
    },
  });
  render(<PublisherPanel />);
  expect(screen.getByText('zigbee2mqtt')).toBeInTheDocument();
});

// ---------------------------------------------------------------------------
// SubscriberPanel tests
// ---------------------------------------------------------------------------

test('SubscriberPanel empty state shows "No subscribers seen"', () => {
  mockUseMqtt.mockReturnValue({
    state: {
      brokerStatus: 'connected',
      brokerMessage: '',
      topics: {},
      publishers: {},
      subscribers: {},
      wsConnected: true,
    },
  });
  render(<SubscriberPanel />);
  expect(screen.getByText('No subscribers seen')).toBeInTheDocument();
});

test('SubscriberPanel non-empty state renders client ID', () => {
  mockUseMqtt.mockReturnValue({
    state: {
      brokerStatus: 'connected',
      brokerMessage: '',
      topics: {},
      publishers: {},
      subscribers: {
        'node-red': { connected: true, lastSeen: 0 },
      },
      wsConnected: true,
    },
  });
  render(<SubscriberPanel />);
  expect(screen.getByText('node-red')).toBeInTheDocument();
});
