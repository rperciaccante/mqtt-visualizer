const mqtt = require('mqtt');

const BACKOFF_MAX = 30000;

function createMqttClient({ config, onMessage, onStatus, onClientEvent }) {
  let delay = 1000;
  let client = null;
  let reconnecting = false;

  function connect() {
    onStatus('connecting');
    const url = `${config.tls ? 'mqtts' : 'mqtt'}://${config.host}:${config.port}`;
    client = mqtt.connect(url, {
      username: config.username || undefined,
      password: config.password || undefined,
      reconnectPeriod: 0, // manual backoff
      clientId: config.clientId || `mqtt-visualizer-${Math.random().toString(16).slice(2, 8)}`,
    });

    client.on('connect', () => {
      delay = 1000;
      onStatus('connected');
      client.subscribe(['#', '$SYS/#'], { qos: 0 }, () => {});
    });

    client.on('message', (topic, payloadBuf) => {
      const payload = payloadBuf.toString();
      const ts = Date.now();

      // Parse $SYS client connect/disconnect events
      const sysConnect = topic.match(/^\$SYS\/broker\/clients\/(.+)\/connected$/);
      const sysDisconnect = topic.match(/^\$SYS\/broker\/clients\/(.+)\/disconnected$/);
      if (sysConnect) return onClientEvent({ clientId: sysConnect[1], event: 'connected', ts });
      if (sysDisconnect) return onClientEvent({ clientId: sysDisconnect[1], event: 'disconnected', ts });
      if (topic.startsWith('$SYS/')) return; // ignore other $SYS topics

      onMessage({ topic, payload, ts, publisherHint: null });
    });

    client.on('error', (err) => {
      onStatus('error', err.message);
      client.end(true); // triggers 'close', which schedules reconnect
    });

    client.on('close', () => {
      if (reconnecting) return;
      reconnecting = true;
      onStatus('disconnected');
      scheduleReconnect();
    });
  }

  function scheduleReconnect() {
    reconnecting = false;
    if (client) { client.end(true); client = null; }
    setTimeout(connect, delay);
    delay = Math.min(delay * 2, BACKOFF_MAX);
  }

  connect();
  return { end: () => client && client.end(true) };
}

module.exports = { createMqttClient };
