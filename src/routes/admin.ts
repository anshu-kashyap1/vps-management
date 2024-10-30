import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth';
import {
  getAllUsers,
  getSystemStats,
  getUserDetails,
  updateUserStatus,
  getSystemMetrics,
} from '../controllers/adminController';

const router = express.Router();

// Protect all routes with authentication and admin check
router.use(authenticateToken, isAdmin);

// User management routes
router.get('/users', getAllUsers);
router.get('/users/:id', getUserDetails);
router.patch('/users/:id/status', updateUserStatus);

// System monitoring routes
router.get('/stats', getSystemStats);
router.get('/metrics', getSystemMetrics);

export default router;