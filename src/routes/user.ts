import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  getProfile, 
  updateProfile, 
  getUserVMs,
  getBillingInfo 
} from '../controllers/userController';

const router = express.Router();

// Profile routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

// VM routes
router.get('/vms', authenticateToken, getUserVMs);

// Billing routes
router.get('/billing', authenticateToken, getBillingInfo);

export default router;