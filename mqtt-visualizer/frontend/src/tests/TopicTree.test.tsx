import { render, screen, fireEvent } from '@testing-library/react';
import { TopicTree } from '../views/TopicTree';

const topics = {
  'home/sensor/temp': { lastPayload: '21.4', lastSeen: 1, msgRate: 1, history: [] },
  'home/sensor/humidity': { lastPayload: '62', lastSeen: 2, msgRate: 0.5, history: [] },
  'zigbee2mqtt/0x001/action': { lastPayload: 'single', lastSeen: 3, msgRate: 2, history: [] },
};

test('renders top-level nodes', () => {
  render(<TopicTree topics={topics} onSelectTopic={() => {}} selectedTopic={null} />);
  expect(screen.getByText('home')).toBeInTheDocument();
  expect(screen.getByText('zigbee2mqtt')).toBeInTheDocument();
});

test('expands subtopics on click', () => {
  render(<TopicTree topics={topics} onSelectTopic={() => {}} selectedTopic={null} />);
  fireEvent.click(screen.getByText('home'));
  expect(screen.getByText('sensor')).toBeInTheDocument();
});

test('search filters to matching paths', () => {
  render(<TopicTree topics={topics} onSelectTopic={() => {}} selectedTopic={null} />);
  fireEvent.change(screen.getByPlaceholderText('Filter topics…'), { target: { value: 'zigbee' } });
  expect(screen.queryByText('home')).not.toBeInTheDocument();
  expect(screen.getByText('zigbee2mqtt')).toBeInTheDocument();
});
