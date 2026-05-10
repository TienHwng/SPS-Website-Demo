const path = require('node:path');
const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');
const { readState, writeState, resetState } = require('./server/store');

const app = express();
const port = Number(process.env.PORT || 3000);
const publicDir = __dirname;

app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '2mb' }));

function validateState(state) {
  return Boolean(
    state &&
    typeof state === 'object' &&
    state.pricingConfig &&
    state.systemParams &&
    state.users &&
    Array.isArray(state.parkingZones) &&
    Array.isArray(state.activeSessions) &&
    state.parkingHistory &&
    Array.isArray(state.transactions) &&
    Array.isArray(state.recentLogs) &&
    state.dispenserStatus &&
    Array.isArray(state.integrations)
  );
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'smart-parking-backend', time: new Date().toISOString() });
});

app.get('/api/state', async (req, res, next) => {
  try {
    res.json(await readState());
  } catch (error) {
    next(error);
  }
});

app.put('/api/state', async (req, res, next) => {
  try {
    if (!validateState(req.body)) {
      return res.status(400).json({ ok: false, error: 'Invalid parking state payload.' });
    }
    const saved = await writeState(req.body);
    res.json({ ok: true, savedAt: saved.updatedAt });
  } catch (error) {
    next(error);
  }
});

app.post('/api/reset', async (req, res, next) => {
  try {
    res.json(await resetState());
  } catch (error) {
    next(error);
  }
});

app.use(express.static(publicDir, {
  extensions: ['html'],
  maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0
}));

app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ ok: false, error: 'Internal server error.' });
});

app.listen(port, () => {
  console.log(`Smart Parking app listening on http://localhost:${port}`);
});
