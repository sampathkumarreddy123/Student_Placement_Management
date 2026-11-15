import express from 'express';
import {
  getReportStatistics,
  getFullAnalyticsReports,
  exportApplicants,
  exportSelectedStudents,
} from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Placement Officer Analytics & Reports Routes
router.get('/statistics', protect, authorize('officer', 'admin'), getReportStatistics);
router.get('/analytics', protect, authorize('officer', 'admin'), getFullAnalyticsReports);
router.get('/export/applicants', protect, authorize('officer', 'admin'), exportApplicants);
router.get('/export/selected', protect, authorize('officer', 'admin'), exportSelectedStudents);

export default router;
