// src/middleware/validate.ts
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from './errorHandler';

export type ValidatedRequest<T> = Request & {
  validated: T;
};

export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const validatedData = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Add validated data to request object
      (req as any).validated = validatedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        next(new AppError('Validation failed', 400, validationErrors));
      } else {
        next(error);
      }
    }
  };
};

// Helper function to create validation middleware with type inference
export const createValidationMiddleware = <T extends AnyZodObject>(schema: T) => {
  return validateRequest(schema) as 
    (req: Request, res: Response, next: NextFunction) => Promise<void>;
};