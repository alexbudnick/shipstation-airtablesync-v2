import express from 'express';
import { CFG } from './config.js';
import { main as runSync } from './sync_locations.js';
import { describeError } from './http.js';

const app = express();
app.use(express.json());

function checkSecret(req, res, next) {
  if (!CFG.jobSecret) return next();
  if (req.query.secret === CFG.jobSecret || req.get('x-job-secret') === CFG.jobSecret) return next();
  return res.status(401).json({ ok: false, error: 'Unauthorized' });
}

app.get('/health', (req, res) => {
  res.json({ ok: true, app: 'shipstation-airtable-location-sync-v2', version: '1.0.0-v2-first' });
});

app.post('/jobs/sync-locations', checkSecret, async (req, res) => {
  try {
    const result = await runSync();
    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: describeError(err) });
  }
});

app.get('/', (req, res) => {
  res.type('html').send(`
    <h1>ShipStation Airtable Location Sync V2</h1>
    <p>Use Railway scheduled runs with <code>npm run sync-locations</code>.</p>
    <p>Health check: <a href="/health">/health</a></p>
    <p>Manual run uses POST <code>/jobs/sync-locations</code>${CFG.jobSecret ? ' with secret' : ''}.</p>
  `);
});

app.listen(CFG.port, () => {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level: 'info', message: `Listening on ${CFG.port}` }));
});
