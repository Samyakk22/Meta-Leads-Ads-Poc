const http = require('http');
const express = require('express');
const { config, assertConfig } = require('./config');
const webhookRouter = require('./webhook');
const leadStore = require('./leadStore');
const realtime = require('./realtime');

assertConfig();
const app = express();

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    leads: leadStore.count(),
    connectedClients: realtime.clientCount(),
  });
});

app.use('/webhook', webhookRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error('[server] unhandled error:', err);
  return res.status(500).json({ error: 'Internal server error' });
});

const server = http.createServer(app);
realtime.init(server);

server.listen(config.port, () => {
  console.log(`Backend listening on http://localhost:${config.port}`);
  console.log(`  Health check: GET  /health`);
  console.log(`  Meta webhook: GET/POST /webhook`);
});
