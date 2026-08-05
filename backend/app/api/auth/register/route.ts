import { NextResponse } from 'next/server';
import { UserModel, type LocationScope, type UserLocation } from '@/src/models/user.model';
import { getRedis } from '@/src/config/redis';

function parseLocation(body: Record<string, unknown>): UserLocation | { error: string } {
  const location = (body.location ?? {}) as Record<string, unknown>;
  const scope = (location.scope ?? body.scope ?? 'national') as string;
  const validScopes: LocationScope[] = ['national', 'state', 'city', 'square'];

  if (!validScopes.includes(scope as LocationScope)) {
    return { error: 'Invalid location scope' };
  }

  const country = String(location.country ?? 'India').trim() || 'India';
  if (country !== 'India') {
    return { error: 'Only India is supported' };
  }

  const state = location.state ? String(location.state).trim() : null;
  const city = location.city ? String(location.city).trim() : null;
  const area = location.area ? String(location.area).trim() : null;
  const squareId = location.squareId
    ? String(location.squareId).trim()
    : location.square_id
      ? String(location.square_id).trim()
      : null;

  if (scope === 'state' && !state) return { error: 'State is required for state-scoped identity' };
  if (scope === 'city' && (!state || !city)) return { error: 'State and city are required for city-scoped identity' };
  if (scope === 'square' && (!state || !city || !squareId)) {
    return { error: 'State, city, and square are required for square-scoped identity' };
  }

  const locationPath =
    scope === 'national'
      ? country
      : scope === 'state'
        ? state!
        : scope === 'city'
          ? `${state}/${city}`
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = typeof body.username === 'string' ? body.username.trim() : '';

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const location = parseLocation(body);
    if ('error' in location) {
      return NextResponse.json({ error: location.error }, { status: 400 });
    }

    const existing = await UserModel.findByUsername(username);
    if (existing) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }

    const id = `user_${Date.now()}`;
    const user = await UserModel.create(id, username, location);

    const redis = getRedis();
    if (redis) {
      try {
        await redis.del('iam:identities:list');
      } catch {
        // ignore
      }
    }

    return NextResponse.json({
      id: user.id,
      username: user.username,
      locationScope: user.location_scope,
      locationPath: user.location_path,
    });
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Registration failed' },
      { status: 500 }
    );
  }
}
