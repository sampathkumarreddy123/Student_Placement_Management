import express from 'express';
import {
  register,
  login,
  officerLogin,
  studentLogin,
  createOfficerAccount,
  logout,
  getMe,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  changePassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  authLimiter,
  passwordResetLimiter,
  resendVerificationLimiter,
} from '../middleware/rateLimiter.js';

const router = express.Router();

// Public auth routes with rate limiting
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/officer/login', authLimiter, officerLogin);
router.post('/student/login', authLimiter, studentLogin);
router.post('/officer/create', createOfficerAccount);
router.post('/logout', logout);

// Email verification routes
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerificationLimiter, resendVerificationEmail);

// Password recovery & management
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.put('/change-password', protect, changePassword);

// Session verification
router.get('/me', protect, getMe);

export default router;

