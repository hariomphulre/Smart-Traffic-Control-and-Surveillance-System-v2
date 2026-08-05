import { randomUUID } from 'crypto';
import { getRedis } from '../config/redis';
import { SessionModel } from '../models/session.model';
import { UserModel } from '../models/user.model';

/** No session timeout for now — far-future expiry. */
const SESSION_EXPIRES_AT = new Date('2099-12-31T23:59:59.000Z');
const REDIS_SESSION_TTL = 60 * 60 * 24 * 365 * 10; // 10 years

export interface ActiveSession {
  sessionId: string;
  userId: string;
  username: string;
  roles: string[];
  passkeyLabel: string;
  loginAt: string;
  ipAddress?: string;
  location?: string;
}

function normalizeRoles(roles: string[] | null | undefined, role?: string | null): string[] {
  if (Array.isArray(roles) && roles.length > 0) {
    return roles.map((r) => String(r).trim()).filter(Boolean);
  }
  if (role && String(role).trim()) return [String(role).trim()];
  return ['User'];
}

async function invalidateSessionCaches(sessionIds: string[], userIds: string[] = []) {
  const redis = getRedis();
  if (!redis) return;
  try {
    for (const id of sessionIds) {
      await redis.del(`session:${id}`);
    }
    for (const userId of userIds) {
      for (const id of sessionIds) {
        await redis.srem(`user_sessions:${userId}`, id);
      }
    }
    await redis.del('sessions:active:list');
  } catch {
    // ignore
  }
}

export async function createSession(data: {
  userId: string;
  username: string;
  roles?: string[];
  role?: string;
  passkeyLabel: string;
  ipAddress?: string;
  location?: string;
}): Promise<ActiveSession> {
  const sessionId = randomUUID();
  const loginAt = new Date();
  const roles = normalizeRoles(data.roles, data.role);

  // Always persist in Postgres first
  await SessionModel.create({
    sessionId,
    userId: data.userId,
    username: data.username,
    passkeyLabel: data.passkeyLabel,
    ipAddress: data.ipAddress,
    location: data.location,
    expiresAt: SESSION_EXPIRES_AT,
  });

  const payload: ActiveSession = {
    sessionId,
    userId: data.userId,
    username: data.username,
    roles,
    passkeyLabel: data.passkeyLabel,
    loginAt: loginAt.toISOString(),
    ipAddress: data.ipAddress,
    location: data.location,
  };

  // Optional Redis mirror for fast auth lookups
  const redis = getRedis();
  if (redis) {
    try {
      await redis.setex(`session:${sessionId}`, REDIS_SESSION_TTL, JSON.stringify(payload));
      await redis.sadd(`user_sessions:${data.userId}`, sessionId);
      await redis.expire(`user_sessions:${data.userId}`, REDIS_SESSION_TTL);
      await redis.del('sessions:active:list');
    } catch (err) {
      console.warn('⚠️ Redis session write failed:', (err as Error).message);
    }
  }

  return payload;
}

export async function getSession(sessionId: string): Promise<ActiveSession | null> {
  if (!sessionId) return null;

  // DB is source of truth
  const row = await SessionModel.findActiveById(sessionId);
  if (!row) {
    await invalidateSessionCaches([sessionId]);
    return null;
  }

  const user = await UserModel.findById(row.user_id);
  const roles = normalizeRoles(user?.roles, user?.role);

  const payload: ActiveSession = {
    sessionId: row.session_id,
    userId: row.user_id,
    username: row.username,
    roles,
    passkeyLabel: row.passkey_label ?? 'Passkey',
    loginAt:
      row.login_at instanceof Date ? row.login_at.toISOString() : String(row.login_at),
    ipAddress: row.ip_address ?? undefined,
    location: row.location ?? undefined,
  };

  const redis = getRedis();
  if (redis) {
    try {
      await redis.setex(`session:${sessionId}`, REDIS_SESSION_TTL, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }

  return payload;
}

/** Always fetch live sessions + public passkeys from DB. */
export async function getActiveSessions(): Promise<ReturnType<typeof SessionModel.listActive>> {
  return SessionModel.listActive();
}

/** End sessions by removing rows from DB. */
export async function endSessions(sessionIds: string[]): Promise<number> {
  if (sessionIds.length === 0) return 0;

  const userIds: string[] = [];
  for (const id of sessionIds) {
    const row = await SessionModel.findActiveById(id);
    if (row?.user_id) userIds.push(row.user_id);
  }

  const deleted = await SessionModel.deleteByIds(sessionIds);
  await invalidateSessionCaches(sessionIds, userIds);
  return deleted;
}

export function isAdminRoles(roles: string[] | undefined | null): boolean {
  return (roles ?? []).some((r) => r.toLowerCase() === 'admin');
}
