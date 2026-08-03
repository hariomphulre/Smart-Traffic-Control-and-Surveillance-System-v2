import { Request, Response, NextFunction } from 'express';
import { getRedis, CACHE_TTL } from '../config/redis';
import { isDbSchemaError } from '../lib/db-errors';
import { hashPassword } from '../lib/password';
import { UserModel } from '../models/user.model';

const IDENTITIES_CACHE_KEY = 'iam:identities:list';

async function invalidateIdentitiesCache() {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.del(IDENTITIES_CACHE_KEY);
  } catch {
    // ignore
  }
}

export const getIdentities = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const redis = getRedis();

    if (redis) {
      try {
        const cached = await redis.get(IDENTITIES_CACHE_KEY);
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
        await redis.setex(IDENTITIES_CACHE_KEY, CACHE_TTL.list, JSON.stringify(data));
      } catch {
        // ignore
      }
    }

    res.json({ data, total: data.length });
  } catch (err) {
    if (isDbSchemaError(err)) {
      res.json({ data: [], total: 0 });
      return;
    }
    next(err);
  }
};

export const deleteIdentities = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ids = Array.isArray(req.body?.ids)
      ? (req.body.ids as unknown[]).filter((id): id is string => typeof id === 'string' && id.length > 0)
      : [];

    if (ids.length === 0) {
      res.status(400).json({ error: 'At least one identity id is required' });
      return;
    }

    const deleted = await UserModel.deleteByIds(ids);
    await invalidateIdentitiesCache();
    res.json({ deleted, ids });
  } catch (err) {
    next(err);
  }
};

export const updateIdentity = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, username, password, role } = req.body ?? {};

    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Identity id is required' });
      return;
    }

    const existing = await UserModel.findById(id);
    if (!existing) {
      res.status(404).json({ error: 'Identity not found' });
      return;
    }

    const fields: { username?: string; passwordHash?: string; role?: string } = {};

    if (typeof username === 'string' && username.trim()) {
      const trimmed = username.trim();
      if (trimmed !== existing.username) {
        const conflict = await UserModel.findByUsername(trimmed);
        if (conflict) {
          res.status(409).json({ error: 'Username already exists' });
          return;
        }
        fields.username = trimmed;
      }
    }

    if (typeof password === 'string' && password.trim()) {
      fields.passwordHash = await hashPassword(password.trim());
    }

    if (typeof role === 'string' && ['user', 'admin', 'operator'].includes(role)) {
      fields.role = role;
    }

    const updated = await UserModel.update(id, fields);
    await invalidateIdentitiesCache();
    res.json({
      id: updated?.id ?? id,
      username: updated?.username ?? existing.username,
      role: updated?.role ?? existing.role,
    });
  } catch (err) {
    next(err);
  }
};
