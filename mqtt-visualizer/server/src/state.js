const { RateTracker } = require('./rate-tracker');

const HISTORY_MAX = 100;
const SNAPSHOT_HISTORY = 20;

function createState() {
  return {
    brokerStatus: 'connecting',
    topics: {},
    publishers: {},
    subscribers: {},
  };
}

function applyMessage(state, { topic, payload, ts, publisherHint }) {
  if (!state.topics[topic]) {
    state.topics[topic] = { lastPayload: '', lastSeen: 0, history: [], _rate: new RateTracker() };
  }
  const t = state.topics[topic];
  t.lastPayload = payload;
  t.lastSeen = ts;
  t._rate.record(); // NOTE: uses wall-clock time, not message ts
  t.history.push({ payload, ts });
  if (t.history.length > HISTORY_MAX) t.history.shift();

  if (publisherHint) {
    if (!state.publishers[publisherHint]) {
      state.publishers[publisherHint] = { topics: [], lastSeen: 0, _rate: new RateTracker() };
    }
    const p = state.publishers[publisherHint];
    if (!p.topics.includes(topic)) p.topics.push(topic);
    p.lastSeen = ts;
    p._rate.record();
  }
}

function applyClientEvent(state, { clientId, event, ts }) {
  if (!state.subscribers[clientId]) {
    state.subscribers[clientId] = { connected: false, lastSeen: 0 };
  }
  state.subscribers[clientId].connected = event === 'connected';
  state.subscribers[clientId].lastSeen = ts;
}

function buildSnapshot(state) {
  const topics = {};
  for (const [k, v] of Object.entries(state.topics)) {
    topics[k] = {
      lastPayload: v.lastPayload,
      lastSeen: v.lastSeen,
      msgRate: v._rate.getRate(),
      history: v.history.slice(-SNAPSHOT_HISTORY),
    };
  }
  const publishers = {};
  for (const [k, v] of Object.entries(state.publishers)) {
    publishers[k] = { topics: v.topics, msgRate: v._rate.getRate(), lastSeen: v.lastSeen };
  }
  const subscribers = {};
  for (const [k, v] of Object.entries(state.subscribers)) {
    subscribers[k] = { connected: v.connected, lastSeen: v.lastSeen };
  }
  return { brokerStatus: state.brokerStatus, topics, publishers, subscribers };
}

function buildRates(state) {
  const topics = {};
  for (const [k, v] of Object.entries(state.topics)) topics[k] = v._rate.getRate();
  const publishers = {};
  for (const [k, v] of Object.entries(state.publishers)) publishers[k] = v._rate.getRate();
  return { topics, publishers };
}

module.exports = { createState, applyMessage, applyClientEvent, buildSnapshot, buildRates };
