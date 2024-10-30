import { z } from 'zod';
import { VMStatus } from '@prisma/client';

// VM Status enum validation
const vmStatusEnum = z.enum(['PENDING', 'RUNNING', 'STOPPED', 'FAILED', 'TERMINATED']);

// Base VM validation schema
const vmBaseSchema = {
  name: z.string()
    .min(3, 'Name must be at least 3 characters')
    .max(50, 'Name must not exceed 50 characters')
    .regex(/^[a-zA-Z0-9-]+$/, 'Only alphanumeric characters and hyphens allowed'),
};

// Query Parameters validation
export const vmQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().transform(Number),
    limit: z.string().regex(/^\d+$/).optional().transform(Number),
    status: vmStatusEnum.optional(),
    sortBy: z.enum(['name', 'createdAt', 'status']).optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }).optional(),
});

// Create VM validation
export const createVMSchema = z.object({
  body: z.object({
    ...vmBaseSchema,
    planId: z.string().uuid('Invalid plan ID'),
  }),
});

// Update VM validation
export const updateVMSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid VM ID'),
  }),
  body: z.object({
    ...vmBaseSchema,
  }).partial(),
});

// Control VM validation
export const controlVMSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid VM ID'),
  }),
  body: z.object({
    action: z.enum(['start', 'stop', 'restart'], {
      errorMap: () => ({ message: 'Action must be start, stop, or restart' }),
    }),
  }),
});

// Get VM Metrics validation
export const getVMMetricsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid VM ID'),
  }),
  query: z.object({
    timeframe: z.enum(['1h', '6h', '24h', '7d', '30d']).optional().default('1h'),
  }).optional(),
});

// Create Backup validation
export const createBackupSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid VM ID'),
  }),
  body: z.object({
    name: z.string().min(3).max(50).optional(),
  }).optional(),
});

// Delete VM validation
export const deleteVMSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid VM ID'),
  }),
});

// VM ID parameter validation
export const vmIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid VM ID'),
  }),
});

// Error messages
export const VM_VALIDATION_MESSAGES = {
  NAME_REQUIRED: 'VM name is required',
  NAME_MIN_LENGTH: 'Name must be at least 3 characters',
  NAME_MAX_LENGTH: 'Name must not exceed 50 characters',
  NAME_FORMAT: 'Only alphanumeric characters and hyphens allowed',
  PLAN_ID_REQUIRED: 'Plan ID is required',
  PLAN_ID_INVALID: 'Invalid plan ID format',
  VM_ID_INVALID: 'Invalid VM ID format',
  ACTION_INVALID: 'Invalid action. Must be start, stop, or restart',
  TIMEFRAME_INVALID: 'Invalid timeframe',
} as const;