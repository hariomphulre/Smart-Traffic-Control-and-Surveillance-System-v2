import http from 'http';
import { WebSocketServer } from 'ws';
import Redis from 'ioredis';

const PORT = Number(process.env.PORT || 8080);
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379/0';
const STATS_CHANNEL = process.env.STATS_CHANNEL || 'simulation:stats';
const TRAFFIC_JSON_PATH =
  process.env.TRAFFIC_JSON_PATH ||
  '/ml_service/traffic_signal_simulation/traffic.json';
const POLL_MS = Number(process.env.TRAFFIC_POLL_MS || 500);

const redisSub = new Redis(REDIS_URL);
const clients = new Set();

function broadcast(text) {
  for (const ws of clients) {
    if (ws.readyState === ws.OPEN) {
      ws.send(text);
    }
  }
}

async function readTrafficFile() {
  try {
    const fs = await import('fs/promises');
    const raw = await fs.readFile(TRAFFIC_JSON_PATH, 'utf8');
    const data = JSON.parse(raw);
    data.ts = Math.floor(Date.now() / 1000);
    return JSON.stringify(data);
  } catch {
    return null;
  }
}

const server = http.createServer();
const wss = new WebSocketServer({ server, path: '/ws/analytics' });

wss.on('connection', (ws) => {
  clients.add(ws);
  readTrafficFile().then((snap) => {
    if (snap) ws.send(snap);
  });
  ws.on('close', () => clients.delete(ws));
});

redisSub.subscribe(STATS_CHANNEL, (err) => {
  if (err) console.error('Redis subscribe failed:', err.message);
  else console.log(`Subscribed to ${STATS_CHANNEL}`);
});

redisSub.on('message', (_channel, message) => {
  if (message) broadcast(String(message));
});

setInterval(async () => {
  if (clients.size === 0) return;
  const snap = await readTrafficFile();
  if (snap) broadcast(snap);
}, POLL_MS);

server.listen(PORT, () => {
  console.log(`WebSocket service listening on :${PORT} (path /ws/analytics)`);
});
