import express from 'express';
import {
  getMyProfile,
  updateMyProfile,
  uploadResumeFile,
  downloadResumeFile,
  uploadAvatarFile,
  deleteAvatarFile,
  getOfficerProfile,
  updateOfficerProfile,
  getAllStudents,
  getStudentById,
  deleteStudentAccount,
  getStudentResumeFile,
  getPlacementStats,
  getOfficerDashboardData,
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

// Profile Avatar routes (Both Student & Placement Officer)
router.post(
  '/profile/avatar',
  protect,
  authorize('student', 'officer'),
  uploadAvatar.single('avatar'),
  uploadAvatarFile
);
router.delete('/profile/avatar', protect, authorize('student', 'officer'), deleteAvatarFile);

// Officer Profile Management routes
router.get('/officer/profile', protect, authorize('officer'), getOfficerProfile);
router.put('/officer/profile', protect, authorize('officer'), updateOfficerProfile);

// Officer Management routes
router.get('/students', protect, authorize('officer'), getAllStudents);
router.get('/students/:id/resume', protect, authorize('officer'), getStudentResumeFile);
router.get('/students/:id', protect, authorize('officer'), getStudentById);
router.delete('/students/:id', protect, authorize('officer'), deleteStudentAccount);
router.get('/stats', protect, authorize('officer'), getPlacementStats);
router.get('/officer/dashboard', protect, authorize('officer'), getOfficerDashboardData);

export default router;
