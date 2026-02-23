import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  status?:  number;
  code?:    string;
  details?: string[];
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const status = err.status ?? 500;
  console.error(`[ERROR] ${req.method} ${req.url} →`, err.message);

  res.status(status).json({
    error: {
      code:    err.code ?? (status === 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'),
      message: err.message ?? 'Internal Server Error',
      details: err.details ?? [],
    },
  });
};

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    error: {
      code:    'NOT_FOUND',
      message: `Route ${req.method} ${req.url} not found`,
      details: [],
    },
  });
};