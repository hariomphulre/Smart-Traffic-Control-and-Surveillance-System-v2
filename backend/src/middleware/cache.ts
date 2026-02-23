import { Request, Response, NextFunction } from 'express';
import { getRedis } from '../config/redis';

function cacheKey(req: Request): string {
  const path = req.originalUrl.split('?')[0];
  const q = { ...req.query };
  const sorted = Object.keys(q)
    .sort()
    .map((k) => `${k}=${q[k]}`)
    .join('&');
  return `${path}${sorted ? `?${sorted}` : ''}`;
}

/**
 * Cache middleware. Use after route path is set.
 * TTL in seconds.
 * If Redis is unavailable, passes through to the next handler.
 */
export function cache(ttlSeconds: number) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.method !== 'GET') return next();

    const redis = getRedis();
    if (!redis) return next();

    const key = `cache:${cacheKey(req)}`;

    try {
      const cached = await redis.get(key);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        res.json(JSON.parse(cached));
        return;
      }
    } catch (_) {
      return next();
    }

    res.setHeader('X-Cache', 'MISS');
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      redis.setex(key, ttlSeconds, JSON.stringify(body)).catch(() => {});
      return originalJson(body);
    };
    next();
  };
}
