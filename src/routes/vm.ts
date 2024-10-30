import express from 'express';
import { validateRequest } from '../middleware/validate';
import { authenticateToken } from '../middleware/auth';
import {
  getAllVMs,
  getVMById,
  createVM,
  updateVM,
  deleteVM,
  controlVM,
  getVMMetrics,
  createBackup,
  restoreBackup,
  getVMStats
} from '../controllers/vmController';
import {
  createVMSchema,
  updateVMSchema,
  controlVMSchema,
  vmIdSchema,
  getVMMetricsSchema,
  createBackupSchema
} from '../validators/vm.validator';

const router = express.Router();

// Apply authentication to all VM routes
router.use(authenticateToken);

// VM CRUD Operations
router.get('/', getAllVMs);
router.post('/', validateRequest(createVMSchema), createVM);
router.get('/:id', validateRequest(vmIdSchema), getVMById);
router.put('/:id', validateRequest(updateVMSchema), updateVM);
router.delete('/:id', validateRequest(vmIdSchema), deleteVM);

// VM Control Operations
router.post('/:id/control', validateRequest(controlVMSchema), controlVM);

// VM Metrics and Stats
router.get('/:id/metrics', validateRequest(getVMMetricsSchema), getVMMetrics);
router.get('/:id/stats', validateRequest(vmIdSchema), getVMStats);

// VM Backup Operations
router.post('/:id/backups', validateRequest(createBackupSchema), createBackup);
router.post('/:id/backups/:backupId/restore', validateRequest(vmIdSchema), restoreBackup);

export default router;