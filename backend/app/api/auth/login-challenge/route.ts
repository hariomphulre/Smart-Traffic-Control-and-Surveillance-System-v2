import { NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { UserModel } from '@/src/models/user.model';
import { PasskeyModel } from '@/src/models/passkey.model';
import { setChallenge } from '@/src/lib/challenge-store';

export async function POST(req: Request) {
  try {
    const rpid = process.env.WEBAUTHN_RPID || 'localhost';
    const { userId } = await req.json();

    const user = await UserModel.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const passkey = await PasskeyModel.findByUserId(userId);
    if (!passkey) {
      return NextResponse.json({ error: 'No passkey registered for this user' }, { status: 400 });
    }

    const opts = await generateAuthenticationOptions({
      rpID: rpid,
      allowCredentials: [
        {
          id: passkey.id,
          transports: passkey.transports,
        },
      ],
    });

    await setChallenge(userId, opts.challenge);

    return NextResponse.json({ options: opts });
  } catch (err) {
    console.error('Login challenge error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Challenge failed' },
      { status: 500 }
    );
  }
}
