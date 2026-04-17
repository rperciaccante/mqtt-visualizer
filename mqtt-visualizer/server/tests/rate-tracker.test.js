// Jest 29 modern fake timers include Date.now() by default.
const { RateTracker } = require('../src/rate-tracker');

beforeEach(() => { jest.useFakeTimers(); });
afterEach(() => { jest.useRealTimers(); });

test('rate is 0 with no messages', () => {
  const rt = new RateTracker(10000);
  expect(rt.getRate()).toBe(0);
});

test('rate reflects message count over window', () => {
  const rt = new RateTracker(10000);
  rt.record(); rt.record(); rt.record(); // 3 messages
  jest.advanceTimersByTime(1000);
  // 3 messages in 10s window → 0.3/s
  expect(rt.getRate()).toBeCloseTo(0.3, 1);
});

test('old messages fall out of window', () => {
  const rt = new RateTracker(10000);
  rt.record(); rt.record();
  jest.advanceTimersByTime(11000); // advance past window
  expect(rt.getRate()).toBe(0);
});
