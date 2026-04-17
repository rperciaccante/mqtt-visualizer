const { WebSocketServer } = require('ws');

function createWsServer(options = {}) {
  const wss = new WebSocketServer(options);

  wss.on('connection', (ws) => {
    // Send snapshot immediately on connect
    if (typeof wss.onSnapshotRequest === 'function') {
      const snapshot = wss.onSnapshotRequest();
      ws.send(JSON.stringify({ type: 'snapshot', state: snapshot }));
    }

    // onSnapshotRequest must be synchronous — async functions will produce undefined state
    ws.on('error', () => {}); // prevent unhandled errors from crashing
  });

  return wss;
}

function broadcast(wss, message) {
  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === 1 /* OPEN */) {
      client.send(data);
    }
  });
}

module.exports = { createWsServer, broadcast };
