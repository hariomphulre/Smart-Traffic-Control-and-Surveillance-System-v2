import { NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { PasskeyModel } from '@/src/models/passkey.model';
import { getChallenge, clearChallenge } from '@/src/lib/challenge-store';

export async function POST(req: Request) {
  try {
    const origin = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';
    const rpid = process.env.WEBAUTHN_RPID || 'localhost';
    const body = await req.json();
    const { challengeId, cred, deviceBindingId } = body;

    if (!challengeId || !cred) {
      return NextResponse.json({ error: 'challengeId and cred are required' }, { status: 400 });
    }

    const challenge = await getChallenge(challengeId);
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge expired' }, { status: 400 });
    }

    const credentialId = typeof cred.id === 'string' ? cred.id : cred.rawId;
    if (!credentialId) {
      return NextResponse.json({ error: 'Missing credential id' }, { status: 400 });
    }

    const passkeyRow = await PasskeyModel.findRowByCredentialId(credentialId);
    if (!passkeyRow) {
      return NextResponse.json({ error: 'No identity matches this fingerprint' }, { status: 404 });
    }

    const passkey = PasskeyModel.toCredential(passkeyRow);
    const result = await verifyAuthenticationResponse({
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpid,
      response: cred,
      credential: passkey,
    });

    if (!result.verified) {
      return NextResponse.json({ error: 'Fingerprint verification failed' }, { status: 401 });
    }

    if (result.authenticationInfo?.newCounter !== undefined) {
      await PasskeyModel.updateCounter(passkey.id, result.authenticationInfo.newCounter);
    }

    const bindingId =
      typeof deviceBindingId === 'string' && deviceBindingId.trim()
        ? deviceBindingId.trim()
        : passkeyRow.device_binding_id;

    if (bindingId) {
      await PasskeyModel.bindDevice(credentialId, bindingId);
    }

    const state = typeof body.state === 'string' && body.state ? body.state : null;
    const city = typeof body.city === 'string' && body.city ? body.city : null;
    const squareId =
      typeof body.squareId === 'string' && body.squareId
        ? body.squareId
        : typeof body.square_id === 'string' && body.square_id
          ? body.square_id
          : null;

    const locationFilter = { state, city, squareId };
    const matchedFromBinding = bindingId
      ? await PasskeyModel.findUserIdsByDeviceBinding(bindingId, locationFilter)
      : [];

    const matchedUserIds = Array.from(
      new Set([passkeyRow.user_id, ...matchedFromBinding])
    );

    await clearChallenge(challengeId);

    return NextResponse.json({
      verified: true,
      matchedUserIds,
      userId: passkeyRow.user_id,
      credentialId,
      deviceBindingId: bindingId,
    });
  } catch (err) {
    console.error('Fingerprint verify error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Verification failed' },
      { status: 500 }
    );
  }
}
