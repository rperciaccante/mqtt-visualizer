import { render } from '@testing-library/react';
import { SankeyChart } from '../views/SankeyChart';

const topics = { 'home/temp': { lastPayload: '21', lastSeen: 1, msgRate: 2, history: [] } };
const subscribers = { 'nodered': { connected: true, lastSeen: 1 } };

test('renders an svg element', () => {
  const { container } = render(
    <SankeyChart topics={topics} subscribers={subscribers}
      onSelectNode={() => {}} width={600} height={400} />
  );
  expect(container.querySelector('svg')).not.toBeNull();
});

test('renders topic and subscriber nodes', () => {
  const { getByText } = render(
    <SankeyChart topics={topics} subscribers={subscribers}
      onSelectNode={() => {}} width={600} height={400} />
  );
  expect(getByText('home/temp')).toBeInTheDocument();
  expect(getByText('nodered')).toBeInTheDocument();
});

test('renders topic activity chart when no subscribers', () => {
  const { container } = render(
    <SankeyChart topics={topics} subscribers={{}}
      onSelectNode={() => {}} width={600} height={400} />
  );
  expect(container.querySelector('svg')).not.toBeNull();
  expect(container.querySelector('rect')).not.toBeNull();
});
