const { createState, applyMessage, applyClientEvent, buildSnapshot, buildRates } = require('../src/state');

test('applying a message adds topic with payload', () => {
  const state = createState();
  applyMessage(state, { topic: 'home/temp', payload: '21.4', ts: 1000, publisherHint: 'esphome' });
  expect(state.topics['home/temp'].lastPayload).toBe('21.4');
  expect(state.topics['home/temp'].lastSeen).toBe(1000);
});

test('history ring buffer caps at 100', () => {
  const state = createState();
  for (let i = 0; i < 105; i++) {
    applyMessage(state, { topic: 'a/b', payload: String(i), ts: i, publisherHint: null });
  }
  expect(state.topics['a/b'].history.length).toBe(100);
  expect(state.topics['a/b'].history[99].payload).toBe('104');
});

test('publisher registry tracks topics', () => {
  const state = createState();
  applyMessage(state, { topic: 'a/b', payload: 'x', ts: 1, publisherHint: 'client1' });
  applyMessage(state, { topic: 'a/c', payload: 'y', ts: 2, publisherHint: 'client1' });
  expect(state.publishers['client1'].topics).toContain('a/b');
  expect(state.publishers['client1'].topics).toContain('a/c');
});

test('applyClientEvent marks subscriber connected', () => {
  const state = createState();
  applyClientEvent(state, { clientId: 'node-red', event: 'connected', ts: 1000 });
  expect(state.subscribers['node-red'].connected).toBe(true);
});

test('snapshot truncates history to 20', () => {
  const state = createState();
  for (let i = 0; i < 50; i++) {
    applyMessage(state, { topic: 'x/y', payload: String(i), ts: i, publisherHint: null });
  }
  const snap = buildSnapshot(state);
  expect(snap.topics['x/y'].history.length).toBe(20);
});

test('buildRates returns topic and publisher rates', () => {
  const state = createState();
  applyMessage(state, { topic: 'a/b', payload: 'x', ts: 1, publisherHint: 'client1' });
  const rates = buildRates(state);
  expect(typeof rates.topics['a/b']).toBe('number');
  expect(typeof rates.publishers['client1']).toBe('number');
});
