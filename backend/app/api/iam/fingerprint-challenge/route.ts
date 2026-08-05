import { NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { PasskeyModel } from '@/src/models/passkey.model';
import { setChallenge } from '@/src/lib/challenge-store';

export async function POST(req: Request) {
  try {
    const rpid = process.env.WEBAUTHN_RPID || 'localhost';
    const body = await req.json().catch(() => ({}));
    const state = typeof body.state === 'string' && body.state ? body.state : null;
    const city = typeof body.city === 'string' && body.city ? body.city : null;
    const squareId =
      typeof body.squareId === 'string' && body.squareId
        ? body.squareId
        : typeof body.square_id === 'string' && body.square_id
          ? body.square_id
          : null;
    const credentialIds = Array.isArray(body.credentialIds)
      ? body.credentialIds.filter((id: unknown): id is string => typeof id === 'string' && id.length > 0)
      : null;

    const allowCredentials = await PasskeyModel.listAllowCredentialsForLocation({
      state,
      city,
      squareId,
      credentialIds,
    });

    if (allowCredentials.length === 0) {
      return NextResponse.json(
        { error: 'No fingerprints registered for identities in this location' },
        { status: 404 }
      );
    }

    const options = await generateAuthenticationOptions({
      rpID: rpid,
      allowCredentials: allowCredentials.map((cred) => ({
        id: cred.id,
        transports: (cred.transports ?? undefined) as any,
      })),
      userVerification: 'preferred',
    });

    const challengeId = `fp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    await setChallenge(challengeId, options.challenge);

    return NextResponse.json({
      challengeId,
      options,
      credentials: allowCredentials.map((c) => ({ id: c.id, userId: c.userId })),
    });
  } catch (err) {
    console.error('Fingerprint challenge error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Challenge failed' },
      { status: 500 }
    );
  }
}
