import { Request, Response, NextFunction } from 'express';
import { getRedis, CACHE_TTL } from '../config/redis';
import { UserModel } from '../models/user.model';

export const getIdentities = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const redis = getRedis();
    const cacheKey = 'iam:identities:list';

    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          res.json({ data: JSON.parse(cached), total: JSON.parse(cached).length });
          return;
        }
      } catch {
        // fall through
      }
    }

    const data = await UserModel.listIdentities();

    if (redis) {
      try {
        await redis.setex(cacheKey, CACHE_TTL.list, JSON.stringify(data));
      } catch {
        // ignore
      }
    }

    res.json({ data, total: data.length });
  } catch (err) {
    next(err);
  }
};
