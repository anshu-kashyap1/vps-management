import express from 'express';
import { register, login, forgotPassword, resetPassword } from '../controllers/authController';
import { AppError } from '../middleware/errorHandler';

const router = express.Router();

// Test error handling
router.get('/test-error', (_req, _res, next) => {
  try {
    throw new AppError('Test error', 400);
  } catch (error) {
    next(error);
  }
});

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;