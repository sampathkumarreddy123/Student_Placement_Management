import express from 'express';
import {
  getDrives,
  getDriveById,
  createDrive,
  updateDrive,
  deleteDrive,
  publishDrive,
  closeDrive,
  archiveDrive,
} from '../controllers/driveController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getDrives);
router.get('/:id', getDriveById);

// Officer only management endpoints
router.post('/', authorize('officer'), createDrive);
router.put('/:id', authorize('officer'), updateDrive);
router.delete('/:id', authorize('officer'), deleteDrive);

// Lifecycle state transitions
router.patch('/:id/publish', authorize('officer'), publishDrive);
router.patch('/:id/close', authorize('officer'), closeDrive);
router.patch('/:id/archive', authorize('officer'), archiveDrive);

export default router;

