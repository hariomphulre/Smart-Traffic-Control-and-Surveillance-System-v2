import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';

import pool               from './config/db';
import { getRedis }       from './config/redis';
import router             from './routes/index';
import { errorHandler, notFound } from './middleware/errorHandler';
import { startWatchers }  from './scripts/syncData';

const app: Application = express();
const PORT             = process.env.PORT ?? 3001;

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin:         process.env.FRONTEND_URL ?? 'http://localhost:3000',
    methods:        ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Body Parsers ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Request Logger ────────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}]  ${req.method}  ${req.url}`);
  next();
});

// ── Static Files ──────────────────────────────────────────────────────────────
// Serves: /uploads/... (synced images), /local_data/..., /recordings/...
app.use('/uploads', express.static(path.join(__dirname, '../../frontend/public/uploads')));
app.use('/local_data', express.static(path.join(__dirname, '..', 'static', 'local_data')));
app.use('/recordings', express.static(path.join(__dirname, '..', 'static', 'recordings')));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', async (_req: Request, res: Response) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status:    'OK',
      db:        'Neon PostgreSQL ✅',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', db: (err as Error).message });
  }
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api', router);

// ── Root ──────────────────────────────────────────────────────────────────────
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name:    'Traffic Management Platform API',
    version: '1.0.0',
    baseUrl: `http://localhost:${PORT}/api`,
    routes: {
      logs:      'GET /api/logs',
      challans: ['GET /api/challans', 'GET /api/challans/stats'],
      accidents: ['GET /api/accidents', 'GET /api/accidents/stats'],
      images:   ['GET /api/images/vehicles', 'GET /api/images/accidents'],
      analytics: [
        'GET /api/analytics/violations',
        'GET /api/analytics/vehicle-types',
        'GET /api/analytics/hourly-traffic',
        'GET /api/analytics/speed-distribution',
        'GET /api/analytics/stats',
        'GET /api/analytics/hotspots',
      ],
      ambulance: ['GET /api/ambulance/hospitals', 'GET /api/ambulance/signals', 'POST /api/ambulance/trigger-signal'],
    },
  });
});

// ── 404 & Error ───────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
getRedis(); // optional Redis connection for caching

// Start automatic data synchronization watchers
startWatchers();

app.listen(PORT, () => {
  console.log(`\n🚀  Server  →  http://localhost:${PORT}`);
  console.log(`❤️   Health  →  http://localhost:${PORT}/health`);
  console.log(`📋  Docs    →  http://localhost:${PORT}/\n`);
});

export default app;