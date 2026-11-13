import express from 'express';
import {
  applyForDrive,
  getMyApplications,
  getApplicationById,
  getApplicationStatusHistory,
  downloadApplicantResume,
  getDriveApplicants,
  getAllApplications,
  updateApplicationStatus,
} from '../controllers/applicationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// 1. Specific static & sub-routes (MUST be registered before /:id to prevent route hijacking)
router.post('/apply/:driveId', authorize('student'), applyForDrive);
router.get('/my', authorize('student'), getMyApplications);
router.get('/my-applications', authorize('student'), getMyApplications);
router.get('/drive/:driveId', authorize('officer'), getDriveApplicants);
router.get('/officer/all', authorize('officer'), getAllApplications);
router.get('/', authorize('officer'), getAllApplications);

// 2. Parameterized /:id routes
router.get('/:id', getApplicationById);
router.get('/:id/resume', downloadApplicantResume);
router.get('/:id/history', getApplicationStatusHistory);
router.patch('/:id/status', authorize('officer'), updateApplicationStatus);

export default router;


