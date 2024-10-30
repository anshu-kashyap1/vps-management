import { z } from 'zod';

export const createVMSchema = z.object({
  body: z.object({
    name: z.string()
      .min(3, 'Name must be at least 3 characters')
      .max(50, 'Name must not exceed 50 characters')
      .regex(/^[a-zA-Z0-9-]+$/, 'Only alphanumeric characters and hyphens allowed'),
    planId: z.string().uuid('Invalid plan ID'),
  }),
});

export const updateVMSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid VM ID'),
  }),
  body: z.object({
    name: z.string()
      .min(3, 'Name must be at least 3 characters')
      .max(50, 'Name must not exceed 50 characters')
      .regex(/^[a-zA-Z0-9-]+$/, 'Only alphanumeric characters and hyphens allowed'),
  }),
});

export const controlVMSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid VM ID'),
  }),
  body: z.object({
    action: z.enum(['start', 'stop', 'restart'], {
      errorMap: () => ({ message: 'Invalid action. Must be start, stop, or restart' }),
    }),
  }),
});

export const getVMMetricsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid VM ID'),
  }),
  query: z.object({
    timeframe: z.enum(['1h', '6h', '24h', '7d', '30d']).optional().default('1h'),
  }),
});