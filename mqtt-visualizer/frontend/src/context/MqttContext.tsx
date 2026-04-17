import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react';

export interface TopicState {
  lastPayload: string;
  lastSeen: number;
  msgRate: number;
  history: Array<{ payload: string; ts: number }>;
}

export interface PublisherState {
  topics: string[];
  msgRate: number;
  lastSeen: number;
}

export interface SubscriberState {
  connected: boolean;
  lastSeen: number;
}

export interface AppState {
  brokerStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  brokerMessage: string;
  topics: Record<string, TopicState>;
  publishers: Record<string, PublisherState>;
  subscribers: Record<string, SubscriberState>;
  wsConnected: boolean;
}

const HISTORY_MAX = 100;
const BACKOFF_MAX = 30000;

type Action =
  | { type: 'SNAPSHOT'; state: Omit<AppState, 'wsConnected' | 'brokerMessage'> }
  | { type: 'MESSAGE'; topic: string; payload: string; ts: number }
  | { type: 'BROKER_STATUS'; status: AppState['brokerStatus']; message?: string }
  | { type: 'CLIENT'; clientId: string; event: 'connected' | 'disconnected' }
  | { type: 'RATES'; topics: Record<string, number>; publishers: Record<string, number> }
  | { type: 'WS_CONNECTED'; value: boolean };

const initialState: AppState = {
  brokerStatus: 'connecting', brokerMessage: '', topics: {},
  publishers: {}, subscribers: {}, wsConnected: false,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SNAPSHOT':
      return { ...state, ...action.state, wsConnected: true };
    case 'MESSAGE': {
      const prev = state.topics[action.topic];
      const history = [...(prev?.history ?? []), { payload: action.payload, ts: action.ts }]
        .slice(-HISTORY_MAX);
      return { ...state, topics: { ...state.topics,
        [action.topic]: { ...prev, lastPayload: action.payload, lastSeen: action.ts,
          msgRate: prev?.msgRate ?? 0, history } } };
    }
    case 'BROKER_STATUS':
      return { ...state, brokerStatus: action.status, brokerMessage: action.message ?? '' };
    case 'CLIENT': {
      const sub = state.subscribers[action.clientId] ?? { connected: false, lastSeen: 0 };
      return { ...state, subscribers: { ...state.subscribers,
        [action.clientId]: { ...sub, connected: action.event === 'connected', lastSeen: Date.now() } } };
    }
    case 'RATES': {
      const topics = { ...state.topics };
      for (const [k, r] of Object.entries(action.topics)) {
        if (topics[k]) topics[k] = { ...topics[k], msgRate: r };
      }
      const publishers = { ...state.publishers };
      for (const [k, r] of Object.entries(action.publishers)) {
        if (publishers[k]) publishers[k] = { ...publishers[k], msgRate: r };
      }
      return { ...state, topics, publishers };
    }
    case 'WS_CONNECTED':
      return { ...state, wsConnected: action.value };
    default: return state;
  }
}

const MqttCtx = createContext<{ state: AppState }>({ state: initialState });

export function MqttProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const delayRef = useRef(1000);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let cancelled = false;

    function connect() {
      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
      // Use pathname prefix so WebSocket works under HA ingress subpaths
      const base = location.pathname.replace(/\/[^/]*$/, '');
      ws = new WebSocket(`${proto}//${location.host}${base}/ws`);
      ws.onopen = () => { delayRef.current = 1000; dispatch({ type: 'WS_CONNECTED', value: true }); };
      ws.onerror = () => {}; // onerror always precedes onclose; reconnect handled there
      ws.onmessage = (e) => {
        let msg: Record<string, unknown>;
        try {
          msg = JSON.parse(e.data) as Record<string, unknown>;
        } catch {
          return;
        }
        dispatch(
          msg.type === 'snapshot'
            ? { type: 'SNAPSHOT', state: msg.state as Omit<AppState, 'wsConnected' | 'brokerMessage'> }
          : msg.type === 'message'
            ? { type: 'MESSAGE', topic: msg.topic as string, payload: msg.payload as string, ts: msg.ts as number }
          : msg.type === 'broker_status'
            ? { type: 'BROKER_STATUS', status: msg.status as AppState['brokerStatus'], message: msg.message as string | undefined }
          : msg.type === 'client'
            ? { type: 'CLIENT', clientId: msg.clientId as string, event: msg.event as 'connected' | 'disconnected' }
          : msg.type === 'rates'
            ? { type: 'RATES', topics: msg.topics as Record<string, number>, publishers: msg.publishers as Record<string, number> }
          : { type: 'WS_CONNECTED', value: true }
        );
      };
      ws.onclose = () => {
        if (cancelled) return;
        dispatch({ type: 'WS_CONNECTED', value: false });
        dispatch({ type: 'BROKER_STATUS', status: 'error', message: 'Reconnecting to add-on…' });
        setTimeout(connect, delayRef.current);
        delayRef.current = Math.min(delayRef.current * 2, BACKOFF_MAX);
      };
    }

    connect();
    return () => { cancelled = true; ws?.close(); };
  }, []);

  return <MqttCtx.Provider value={{ state }}>{children}</MqttCtx.Provider>;
}

export function useMqtt() { return useContext(MqttCtx); }
