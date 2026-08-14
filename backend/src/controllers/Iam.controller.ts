import { Request, Response, NextFunction } from 'express';
import { getRedis, CACHE_TTL } from '../config/redis';
import { isDbSchemaError } from '../lib/db-errors';
import { RoleModel } from '../models/role.model';
import { UserModel, type LocationScope, type UserLocation } from '../models/user.model';
import type { AuditChange } from '../models/audit.model';
import { pushChange, recordAuditFromReq } from '../services/audit.service';

function identityRoles(row: { roles?: string[] | null; role?: string | null }): string[] {
  if (Array.isArray(row.roles) && row.roles.length > 0) return row.roles;
  if (row.role) return [row.role];
  return ['User'];
}

function identitySnapshotChanges(
  before: { username: string; roles?: string[] | null; role?: string | null; location_path?: string | null },
  after: { username: string; roles?: string[] | null; role?: string | null; location_path?: string | null } | null,
  action: 'create' | 'update' | 'delete'
): AuditChange[] {
  const changes: AuditChange[] = [];
  if (action === 'create') {
    pushChange(changes, 'Username', null, after?.username ?? before.username);
    pushChange(changes, 'Roles', null, identityRoles(after ?? before));
    pushChange(changes, 'Origin', null, after?.location_path ?? before.location_path);
    return changes;
  }
  if (action === 'delete') {
    pushChange(changes, 'Username', before.username, null);
    pushChange(changes, 'Roles', identityRoles(before), null);
    pushChange(changes, 'Origin', before.location_path, null);
    return changes;
  }
  pushChange(changes, 'Username', before.username, after?.username);
  pushChange(changes, 'Roles', identityRoles(before), identityRoles(after ?? before));
  pushChange(changes, 'Origin', before.location_path, after?.location_path);
  return changes;
}

const IDENTITIES_CACHE_KEY = 'iam:identities:list';

async function invalidateIdentitiesCache() {
  const redis = getRedis();
  if (!redis) return;
  try {
    const keys = await redis.keys(`${IDENTITIES_CACHE_KEY}*`);
    if (keys.length > 0) await redis.del(...keys);
  } catch {
    try {
      await redis.del(IDENTITIES_CACHE_KEY);
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

export const getIdentities = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filter = parseLocationFilter(req.query as Record<string, unknown>);
    const cacheSuffix = [filter.state, filter.city, filter.squareId].filter(Boolean).join('|') || 'all';
    const cacheKey = `${IDENTITIES_CACHE_KEY}:${cacheSuffix}`;
    const redis = getRedis();

    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          const data = JSON.parse(cached);
          res.json({ data, total: data.length });
          return;
        }
      } catch {
        // fall through
      }
    }

    const data = await UserModel.listIdentities(filter);

    if (redis) {
      try {
        await redis.setex(cacheKey, CACHE_TTL.list, JSON.stringify(data));
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

    const existing = await UserModel.findByIds(ids);
    const deleted = await UserModel.deleteByIds(ids);
    await invalidateIdentitiesCache();
    for (const row of existing) {
      await recordAuditFromReq(req, {
        action: 'delete',
        resourceType: 'identity',
        resourceId: row.id,
        resourceLabel: row.username,
        changes: identitySnapshotChanges(row, null, 'delete'),
      });
    }
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
    const { id, username, role, roles, location } = req.body ?? {};

    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Identity id is required' });
      return;
    }

    const existing = await UserModel.findById(id);
    if (!existing) {
      res.status(404).json({ error: 'Identity not found' });
      return;
    }

    const fields: {
      username?: string;
      roles?: string[];
      location?: UserLocation;
    } = {};

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

    const roleTitles: string[] = Array.isArray(roles)
      ? roles.filter((r: unknown): r is string => typeof r === 'string' && r.trim().length > 0)
          .map((r) => r.trim())
      : typeof role === 'string' && role.trim()
        ? [role.trim()]
        : [];

    if (roleTitles.length > 0) {
      const resolved: string[] = [];
      for (const title of roleTitles) {
        const roleRow = await RoleModel.findByTitle(title);
        if (!roleRow) {
          res.status(400).json({ error: `Role not found: ${title}` });
          return;
        }
        if (!resolved.includes(roleRow.title)) resolved.push(roleRow.title);
      }
      fields.roles = resolved;
    }

    if (location && typeof location === 'object') {
      const parsed = parseLocationBody({ location });
      if (!parsed) {
        res.status(400).json({ error: 'Invalid location payload' });
        return;
      }
      fields.location = parsed;
    }

    const updated = await UserModel.update(id, fields);
    await invalidateIdentitiesCache();
    const updatedRoles =
      updated?.roles && updated.roles.length > 0
        ? updated.roles
        : existing.roles && existing.roles.length > 0
          ? existing.roles
          : [updated?.role ?? existing.role];
    if (updated) {
      await recordAuditFromReq(req, {
        action: 'update',
        resourceType: 'identity',
        resourceId: updated.id,
        resourceLabel: updated.username,
        changes: identitySnapshotChanges(existing, updated, 'update'),
      });
    }
    res.json({
      id: updated?.id ?? id,
      username: updated?.username ?? existing.username,
      role: updatedRoles[0],
      roles: updatedRoles,
      locationPath: updated?.location_path ?? existing.location_path,
      locationScope: updated?.location_scope ?? existing.location_scope,
    });
  } catch (err) {
    next(err);
  }
};
