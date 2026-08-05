import { NextResponse } from 'next/server';
import { getSession } from '@/src/services/session.service';

export async function GET(req: Request) {
  try {
    const sessionId =
      req.headers.get('x-session-id')?.trim() ||
      new URL(req.url).searchParams.get('sessionId')?.trim() ||
      '';

    if (!sessionId) {
      return NextResponse.json({ error: 'Session id required' }, { status: 401 });
    }

    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found or inactive' }, { status: 401 });
    }

    return NextResponse.json({
      sessionId: session.sessionId,
      userId: session.userId,
      username: session.username,
      roles: session.roles,
      location: session.location ?? 'India',
      loginAt: session.loginAt,
      passkeyLabel: session.passkeyLabel,
    });
  } catch (err) {
    console.error('Session me error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load session' },
      { status: 500 }
    );
  }
}
