import { getRedis } from '../config/redis';

const memoryStore = new Map<string, string>();
const CHALLENGE_TTL = 300;

export async function setChallenge(userId: string, challenge: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    try {
      await redis.setex(`auth:challenge:${userId}`, CHALLENGE_TTL, challenge);
      return;
    } catch {
      // fall through to memory
    }
  }
  memoryStore.set(userId, challenge);
  setTimeout(() => memoryStore.delete(userId), CHALLENGE_TTL * 1000);
}

export async function getChallenge(userId: string): Promise<string | null> {
  const redis = getRedis();
  if (redis) {
    try {
      const value = await redis.get(`auth:challenge:${userId}`);
      if (value) return value;
    } catch {
      // fall through
    }
  }
  return memoryStore.get(userId) ?? null;
}

export async function clearChallenge(userId: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    try {
      await redis.del(`auth:challenge:${userId}`);
    } catch {
      // ignore
    }
  }
  memoryStore.delete(userId);
}
