import { Router, Response } from 'express';
import { db } from '../db/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/notifications
router.get('/notifications', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const notifications = await db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(userId);
    const unreadCount: any = await db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(userId);

    return res.json({
      notifications,
      unread_count: unreadCount ? unreadCount.count : 0
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/:id/read
router.patch('/notifications/:id/read', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const notifId = req.params.id;
    const userId = req.user!.id;

    if (notifId === 'all') {
      await db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId);
    } else {
      await db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(notifId, userId);
    }

    return res.json({ message: 'Notification marked as read' });
  } catch (err) {
    next(err);
  }
});

export default router;
