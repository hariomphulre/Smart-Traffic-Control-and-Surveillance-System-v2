import { getSession } from './session.service';
import { UserModel } from '../models/user.model';
import {
  AuditModel,
  type AuditAction,
  type AuditChange,
} from '../models/audit.model';

export type AuditActor = {
  userId: string | null;
  username: string;
  roles: string[];
  origin: string;
  ipAddress?: string;
};

export type AuditEventInput = {
  action: AuditAction;
  resourceType: string;
  resourceId?: string | null;
  resourceLabel?: string | null;
  changes: AuditChange[];
};

type HeaderMap = Headers | Record<string, unknown> | undefined;

function headerValue(headers: HeaderMap, name: string): string {
  if (!headers) return '';
  if (typeof (headers as Headers).get === 'function') {
    return ((headers as Headers).get(name) || '').trim();
  }
  const rec = headers as Record<string, unknown>;
  const lower = name.toLowerCase();
  const raw = rec[name] ?? rec[lower];
  if (typeof raw === 'string') return raw.trim();
  if (Array.isArray(raw) && raw[0]) return String(raw[0]).trim();
  return '';
}

export function readSessionIdFromHeaders(headers: HeaderMap): string {
  return (
    headerValue(headers, 'x-session-id') ||
    headerValue(headers, 'X-Session-Id')
  );
}

export function readIpFromHeaders(headers: HeaderMap): string | undefined {
  const forwarded = headerValue(headers, 'x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || undefined;
  return headerValue(headers, 'x-real-ip') || undefined;
}

export function changeValue(value: unknown): string | null {
  if (value == null) return null;
  if (Array.isArray(value)) {
    const joined = value.map((item) => String(item).trim()).filter(Boolean).join(', ');
    return joined || null;
  }
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

export function pushChange(
  changes: AuditChange[],
  field: string,
  from: unknown,
  to: unknown
): void {
  const prev = changeValue(from);
  const next = changeValue(to);
  if (prev === next) return;
  changes.push({ field, from: prev, to: next });
}

const UNKNOWN_ACTOR: AuditActor = {
  userId: null,
  username: 'Unknown',
  roles: [],
  origin: 'Unknown',
};

export async function resolveActor(req: {
  headers?: HeaderMap;
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
}): Promise<AuditActor> {
  const headers = req.headers;
  const sessionId =
    readSessionIdFromHeaders(headers) ||
    (typeof req.body?.sessionId === 'string' ? req.body.sessionId.trim() : '') ||
    (typeof req.query?.sessionId === 'string' ? String(req.query.sessionId).trim() : '');

  const ipAddress = readIpFromHeaders(headers);
  if (!sessionId) return { ...UNKNOWN_ACTOR, ipAddress };

  try {
    const session = await getSession(sessionId);
    if (!session) return { ...UNKNOWN_ACTOR, ipAddress };

    const user = await UserModel.findById(session.userId);
    return {
      userId: session.userId,
      username: session.username,
      roles: session.roles?.length ? session.roles : ['User'],
      origin: user?.location_path || session.location || 'Unknown',
      ipAddress,
    };
  } catch {
    return { ...UNKNOWN_ACTOR, ipAddress };
  }
}

export async function recordAudit(
  actor: AuditActor,
  event: AuditEventInput
): Promise<void> {
  if (!event.changes || event.changes.length === 0) return;
  try {
    await AuditModel.create({
      userId: actor.userId,
      username: actor.username,
      roles: actor.roles,
      origin: actor.origin,
      action: event.action,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      resourceLabel: event.resourceLabel,
      changes: event.changes,
      ipAddress: actor.ipAddress,
    });
  } catch (err) {
    console.warn('⚠️ Failed to write audit log:', (err as Error).message);
  }
}

export async function recordAuditFromReq(
  req: { headers?: HeaderMap; body?: Record<string, unknown>; query?: Record<string, unknown> },
  event: AuditEventInput
): Promise<void> {
  const actor = await resolveActor(req);
  await recordAudit(actor, event);
}
