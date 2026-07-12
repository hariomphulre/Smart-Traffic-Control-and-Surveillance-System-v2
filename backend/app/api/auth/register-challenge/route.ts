import { NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { UserModel } from '@/src/models/user.model';
import { setChallenge } from '@/src/lib/challenge-store';

export async function POST(req: Request) {
  try {
    const rpid = process.env.WEBAUTHN_RPID || 'localhost';
    const rpname = process.env.WEBAUTHN_RPNAME || 'Signal-X';

    const { userId } = await req.json();
    const user = await UserModel.findById(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const options = await generateRegistrationOptions({
      rpID: rpid,
      rpName: rpname,
      userName: user.username,
    });

    await setChallenge(userId, options.challenge);

    return NextResponse.json({ options });
  } catch (err) {
    console.error('Register challenge error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Challenge failed' },
      { status: 500 }
    );
  }
}
