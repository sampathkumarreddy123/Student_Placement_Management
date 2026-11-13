import express from 'express';
import {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
} from '../controllers/companyController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getCompanies);
router.get('/:id', getCompanyById);

// Officer only
router.post('/', authorize('officer'), createCompany);
router.put('/:id', authorize('officer'), updateCompany);
router.delete('/:id', authorize('officer'), deleteCompany);

export default router;

