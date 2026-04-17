const http = require('http');
const path = require('path');
const fs = require('fs');
const mqtt = require('mqtt');
const { loadConfig } = require('./config');
const { createState, applyMessage, applyClientEvent, buildSnapshot, buildRates } = require('./state');
const { createMqttClient } = require('./mqtt-client');
const { createWsServer, broadcast } = require('./ws-server');

const PORT = 8099;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const state = createState();
const config = loadConfig();

// HTTP server: serve static files + upgrade WebSocket
const httpServer = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = new URL(req.url, 'http://localhost').pathname;
  } catch {
    res.writeHead(400); res.end('Bad request'); return;
  }

  if (pathname === '/api/test') {
    const cfg = loadConfig();
    if (!cfg || !cfg.host) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, message: 'Not configured — set mqtt_host in add-on options' }));
      return;
    }
    const url = `${cfg.tls ? 'mqtts' : 'mqtt'}://${cfg.host}:${cfg.port}`;
    const testClient = mqtt.connect(url, {
      username: cfg.username || undefined,
      password: cfg.password || undefined,
      reconnectPeriod: 0,
      connectTimeout: 5000,
      clientId: cfg.clientId || `mqtt-vis-test-${Math.random().toString(16).slice(2, 8)}`,
    });
    let responded = false;
    function reply(ok, message) {
      if (responded) return;
      responded = true;
      testClient.end(true);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok, message }));
    }
    testClient.on('connect', () => {
      console.log(`[TEST] Connected to ${cfg.host}:${cfg.port}`);
      reply(true, `Connected to ${cfg.host}:${cfg.port}`);
    });
    testClient.on('error', (err) => {
      console.log(`[TEST] Connection to ${cfg.host}:${cfg.port} failed: ${err.message}`);
      reply(false, err.message);
    });
    setTimeout(() => {
      console.log(`[TEST] Connection to ${cfg.host}:${cfg.port} timed out`);
      reply(false, 'Connection timed out');
    }, 5500);
    return;
  }

  const safePath = path.normalize(path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname));
  if (!safePath.startsWith(PUBLIC_DIR + path.sep) && safePath !== PUBLIC_DIR) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  fs.readFile(safePath, (err, data) => {
    if (err) {
      fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (e2, d2) => {
        if (e2) { res.writeHead(404); res.end('Not found'); return; }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(d2);
      });
      return;
    }
    const ext = path.extname(safePath);
    const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html',
                    '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

// WebSocket server attached to same HTTP server
const wss = createWsServer({ server: httpServer });
wss.onSnapshotRequest = () => buildSnapshot(state);

// Broadcast rate tick every 2 seconds
setInterval(() => {
  broadcast(wss, { type: 'rates', ...buildRates(state) });
}, 2000);

// MQTT
if (!config) {
  state.brokerStatus = 'error';
  broadcast(wss, { type: 'broker_status', status: 'error', message: 'Not configured — set mqtt_host in add-on options' });
  console.log('MQTT not configured. Set mqtt_host in add-on options.');
} else {
  createMqttClient({
    config,
    onMessage: (msg) => {
      applyMessage(state, msg);
      broadcast(wss, { type: 'message', ...msg });
    },
    onStatus: (status, message) => {
      state.brokerStatus = status;
      if (status === 'connected') console.log(`[MQTT] Connected to ${config.host}:${config.port}`);
      else if (status === 'disconnected') console.log('[MQTT] Disconnected — reconnecting...');
      else if (status === 'error') console.log(`[MQTT] Connection error: ${message}`);
      broadcast(wss, { type: 'broker_status', status, message: message || undefined });
    },
    onClientEvent: (evt) => {
      applyClientEvent(state, evt);
      broadcast(wss, { type: 'client', ...evt });
    },
  });
}

httpServer.listen(PORT, () => console.log(`MQTT Visualizer listening on port ${PORT}`));
