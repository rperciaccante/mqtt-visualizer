const fs = require('fs');

function loadConfig(optionsPath = '/data/options.json') {
  try {
    const raw = fs.readFileSync(optionsPath, 'utf8');
    const opts = JSON.parse(raw);
    if (!opts.mqtt_host) return null;
    return {
      host: opts.mqtt_host,
      port: opts.mqtt_port || 1883,
      username: opts.mqtt_username ?? '',
      password: opts.mqtt_password ?? '',
      tls: opts.mqtt_tls ?? false,
      clientId: opts.mqtt_client_id ?? '',
    };
  } catch {
    // callers should log a diagnostic; null means both missing file and parse error
    return null;
  }
}

module.exports = { loadConfig };
