import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

let client: Redis | null = null;

function connect(): Redis | null {
  if (client) return client;
  try {
    client = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 2000)),
      lazyConnect: true,
    });
    client.on('connect', () => console.log('✅ Connected to Redis'));
    client.on('error', (err) => console.warn('⚠️ Redis error:', err.message));
    return client;
  } catch (err) {
    console.warn('⚠️ Redis unavailable, running without cache:', (err as Error).message);
    return null;
  }
}

export function getRedis(): Redis | null {
  return client ?? connect();
}

export async function disconnect(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}

export const CACHE_TTL = {
  analytics: 60,       // 1 min
  stats:     120,      // 2 min
  list:      30,       // 30 sec
};
