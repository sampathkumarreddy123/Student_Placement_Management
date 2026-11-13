import express from 'express';
import {
  applyForDrive,
  getMyApplications,
  getApplicationById,
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

// Shared / Detail route (protected; controller enforces student owns app or officer)
router.get('/:id', getApplicationById);

// Officer routes
router.get('/drive/:driveId', authorize('officer'), getDriveApplicants);
router.get('/', authorize('officer'), getAllApplications);
router.patch('/:id/status', authorize('officer'), updateApplicationStatus);

export default router;


