import fs from 'fs/promises';
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379/0';
const STATS_CHANNEL = process.env.STATS_CHANNEL || 'simulation:stats';
const TRAFFIC_JSON_PATH =
  process.env.TRAFFIC_JSON_PATH ||
  '/ml_service/traffic_signal_simulation/traffic.json';
const POLL_MS = Number(process.env.TRAFFIC_POLL_MS || 500);

const redis = new Redis(REDIS_URL);
let lastPayload = '';

async function publishTrafficSnapshot() {
  try {
    const raw = await fs.readFile(TRAFFIC_JSON_PATH, 'utf8');
    const data = JSON.parse(raw);
    data.ts = Math.floor(Date.now() / 1000);
    const payload = JSON.stringify(data);
    if (payload === lastPayload) return;
    lastPayload = payload;
    await redis.set('simulation:latest_stats', payload);
    await redis.publish(STATS_CHANNEL, payload);
  } catch (err) {
    if (process.env.DEBUG === 'true') {
      console.warn('traffic publish skip:', err.message);
    }
  }
}

console.log(`Worker publishing traffic.json -> Redis (${STATS_CHANNEL}) every ${POLL_MS}ms`);
setInterval(publishTrafficSnapshot, POLL_MS);
publishTrafficSnapshot();
