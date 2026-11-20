import express from 'express';
import {
  chatWithCopilot,
  executeAction,
  getHistory,
  getConversationById,
  deleteConversation,
  clearAllHistory,
  getCopilotHealth,
} from '../controllers/copilotController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce strict Officer authentication & authorization on all Copilot routes
router.use(protect);
router.use(authorize('officer'));

router.get('/health', getCopilotHealth);
router.post('/chat', chatWithCopilot);
router.post('/execute-action', executeAction);

router.get('/history', getHistory);
router.delete('/history', clearAllHistory);
router.get('/history/:conversationId', getConversationById);
router.delete('/history/:conversationId', deleteConversation);

export default router;
