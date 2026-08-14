import { Request, Response, NextFunction } from 'express';
import { isDbSchemaError } from '../lib/db-errors';
import { AuditModel } from '../models/audit.model';
import type { AuditChange } from '../models/audit.model';
import { recordAuditFromReq } from '../services/audit.service';

function parseLocationFilter(query: Record<string, unknown>) {
  const state = typeof query.state === 'string' && query.state ? query.state : null;
  const city = typeof query.city === 'string' && query.city ? query.city : null;
  const squareId =
    typeof query.squareId === 'string' && query.squareId
      ? query.squareId
      : typeof query.square_id === 'string' && query.square_id
        ? query.square_id
        : null;
  const from = typeof query.from === 'string' && query.from ? query.from : null;
  const to = typeof query.to === 'string' && query.to ? query.to : null;
  const username =
    typeof query.username === 'string' && query.username ? query.username : null;

  return { state, city, squareId, from, to, username };
}

export const getAuditLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filter = parseLocationFilter(req.query as Record<string, unknown>);
    const data = await AuditModel.list(filter);
    res.json({ data, total: data.length });
  } catch (err) {
    if (isDbSchemaError(err)) {
      res.json({ data: [], total: 0 });
      return;
    }
    next(err);
  }
};

export const createAuditLog = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const action = req.body?.action;
    const resourceType =
      typeof req.body?.resourceType === 'string' ? req.body.resourceType.trim() : '';
    if (action !== 'create' && action !== 'update' && action !== 'delete') {
      res.status(400).json({ error: 'Valid action is required' });
      return;
    }
    if (!resourceType) {
      res.status(400).json({ error: 'resourceType is required' });
      return;
    }

    const rawChanges = Array.isArray(req.body?.changes) ? req.body.changes : [];
    const changes: AuditChange[] = rawChanges
      .filter((item: unknown): item is Record<string, unknown> => !!item && typeof item === 'object')
      .map((item: Record<string, unknown>) => ({
        field: typeof item.field === 'string' ? item.field : 'Change',
        from: item.from == null ? null : String(item.from),
        to: item.to == null ? null : String(item.to),
      }));

    if (changes.length === 0) {
      res.status(400).json({ error: 'At least one change is required' });
      return;
    }

    await recordAuditFromReq(req, {
      action,
      resourceType,
      resourceId: typeof req.body?.resourceId === 'string' ? req.body.resourceId : null,
      resourceLabel: typeof req.body?.resourceLabel === 'string' ? req.body.resourceLabel : null,
      changes,
    });

    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
};
