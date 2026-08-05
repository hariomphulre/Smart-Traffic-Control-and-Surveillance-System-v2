import { NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { UserModel } from '@/src/models/user.model';
import { PasskeyModel } from '@/src/models/passkey.model';
import { setChallenge } from '@/src/lib/challenge-store';

type LocationFilter = {
  state?: string | null;
  city?: string | null;
  squareId?: string | null;
};

function userMatchesFilter(
  user: {
    location_scope: string;
    state: string | null;
    city: string | null;
    square_id: string | null;
  },
  filter: LocationFilter
): boolean {
  if (filter.squareId) {
    return user.location_scope === 'square' && user.square_id === filter.squareId;
  }
  if (filter.city) {
    return (
      (user.location_scope === 'city' || user.location_scope === 'square') &&
      user.state === filter.state &&
      user.city === filter.city
    );
  }
  if (filter.state) {
    return (
      (user.location_scope === 'state' ||
        user.location_scope === 'city' ||
        user.location_scope === 'square') &&
      user.state === filter.state
    );
  }
  return true;
}

export async function POST(req: Request) {
  try {
    const rpid = process.env.WEBAUTHN_RPID || 'localhost';
    const body = await req.json();
    const username =
      typeof body.username === 'string'
        ? body.username.trim()
        : typeof body.userId === 'string'
          ? body.userId.trim()
          : '';

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    let user = await UserModel.findByUsername(username);
    if (!user) {
      user = await UserModel.findById(username);
    }
    if (!user) {
      return NextResponse.json({ error: 'Identity not found' }, { status: 404 });
    }

    if (user.id === 'user_guest' || user.username.toLowerCase() === 'guest') {
      return NextResponse.json(
        { error: 'Guest accounts use Guest Login — fingerprint is not required' },
        { status: 400 }
      );
    }

    const filter: LocationFilter = {
      state: typeof body.state === 'string' && body.state ? body.state : null,
      city: typeof body.city === 'string' && body.city ? body.city : null,
      squareId:
        typeof body.squareId === 'string' && body.squareId
          ? body.squareId
          : typeof body.square_id === 'string' && body.square_id
            ? body.square_id
            : null,
    };

    if (!userMatchesFilter(user, filter)) {
      return NextResponse.json(
        { error: 'Identity is not available at the selected location' },
        { status: 403 }
      );
    }

    const passkey = await PasskeyModel.findByUserId(user.id);
    if (!passkey) {
      return NextResponse.json({ error: 'No fingerprint registered for this user' }, { status: 400 });
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

    await setChallenge(user.id, opts.challenge);

    return NextResponse.json({
      options: opts,
      userId: user.id,
      username: user.username,
      locationPath: user.location_path,
    });
  } catch (err) {
    console.error('Login challenge error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Challenge failed' },
      { status: 500 }
    );
  }
}
