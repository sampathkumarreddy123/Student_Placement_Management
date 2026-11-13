import express from 'express';
import {
  getMyProfile,
  updateMyProfile,
  uploadResumeFile,
  downloadResumeFile,
  uploadAvatarFile,
  getAllStudents,
  getPlacementStats,
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { uploadResume, uploadAvatar } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Student Profile Management routes
router.get('/profile', protect, authorize('student'), getMyProfile);
router.put('/profile', protect, authorize('student'), updateMyProfile);
router.post(
  '/profile/resume',
  protect,
  authorize('student'),
  uploadResume.single('resume'),
  uploadResumeFile
);
router.get('/profile/resume/download', protect, authorize('student'), downloadResumeFile);
router.post(
  '/profile/avatar',
  protect,
  authorize('student'),
  uploadAvatar.single('avatar'),
  uploadAvatarFile
);

// Officer routes
router.get('/students', protect, authorize('officer'), getAllStudents);
router.get('/stats', protect, authorize('officer'), getPlacementStats);

export default router;
