import { NextResponse } from 'next/server';
import { endSessions, getSession } from '@/src/services/session.service';

async function logoutSession(sessionId: string) {
  if (!sessionId) {
    return NextResponse.json({ error: 'Session id required' }, { status: 401 });
  }

  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ success: true, deleted: 0 });
  }

  const deleted = await endSessions([sessionId]);
  return NextResponse.json({
    success: true,
    deleted,
    sessionId,
  });
}

function readSessionId(req: Request, body?: { sessionId?: string }) {
  const fromHeader = req.headers.get('x-session-id')?.trim();
  if (fromHeader) return fromHeader;

  const fromQuery = new URL(req.url).searchParams.get('sessionId')?.trim();
  if (fromQuery) return fromQuery;

  if (typeof body?.sessionId === 'string' && body.sessionId.trim()) {
    return body.sessionId.trim();
  }

  return '';
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { sessionId?: string };
    return await logoutSession(readSessionId(req, body));
  } catch (err) {
    console.error('Logout error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Logout failed' },
      { status: 500 }
    );
  }
}

/** Used by sendBeacon / unload handlers (query param). */
export async function GET(req: Request) {
  try {
    return await logoutSession(readSessionId(req));
  } catch (err) {
    console.error('Logout error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Logout failed' },
      { status: 500 }
    );
  }
}
