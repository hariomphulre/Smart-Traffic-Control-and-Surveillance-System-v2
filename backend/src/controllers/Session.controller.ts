import { Request, Response, NextFunction } from 'express';
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
    next(err);
  }
};
