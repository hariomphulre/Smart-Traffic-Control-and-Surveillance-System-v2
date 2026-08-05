import { Request, Response, NextFunction } from 'express';
import { getRedis } from '../config/redis';
import { isDbSchemaError } from '../lib/db-errors';
import { RoleModel } from '../models/role.model';
import type { LocationScope, UserLocation } from '../models/user.model';

const ROLES_CACHE_KEY = 'iam:roles:list';

async function invalidateRolesCache() {
  const redis = getRedis();
  if (!redis) return;
  try {
    const keys = await redis.keys(`${ROLES_CACHE_KEY}*`);
    if (keys.length > 0) await redis.del(...keys);
  } catch {
    try {
      await redis.del(ROLES_CACHE_KEY);
    } catch {
      // ignore
    }
  }
}

function parseLocationFilter(query: Record<string, unknown>) {
  const state = typeof query.state === 'string' && query.state ? query.state : null;
  const city = typeof query.city === 'string' && query.city ? query.city : null;
  const squareId =
    typeof query.squareId === 'string' && query.squareId
      ? query.squareId
      : typeof query.square_id === 'string' && query.square_id
        ? query.square_id
        : null;

  return { state, city, squareId };
}

function parseLocationBody(body: Record<string, unknown>): UserLocation | null {
  const location = (body.location ?? body) as Record<string, unknown>;
  const scope = location.scope as string | undefined;
  const validScopes: LocationScope[] = ['national', 'state', 'city', 'square'];
  if (!scope || !validScopes.includes(scope as LocationScope)) return null;

  const country = String(location.country ?? 'India').trim() || 'India';
  const state = location.state ? String(location.state).trim() : null;
  const city = location.city ? String(location.city).trim() : null;
  const area = location.area ? String(location.area).trim() : null;
  const squareId = location.squareId
    ? String(location.squareId).trim()
    : location.square_id
      ? String(location.square_id).trim()
      : null;

  const locationPath =
    scope === 'national'
      ? country
      : scope === 'state'
        ? state || ''
        : scope === 'city'
          ? [state, city].filter(Boolean).join('/')
          : [state, city, area, squareId].filter(Boolean).join('/');

  return {
    scope: scope as LocationScope,
    country,
    state: scope === 'national' ? null : state,
    city: scope === 'national' || scope === 'state' ? null : city,
    area: scope === 'square' ? area : null,
    squareId: scope === 'square' ? squareId : null,
    locationPath,
  };
}

export const getRoles = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filter = parseLocationFilter(req.query as Record<string, unknown>);
    const cacheSuffix = [filter.state, filter.city, filter.squareId].filter(Boolean).join('|') || 'all';
    const redis = getRedis();
    if (redis) {
      try {
        const cached = await redis.get(`${ROLES_CACHE_KEY}:${cacheSuffix}`);
        if (cached) {
          const data = JSON.parse(cached);
          res.json({ data, total: data.length });
          return;
        }
      } catch {
        // fall through
      }
    }

    const data = await RoleModel.list(filter);
    if (redis) {
      try {
        await redis.setex(`${ROLES_CACHE_KEY}:${cacheSuffix}`, 60, JSON.stringify(data));
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

export const createRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const description = typeof req.body?.description === 'string' ? req.body.description : '';
    const services = Array.isArray(req.body?.services)
      ? req.body.services.filter((s: unknown): s is string => typeof s === 'string')
      : [];

    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const location = parseLocationBody(req.body ?? {});
    if (!location) {
      res.status(400).json({ error: 'Valid location is required for custom roles' });
      return;
    }

    const existing = await RoleModel.findByTitle(title);
    if (existing) {
      res.status(409).json({ error: 'Role title already exists' });
      return;
    }

    const role = await RoleModel.create({ title, description, services, location });
    await invalidateRolesCache();
    res.status(201).json(role);
  } catch (err) {
    next(err);
  }
};

export const updateRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = typeof req.body?.id === 'string' ? req.body.id : '';
    if (!id) {
      res.status(400).json({ error: 'Role id is required' });
      return;
    }

    const fields: {
      title?: string;
      description?: string;
      services?: string[];
      location?: UserLocation;
    } = {};
    if (typeof req.body?.title === 'string') fields.title = req.body.title;
    if (typeof req.body?.description === 'string') fields.description = req.body.description;
    if (Array.isArray(req.body?.services)) {
      fields.services = req.body.services.filter((s: unknown): s is string => typeof s === 'string');
    }
    if (req.body?.location && typeof req.body.location === 'object') {
      const parsed = parseLocationBody(req.body);
      if (!parsed) {
        res.status(400).json({ error: 'Invalid location payload' });
        return;
      }
      fields.location = parsed;
    }

    if (fields.title) {
      const conflict = await RoleModel.findByTitle(fields.title.trim());
      if (conflict && conflict.id !== id) {
        res.status(409).json({ error: 'Role title already exists' });
        return;
      }
    }

    const updated = await RoleModel.update(id, fields);
    if (!updated) {
      res.status(404).json({ error: 'Role not found' });
      return;
    }
    await invalidateRolesCache();
    res.json(updated);
  } catch (err) {
    if (err instanceof Error && err.message.includes('Predefined')) {
      res.status(403).json({ error: err.message });
      return;
    }
    next(err);
  }
};

export const deleteRoles = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ids = Array.isArray(req.body?.ids)
      ? req.body.ids.filter((id: unknown): id is string => typeof id === 'string' && id.length > 0)
      : [];
    if (ids.length === 0) {
      res.status(400).json({ error: 'At least one role id is required' });
      return;
    }
    const deleted = await RoleModel.deleteByIds(ids);
    await invalidateRolesCache();
    res.json({ deleted, ids });
  } catch (err) {
    next(err);
  }
};
