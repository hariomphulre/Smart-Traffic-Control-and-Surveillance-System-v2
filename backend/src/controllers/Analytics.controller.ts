import { Request, Response, NextFunction } from 'express';
import { AnalyticsModel } from '../models/analytics.model';

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

const wrap =
  (fn: (q: Record<string, string>) => Promise<unknown>): Handler =>
  async (req, res, next) => {
    try {
      res.json(await fn(req.query as Record<string, string>));
    } catch (err) {
      next(err);
    }
  };

export const getViolations    = wrap((q) => AnalyticsModel.getViolations(q));
export const getVehicleTypes  = wrap((q) => AnalyticsModel.getVehicleTypes(q));
export const getHourlyTraffic = wrap((q) => AnalyticsModel.getHourlyTraffic(q));
export const getSpeedDistrib  = wrap((q) => AnalyticsModel.getSpeedDistribution(q));
export const getHotspots      = wrap((q) => AnalyticsModel.getHotspots(q));

export const getStats: Handler = async (_req, res, next) => {
  try {
    res.json(await AnalyticsModel.getStats());
  } catch (err) {
    next(err);
  }
};