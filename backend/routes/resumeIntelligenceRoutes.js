import express from 'express';
import {
  uploadAndAnalyzeResume,
  getResumeAnalysis,
  analyzeExistingResume,
  getJobMatches,
  getSingleDriveMatch,
  refreshSingleDriveMatch,
  getOfficerInsights,
  getOfficerStudentAnalysis,
  getOfficerDriveMatches,
} from '../controllers/resumeIntelligenceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { uploadResume } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// ==========================================
// STUDENT AI RESUME INTELLIGENCE ROUTES
// ==========================================
router.post(
  '/upload',
  protect,
  authorize('student'),
  uploadResume.single('resume'),
  uploadAndAnalyzeResume
);

router.post(
  '/analyze',
  protect,
  authorize('student'),
  analyzeExistingResume
);

router.get(
  '/analysis',
  protect,
  authorize('student'),
  getResumeAnalysis
);

router.get(
  '/matches',
  protect,
  authorize('student'),
  getJobMatches
);

router.get(
  '/matches/:driveId',
  protect,
  authorize('student'),
  getSingleDriveMatch
);

router.post(
  '/matches/:driveId/refresh',
  protect,
  authorize('student'),
  refreshSingleDriveMatch
);

// ==========================================
// OFFICER AI RESUME INSIGHTS ROUTES
// ==========================================
router.get(
  ['/insights', '/officer/insights'],
  protect,
  authorize('officer'),
  getOfficerInsights
);

router.get(
  ['/students/:studentId', '/officer/students/:studentId'],
  protect,
  authorize('officer'),
  getOfficerStudentAnalysis
);

router.get(
  ['/drives/:driveId/matches', '/officer/drives/:driveId/matches'],
  protect,
  authorize('officer'),
  getOfficerDriveMatches
);

export default router;
