import { Request, Response, NextFunction } from 'express';
import { ImagesModel } from '../models/images.model';

export const getVehicleImages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await ImagesModel.getVehicleImages(req.query as Record<string, string>);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getAccidentMedia = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await ImagesModel.getAccidentMedia(req.query as Record<string, string>);
    res.json(result);
  } catch (err) {
    next(err);
  }
};