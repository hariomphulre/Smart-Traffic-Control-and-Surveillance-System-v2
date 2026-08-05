import { NextResponse } from 'next/server';
import { UserModel } from '@/src/models/user.model';
import { createSession } from '@/src/services/session.service';

const GUEST_ID = 'user_guest';
const GUEST_USERNAME = 'Guest';

function getClientIp(req: Request): string | undefined {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim();
  return req.headers.get('x-real-ip') ?? undefined;
}

async function ensureGuestUser() {
  let user = await UserModel.findById(GUEST_ID);
  if (user) return user;

  user = await UserModel.findByUsername(GUEST_USERNAME);
  if (user) return user;

  return UserModel.create(
    GUEST_ID,
    GUEST_USERNAME,
    {
      scope: 'national',
      country: 'India',
      state: null,
      city: null,
      area: null,
      squareId: null,
      locationPath: 'India',
    },
    ['User']
  );
}

export async function POST(req: Request) {
  try {
    const user = await ensureGuestUser();
    const roles =
      Array.isArray(user.roles) && user.roles.length > 0
        ? user.roles
        : user.role
          ? [user.role]
          : ['User'];

    const session = await createSession({
      userId: user.id,
      username: user.username,
      roles,
      passkeyLabel: 'Guest',
      ipAddress: getClientIp(req),
      location: user.location_path || 'India',
    });

    return NextResponse.json({
      success: true,
      userId: user.id,
      username: user.username,
      roles,
      sessionId: session.sessionId,
      location: user.location_path || 'India',
      loginAt: session.loginAt,
      isGuest: true,
    });
  } catch (err) {
    console.error('Guest login error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Guest login failed' },
      { status: 500 }
    );
  }
}
