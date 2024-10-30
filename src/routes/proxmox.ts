import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth';
import {
  getNodes,
  getNodeStatus,
  getNodeResources,
  getAllVMs,
  getTemplates,
  getVMMetrics,
} from '../controllers/proxmoxController';

const router = express.Router();

// Protect all routes
router.use(authenticateToken);

// Node routes
router.get('/nodes', isAdmin, getNodes);
router.get('/nodes/:node/status', isAdmin, getNodeStatus);
router.get('/nodes/:node/resources', isAdmin, getNodeResources);

// VM routes
router.get('/vms', isAdmin, getAllVMs);
router.get('/templates', isAdmin, getTemplates);
router.get('/nodes/:node/vms/:vmid/metrics', isAdmin, getVMMetrics);

export default router;