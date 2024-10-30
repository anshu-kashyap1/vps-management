import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth';
import {
  getAllPlans,
  createPlan,
  getPlanById,
  updatePlan,
  deletePlan,
} from '../controllers/planController';

const router = express.Router();

// Public routes
router.get('/', getAllPlans);
router.get('/:id', getPlanById);

// Admin only routes
router.post('/', authenticateToken, isAdmin, createPlan);
router.put('/:id', authenticateToken, isAdmin, updatePlan);
router.delete('/:id', authenticateToken, isAdmin, deletePlan);

export default router;