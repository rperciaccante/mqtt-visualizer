const { createWsServer, broadcast } = require('../src/ws-server');
const { WebSocket } = require('ws');

test('new client receives snapshot on connect', (done) => {
  const wss = createWsServer({ port: 0 });
  wss.onSnapshotRequest = jest.fn(() => ({ brokerStatus: 'connected', topics: {}, publishers: {}, subscribers: {} }));

  wss.on('listening', () => {
    const { port } = wss.address();
    const client = new WebSocket(`ws://localhost:${port}`);
    client.on('message', (data) => {
      const msg = JSON.parse(data);
      expect(msg.type).toBe('snapshot');
      expect(wss.onSnapshotRequest).toHaveBeenCalledTimes(1);
      client.close();
      wss.close(done);
    });
  });
});

test('broadcast sends to all connected clients', (done) => {
  const wss = createWsServer({ port: 0 });
  wss.onSnapshotRequest = () => ({ brokerStatus: 'connected', topics: {}, publishers: {}, subscribers: {} });

  wss.on('listening', () => {
    const { port } = wss.address();
    const received = [];
    const c1 = new WebSocket(`ws://localhost:${port}`);
    const c2 = new WebSocket(`ws://localhost:${port}`);
    let opens = 0;
    [c1, c2].forEach(c => c.on('open', () => {
      opens++;
      if (opens === 2) {
        // clear snapshot messages first
        setTimeout(() => {
          c1.on('message', d => received.push(JSON.parse(d)));
          c2.on('message', d => received.push(JSON.parse(d)));
          broadcast(wss, { type: 'rates', topics: {}, publishers: {} });
          setTimeout(() => {
            expect(received.filter(m => m.type === 'rates').length).toBe(2);
            c1.close(); c2.close();
            wss.close(done);
          }, 50);
        }, 100);
      }
    }));
  });
});

test('connection without onSnapshotRequest does not crash', (done) => {
  const wss = createWsServer({ port: 0 });
  // intentionally NOT setting wss.onSnapshotRequest

  wss.on('listening', () => {
    const { port } = wss.address();
    const client = new WebSocket(`ws://localhost:${port}`);
    client.on('open', () => {
      // no crash — give it 50ms then clean up
      setTimeout(() => {
        client.close();
        wss.close(done);
      }, 50);
    });
  });
});
