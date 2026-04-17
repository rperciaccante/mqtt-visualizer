import { render, screen, fireEvent } from '@testing-library/react';
import { TopicDetail } from '../components/TopicDetail';

const history = [
  { payload: 'hello', ts: 1000 },
  { payload: 'world', ts: 2000 },
];

test('shows topic path and last payload', () => {
  render(<TopicDetail topic="home/temp"
    data={{ lastPayload: '21.4', lastSeen: 2000, msgRate: 1, history }}
    onClose={() => {}} />);
  expect(screen.getByText('home/temp')).toBeInTheDocument();
  expect(screen.getByText('21.4')).toBeInTheDocument();
});

test('shows message history entries', () => {
  render(<TopicDetail topic="home/temp"
    data={{ lastPayload: '21.4', lastSeen: 2000, msgRate: 1, history }}
    onClose={() => {}} />);
  expect(screen.getByText('hello')).toBeInTheDocument();
  expect(screen.getByText('world')).toBeInTheDocument();
});

test('renders nothing when data is null', () => {
  const { container } = render(
    <TopicDetail topic={null} data={null} onClose={() => {}} />
  );
  expect(container.firstChild).toBeNull();
});

test('shows (empty) when lastPayload is empty string', () => {
  render(<TopicDetail topic="home/temp"
    data={{ lastPayload: '', lastSeen: 2000, msgRate: 1, history: [] }}
    onClose={() => {}} />);
  expect(screen.getByText('(empty)')).toBeInTheDocument();
});

test('renders history in reverse chronological order', () => {
  const { container } = render(<TopicDetail topic="home/temp"
    data={{ lastPayload: '21.4', lastSeen: 2000, msgRate: 1, history }}
    onClose={() => {}} />);
  const entries = container.querySelectorAll('.topic-detail__entry');
  expect(entries[0].querySelector('.entry-payload')?.textContent).toBe('world');
  expect(entries[1].querySelector('.entry-payload')?.textContent).toBe('hello');
});

test('calls onClose when close button clicked', () => {
  const onClose = vi.fn();
  render(<TopicDetail topic="home/temp"
    data={{ lastPayload: '21.4', lastSeen: 2000, msgRate: 1, history }}
    onClose={onClose} />);
  fireEvent.click(screen.getByRole('button'));
  expect(onClose).toHaveBeenCalled();
});
