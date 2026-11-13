import express from 'express';
import {
  getDrives,
  getDriveById,
  createDrive,
  updateDrive,
  deleteDrive,
} from '../controllers/driveController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getDrives);
router.get('/:id', getDriveById);

// Officer only
router.post('/', authorize('officer'), createDrive);
router.put('/:id', authorize('officer'), updateDrive);
router.delete('/:id', authorize('officer'), deleteDrive);

export default router;

