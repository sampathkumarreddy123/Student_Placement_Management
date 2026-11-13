import express from 'express';
import {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  uploadCompanyLogo,
  deleteCompany,
  toggleArchiveCompany,
} from '../controllers/companyController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { uploadLogo } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);

// View companies (Both student and officer)
router.get('/', getCompanies);
router.get('/:id', getCompanyById);

// Officer restricted operations
router.post('/', authorize('officer'), createCompany);
router.put('/:id', authorize('officer'), updateCompany);
router.post(
  '/:id/logo',
  authorize('officer'),
  uploadLogo.single('logo'),
  uploadCompanyLogo
);
router.delete('/:id', authorize('officer'), deleteCompany);
router.patch('/:id/archive', authorize('officer'), toggleArchiveCompany);

export default router;
