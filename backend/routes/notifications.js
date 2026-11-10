import express from 'express';
import Notification from '../models/Notification.js';
import { memoryStore } from '../services/dataRepository.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// 1. GET USER NOTIFICATIONS
router.get('/', async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const currentRole = req.user.role;

    let userNotifs = [];
    try {
      userNotifs = await Notification.find({
        $or: [
          { recipientUserId: currentUserId },
          { recipientRole: currentRole },
          { recipientRole: 'all' }
        ]
      }).sort({ createdAt: -1 }).lean();
    } catch (e) {
      userNotifs = memoryStore.notifications.filter(n =>
        n.recipientUserId === currentUserId ||
        n.recipientRole === currentRole ||
        n.recipientRole === 'all'
      );
    }

    if (!userNotifs.length) {
      userNotifs = memoryStore.notifications.filter(n =>
        n.recipientUserId === currentUserId ||
        n.recipientRole === currentRole ||
        n.recipientRole === 'all'
      );
    }

    res.json({ success: true, notifications: userNotifs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. MARK NOTIFICATION AS READ
router.patch('/:id/read', async (req, res) => {
  try {
    const notifId = req.params.id;

    try {
      await Notification.updateOne(
        { notificationId: notifId },
        { $set: { isRead: true } }
      );
    } catch (e) {}

    const memNotif = memoryStore.notifications.find(n => n.notificationId === notifId);
    if (memNotif) memNotif.isRead = true;

    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

