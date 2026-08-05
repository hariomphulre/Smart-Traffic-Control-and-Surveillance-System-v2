import { Request, Response, NextFunction } from 'express';
import { isDbSchemaError } from '../lib/db-errors';
import {
  endSessions,
  getActiveSessions,
  getSession,
  isAdminRoles,
} from '../services/session.service';

function readSessionId(req: Request): string {
  const headers = req.headers as Record<string, string | string[] | undefined>;
  const header = headers['x-session-id'] ?? headers['X-Session-Id'];
  if (typeof header === 'string' && header.trim()) return header.trim();
  if (Array.isArray(header) && header[0]) return String(header[0]).trim();
  if (typeof req.body?.sessionId === 'string') return req.body.sessionId.trim();
  if (typeof req.query?.sessionId === 'string') return String(req.query.sessionId).trim();
  return '';
}

export const getSessions = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await getActiveSessions();
    res.json({ data, total: data.length });
  } catch (err) {
    if (isDbSchemaError(err)) {
      res.json({ data: [], total: 0 });
      return;
    }
    next(err);
  }
};

export const deleteSessions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const callerSessionId = readSessionId(req);
    if (!callerSessionId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const caller = await getSession(callerSessionId);
    if (!caller) {
      res.status(401).json({ error: 'Session expired or invalid' });
      return;
    }

    if (!isAdminRoles(caller.roles)) {
      res.status(403).json({ error: 'Only Admin can end sessions' });
      return;
    }

    const ids = Array.isArray(req.body?.ids)
      ? req.body.ids.filter((id: unknown): id is string => typeof id === 'string' && id.length > 0)
      : [];

    if (ids.length === 0) {
      res.status(400).json({ error: 'At least one session id is required' });
      return;
    }

    const deleted = await endSessions(ids);
    res.json({ deleted, ids });
  } catch (err) {
    next(err);
  }
};
