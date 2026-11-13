import express from 'express';
import {
  getMyNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearReadNotifications,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All notification endpoints are private to authenticated users
router.use(protect);

router.get('/', getMyNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/read-all', markAllNotificationsAsRead);
router.put('/:id/read', markNotificationAsRead);
router.delete('/clear-read', clearReadNotifications);
router.delete('/:id', deleteNotification);

export default router;

