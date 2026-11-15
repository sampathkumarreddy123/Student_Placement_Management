import express from 'express';
import {
  getRoundsByDrive,
  createRound,
  updateRound,
  deleteRound,
  getRoundCandidates,
  evaluateCandidate,
  moveQualifiedToNextRound,
  getStudentDriveRounds,
} from '../controllers/roundController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Student-accessible route to view rounds & progression for an applied drive
router.get('/drive/:driveId/student-view', protect, getStudentDriveRounds);

// Placement Officer Management Routes
router.get('/drive/:driveId', protect, authorize('officer'), getRoundsByDrive);
router.post('/drive/:driveId', protect, authorize('officer'), createRound);
router.put('/:roundId', protect, authorize('officer'), updateRound);
router.delete('/:roundId', protect, authorize('officer'), deleteRound);

// Candidate Evaluation in Rounds
router.get('/:roundId/candidates', protect, authorize('officer'), getRoundCandidates);
router.put('/:roundId/candidate/:applicationId/evaluate', protect, authorize('officer'), evaluateCandidate);
router.post('/:roundId/move-qualified', protect, authorize('officer'), moveQualifiedToNextRound);

export default router;
