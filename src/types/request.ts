import { Request } from 'express';
import { z } from 'zod';

export type ValidatedRequestBody<T> = Request & {
  validated: {
    body: T;
  };
};

export type ValidatedRequestQuery<T> = Request & {
  validated: {
    query: T;
  };
};

export type ValidatedRequestParams<T> = Request & {
  validated: {
    params: T;
  };
};

export type ValidatedRequest<T extends z.ZodType> = Request & {
  validated: z.infer<T>;
};