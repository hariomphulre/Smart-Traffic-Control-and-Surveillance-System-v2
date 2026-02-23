import { Request, Response, NextFunction } from 'express';
import { ChallanModel } from '../models/challan.model';

export const getChallans = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await ChallanModel.getAll(req.query as Record<string, string>);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getChallanStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await ChallanModel.getStats();
    res.json(result);
  } catch (err) {
    next(err);
  }
};