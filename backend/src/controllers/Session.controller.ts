import { Request, Response, NextFunction } from 'express';
import { isDbSchemaError } from '../lib/db-errors';
import { getActiveSessions } from '../services/session.service';

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
