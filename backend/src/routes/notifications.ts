import { Router, Response } from 'express';
import { db } from '../db/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/notifications
router.get('/notifications', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(userId);
  const unreadCount: any = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(userId);

  return res.json({
    notifications,
    unread_count: unreadCount ? unreadCount.count : 0
  });
});

// PATCH /api/notifications/:id/read
router.patch('/notifications/:id/read', authenticateToken, (req: AuthRequest, res: Response) => {
  const notifId = req.params.id;
  const userId = req.user!.id;

  if (notifId === 'all') {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId);
  } else {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(notifId, userId);
  }

  return res.json({ message: 'Notification marked as read' });
});

export default router;
