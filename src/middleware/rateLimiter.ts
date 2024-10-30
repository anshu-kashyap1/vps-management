import rateLimit from 'express-rate-limit';
import { AppError } from './errorHandler';

export const rateLimiter = (maxRequests: number = 100) =>
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: maxRequests,
    message: {
      status: 'error',
      message: 'Too many requests, please try again later.',
    },
    handler: (req, res, next) => {
      throw new AppError('Too many requests, please try again later.', 429);
    },
  });