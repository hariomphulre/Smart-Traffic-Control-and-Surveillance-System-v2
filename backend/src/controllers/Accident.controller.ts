import { Request, Response, NextFunction } from 'express';
import { AccidentModel } from '../models/accident.model';

export const getAccidents = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await AccidentModel.getAll(req.query as Record<string, string>);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getAccidentStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await AccidentModel.getStats();
    res.json(result);
  } catch (err) {
    next(err);
  }
};