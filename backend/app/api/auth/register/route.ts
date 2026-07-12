import { NextResponse } from 'next/server';
import { hashPassword } from '@/src/lib/password';
import { UserModel } from '@/src/models/user.model';
import { getRedis } from '@/src/config/redis';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username?.trim() || !password?.trim()) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const existing = await UserModel.findByUsername(username.trim());
    if (existing) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }

    const id = `user_${Date.now()}`;
    const passwordHash = await hashPassword(password);
    await UserModel.create(id, username.trim(), passwordHash);

    const redis = getRedis();
    if (redis) {
      try {
        await redis.del('iam:identities:list');
      } catch {
        // ignore
      }
    }

    return NextResponse.json({ id, username: username.trim() });
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Registration failed' },
      { status: 500 }
    );
  }
}
