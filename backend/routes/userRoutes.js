import express from 'express';
import {
  getMyProfile,
  updateMyProfile,
  getAllStudents,
  getPlacementStats,
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Student routes
router.get('/profile', protect, authorize('student'), getMyProfile);
router.put('/profile', protect, authorize('student'), updateMyProfile);

// Officer routes
router.get('/students', protect, authorize('officer'), getAllStudents);
router.get('/stats', protect, authorize('officer'), getPlacementStats);

export default router;

