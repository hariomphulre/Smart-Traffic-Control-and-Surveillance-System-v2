import { Request, Response, NextFunction } from 'express';
import { AnalyticsModel } from '../models/analytics.model';
import { getRedis, CACHE_TTL } from '../config/redis';

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

// Generic cache wrapper for analytics queries
const cacheWrapper =
  (
    fn: (q: Record<string, string>) => Promise<unknown>,
    cacheKeyFn: (q: Record<string, string>) => string,
    ttl: number = CACHE_TTL.analytics
  ): Handler =>
  async (req, res, next) => {
    try {
      const redis = getRedis();
      const cacheKey = cacheKeyFn(req.query as Record<string, string>);

      // Try to get from cache first
      if (redis) {
        try {
          const cached = await redis.get(cacheKey);
          if (cached) {
            console.log(`✅ Cache HIT: ${cacheKey}`);
            res.json(JSON.parse(cached));
            return;
          }
        } catch (cacheErr) {
          console.warn('⚠️ Cache read error:', (cacheErr as Error).message);
          // Fall through to DB query
        }
      }

      // Fetch from database
      const result = await fn(req.query as Record<string, string>);

      // Cache the result
      if (redis) {
        try {
          await redis.setex(cacheKey, ttl, JSON.stringify(result));
          console.log(`💾 Cache SET: ${cacheKey} (TTL: ${ttl}s)`);
        } catch (cacheErr) {
          console.warn('⚠️ Cache write error:', (cacheErr as Error).message);
          // Still return the result even if cache write fails
        }
      }

      res.json(result);
    } catch (err) {
      next(err);
    }
  };

// Cache key generators
const violationsCacheKey = (q: Record<string, string>) =>
  `analytics:violations:${q.from || 'all'}:${q.to || 'all'}`;

const vehicleTypesCacheKey = (q: Record<string, string>) =>
  `analytics:vehicleTypes:${q.from || 'all'}:${q.to || 'all'}`;

const hourlyTrafficCacheKey = (q: Record<string, string>) =>
  `analytics:hourlyTraffic:${q.from || 'all'}:${q.to || 'all'}`;

const speedDistribCacheKey = (q: Record<string, string>) =>
  `analytics:speedDistrib:${q.from || 'all'}:${q.to || 'all'}`;

const hotspotsCacheKey = (q: Record<string, string>) =>
  `analytics:hotspots:${q.from || 'all'}:${q.to || 'all'}`;

// Cached analytics endpoints
export const getViolations = cacheWrapper(
  (q) => AnalyticsModel.getViolations(q),
  violationsCacheKey,
  CACHE_TTL.analytics
);

export const getVehicleTypes = cacheWrapper(
  (q) => AnalyticsModel.getVehicleTypes(q),
  vehicleTypesCacheKey,
  CACHE_TTL.analytics
);

export const getHourlyTraffic = cacheWrapper(
  (q) => AnalyticsModel.getHourlyTraffic(q),
  hourlyTrafficCacheKey,
  CACHE_TTL.analytics
);

export const getSpeedDistrib = cacheWrapper(
  (q) => AnalyticsModel.getSpeedDistribution(q),
  speedDistribCacheKey,
  CACHE_TTL.analytics
);

export const getHotspots = cacheWrapper(
  (q) => AnalyticsModel.getHotspots(q),
  hotspotsCacheKey,
  CACHE_TTL.analytics
);

// Stats endpoint - with cache (slightly longer TTL as stats change less frequently)
export const getStats: Handler = async (_req, res, next) => {
  try {
    const redis = getRedis();
    const cacheKey = 'analytics:stats';

    // Try cache first
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          console.log('✅ Cache HIT: stats');
          res.json(JSON.parse(cached));
          return;
        }
      } catch (cacheErr) {
        console.warn('⚠️ Cache read error:', (cacheErr as Error).message);
      }
    }

    // Fetch from database
    const result = await AnalyticsModel.getStats();

    // Cache it for 2 minutes (stats change less frequently)
    if (redis) {
      try {
        await redis.setex(cacheKey, CACHE_TTL.stats, JSON.stringify(result));
        console.log(`💾 Cache SET: stats (TTL: ${CACHE_TTL.stats}s)`);
      } catch (cacheErr) {
        console.warn('⚠️ Cache write error:', (cacheErr as Error).message);
      }
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
};