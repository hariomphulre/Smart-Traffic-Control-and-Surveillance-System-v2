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

export async function POST(req: Request) {
  try {
    const origin = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';
    const rpid = process.env.WEBAUTHN_RPID || 'localhost';
    const { userId, cred } = await req.json();

    const user = await UserModel.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const passkey = await PasskeyModel.findByUserId(userId);
    if (!passkey) {
      return NextResponse.json({ error: 'No passkey registered' }, { status: 400 });
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
      return NextResponse.json({ error: 'Not authenticated successfully!' }, { status: 401 });
    }

    if (result.authenticationInfo?.newCounter !== undefined) {
      await PasskeyModel.updateCounter(passkey.id, result.authenticationInfo.newCounter);
    }

    const passkeyLabel = await PasskeyModel.findLabelByUserId(userId);
    const session = await createSession({
      userId,
      username: user.username,
      passkeyLabel,
      ipAddress: getClientIp(req),
      location: 'India',
    });

    await clearChallenge(userId);

    return NextResponse.json({
      success: true,
      userId,
      username: user.username,
      sessionId: session.sessionId,
    });
  } catch (err) {
    console.error('Login verify error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Login failed' },
      { status: 500 }
    );
  }
}
