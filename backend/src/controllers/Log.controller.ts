import { Request, Response, NextFunction } from 'express';
import { LogModel } from '../models/log.model';

export const getLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await LogModel.getAll(req.query as Record<string, string>);
    res.json(result);
  } catch (err) {
    next(err);
  }
};