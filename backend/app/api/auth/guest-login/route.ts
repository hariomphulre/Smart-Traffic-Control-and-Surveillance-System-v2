import { NextResponse } from 'next/server';
import { UserModel } from '@/src/models/user.model';
import { createSession } from '@/src/services/session.service';
import { withDbRetry } from '@/src/lib/db-retry';
import { authErrorResponse } from '@/src/lib/auth-api-response';
import { ensurePool } from '@/src/config/db';
import { verifyTurnstileToken } from '@/src/lib/verify-captcha';

function getClientIp(req: Request): string | undefined {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim();
  return req.headers.get('x-real-ip') ?? undefined;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { captchaToken } = body;

    // Validate CAPTCHA token first before doing database operations
    if (!captchaToken) {
      return NextResponse.json({ error: 'CAPTCHA token is required' }, { status: 400 });
    }

    const isCaptchaValid = await verifyTurnstileToken(captchaToken);
    if (!isCaptchaValid) {
      return NextResponse.json({ error: 'Invalid or expired CAPTCHA' }, { status: 400 });
    }

    await ensurePool();
    const { user, session, roles } = await withDbRetry(
      async () => {
        const guest = await UserModel.ensureGuest();
        const guestRoles =
          Array.isArray(guest.roles) && guest.roles.length > 0
            ? guest.roles
            : guest.role
              ? [guest.role]
              : ['User'];
        const guestSession = await createSession({
          userId: guest.id,
          username: guest.username,
          roles: guestRoles,
          passkeyLabel: 'Guest',
          ipAddress: getClientIp(req),
          location: guest.location_path || 'India',
        });
        return { user: guest, session: guestSession, roles: guestRoles };
      },
      { label: 'guest.login', attempts: 2 }
    );

    return NextResponse.json({
      success: true,
      userId: user.id,
      username: user.username,
      roles,
      sessionId: session.sessionId,
      location: user.location_path || 'India',
      loginAt: session.loginAt,
      isGuest: true,
    });
  } catch (err) {
    return authErrorResponse(err, 'Guest login error');
  }
}