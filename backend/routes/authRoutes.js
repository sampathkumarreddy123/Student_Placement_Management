import express from 'express';
import {
  register,
  login,
  officerLogin,
  studentLogin,
  createOfficerAccount,
  logout,
  getMe,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/officer/login', officerLogin);
router.post('/student/login', studentLogin);
router.post('/officer/create', createOfficerAccount);
router.post('/logout', logout);

// Session verification
router.get('/me', protect, getMe);

export default router;

