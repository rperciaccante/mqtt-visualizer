// server/tests/config.test.js
const path = require('path');
const fs = require('fs');
const os = require('os');
const { loadConfig } = require('../src/config');

let tmpDir;
beforeEach(() => { tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mqtt-cfg-')); });
afterEach(() => { fs.rmSync(tmpDir, { recursive: true }); });

function writeOptions(obj) {
  fs.writeFileSync(path.join(tmpDir, 'options.json'), JSON.stringify(obj));
}

test('returns parsed config when mqtt_host is set', () => {
  writeOptions({ mqtt_host: 'localhost', mqtt_port: 1883, mqtt_username: '', mqtt_password: '', mqtt_tls: false });
  const cfg = loadConfig(path.join(tmpDir, 'options.json'));
  expect(cfg.host).toBe('localhost');
  expect(cfg.port).toBe(1883);
  expect(cfg.tls).toBe(false);
  expect(cfg.username).toBe('');
  expect(cfg.password).toBe('');
});

test('returns null when mqtt_host is empty', () => {
  writeOptions({ mqtt_host: '', mqtt_port: 1883, mqtt_username: '', mqtt_password: '', mqtt_tls: false });
  expect(loadConfig(path.join(tmpDir, 'options.json'))).toBeNull();
});

test('returns null when options file is missing', () => {
  expect(loadConfig(path.join(tmpDir, 'nonexistent.json'))).toBeNull();
});
