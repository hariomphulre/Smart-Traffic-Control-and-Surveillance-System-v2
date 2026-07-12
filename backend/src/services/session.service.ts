import { randomUUID } from 'crypto';
import { getRedis, CACHE_TTL } from '../config/redis';
import { SessionModel } from '../models/session.model';

const SESSION_TTL_SECONDS = Number(process.env.SESSION_TTL_SECONDS ?? 86400);

export interface ActiveSession {
  sessionId: string;
  userId: string;
  username: string;
  passkeyLabel: string;
  loginAt: string;
  ipAddress?: string;
  location?: string;
}

export async function createSession(data: {
  userId: string;
  username: string;
  passkeyLabel: string;
  ipAddress?: string;
  location?: string;
}): Promise<ActiveSession> {
  const sessionId = randomUUID();
  const loginAt = new Date();
  const expiresAt = new Date(loginAt.getTime() + SESSION_TTL_SECONDS * 1000);

  await SessionModel.create({
    sessionId,
    userId: data.userId,
    username: data.username,
    passkeyLabel: data.passkeyLabel,
    ipAddress: data.ipAddress,
    location: data.location,
    expiresAt,
  });

  const payload: ActiveSession = {
    sessionId,
    userId: data.userId,
    username: data.username,
    passkeyLabel: data.passkeyLabel,
    loginAt: loginAt.toISOString(),
    ipAddress: data.ipAddress,
    location: data.location,
  };

  const redis = getRedis();
  if (redis) {
    try {
      await redis.setex(`session:${sessionId}`, SESSION_TTL_SECONDS, JSON.stringify(payload));
      await redis.sadd(`user_sessions:${data.userId}`, sessionId);
      await redis.expire(`user_sessions:${data.userId}`, SESSION_TTL_SECONDS);
      await redis.del('sessions:active:list');
      await redis.del('iam:identities:list');
    } catch (err) {
      console.warn('⚠️ Redis session write failed:', (err as Error).message);
    }
  }

  return payload;
}

export async function getActiveSessions(): Promise<ReturnType<typeof SessionModel.listActive>> {
  const redis = getRedis();
  const cacheKey = 'sessions:active:list';

  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch {
      // fall through
    }
  }

  const sessions = await SessionModel.listActive();

  if (redis) {
    try {
      await redis.setex(cacheKey, CACHE_TTL.list, JSON.stringify(sessions));
    } catch {
      // ignore
    }
  }

  return sessions;
}
