import express from 'express';
import {
  applyForDrive,
  getMyApplications,
  getApplicationById,
  downloadApplicantResume,
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

// Shared / Detail & Resume download routes (protected; controller enforces student owns app or officer for their drive)
router.get('/:id', getApplicationById);
router.get('/:id/resume', downloadApplicantResume);

// Officer routes
router.get('/drive/:driveId', authorize('officer'), getDriveApplicants);
router.get('/', authorize('officer'), getAllApplications);
router.patch('/:id/status', authorize('officer'), updateApplicationStatus);

export default router;


