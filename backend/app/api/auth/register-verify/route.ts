import { NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { UserModel } from '@/src/models/user.model';
import { PasskeyModel } from '@/src/models/passkey.model';
import { getChallenge, clearChallenge } from '@/src/lib/challenge-store';

export async function POST(req: Request) {
  try {
    const origin = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';
    const rpid = process.env.WEBAUTHN_RPID || 'localhost';
    const { userId, cred } = await req.json();

    const user = await UserModel.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const challenge = await getChallenge(userId);
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge expired' }, { status: 400 });
    }

    const verifyResult = await verifyRegistrationResponse({
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpid,
      response: cred,
    });

    if (!verifyResult.verified || !verifyResult.registrationInfo?.credential) {
      return NextResponse.json({ error: 'User could not be verified!' }, { status: 400 });
    }

    await PasskeyModel.upsertForUser(
      userId,
      verifyResult.registrationInfo.credential,
      'Primary Passkey'
    );
    await clearChallenge(userId);

    return NextResponse.json({ verified: true });
  } catch (err) {
    console.error('Register verify error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Verification failed' },
      { status: 500 }
    );
  }
}
