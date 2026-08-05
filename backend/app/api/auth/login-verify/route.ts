import { NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { UserModel } from '@/src/models/user.model';
import { PasskeyModel } from '@/src/models/passkey.model';
import { getChallenge, clearChallenge } from '@/src/lib/challenge-store';
import { createSession } from '@/src/services/session.service';

function getClientIp(req: Request): string | undefined {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim();
  return req.headers.get('x-real-ip') ?? undefined;
}

function normalizeRoles(roles: string[] | null | undefined, role?: string | null): string[] {
  if (Array.isArray(roles) && roles.length > 0) {
    return roles.map((r) => String(r).trim()).filter(Boolean);
  }
  if (role && String(role).trim()) return [String(role).trim()];
  return ['User'];
}

export async function POST(req: Request) {
  try {
    const origin = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';
    const rpid = process.env.WEBAUTHN_RPID || 'localhost';
    const { userId, cred } = await req.json();

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'User id is required' }, { status: 400 });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const passkey = await PasskeyModel.findByUserId(userId);
    if (!passkey) {
      return NextResponse.json({ error: 'No fingerprint registered' }, { status: 400 });
    }

    const challenge = await getChallenge(userId);
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge expired' }, { status: 400 });
    }

    const result = await verifyAuthenticationResponse({
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpid,
      response: cred,
      credential: passkey,
    });

    if (!result.verified) {
      return NextResponse.json({ error: 'Fingerprint authentication failed' }, { status: 401 });
    }

    if (result.authenticationInfo?.newCounter !== undefined) {
      await PasskeyModel.updateCounter(passkey.id, result.authenticationInfo.newCounter);
    }

    const passkeyLabel = await PasskeyModel.findLabelByUserId(userId);
    const roles = normalizeRoles(user.roles, user.role);
    const session = await createSession({
      userId,
      username: user.username,
      roles,
      passkeyLabel,
      ipAddress: getClientIp(req),
      location: user.location_path || 'India',
    });

    await clearChallenge(userId);

    return NextResponse.json({
      success: true,
      userId,
      username: user.username,
      roles,
      sessionId: session.sessionId,
      location: user.location_path || 'India',
      loginAt: session.loginAt,
    });
  } catch (err) {
    console.error('Login verify error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Login failed' },
      { status: 500 }
    );
  }
}
