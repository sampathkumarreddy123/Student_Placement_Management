import express from 'express';
import {
  applyForDrive,
  getMyApplications,
  getDriveApplicants,
  getAllApplications,
  updateApplicationStatus,
} from '../controllers/applicationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Student routes
router.post('/apply/:driveId', authorize('student'), applyForDrive);
router.get('/my', authorize('student'), getMyApplications);

// Officer routes
router.get('/drive/:driveId', authorize('officer'), getDriveApplicants);
router.get('/', authorize('officer'), getAllApplications);
router.patch('/:id/status', authorize('officer'), updateApplicationStatus);

export default router;

