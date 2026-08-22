import { Router, Response } from 'express';
import { db } from '../db/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/trips/:id/members
router.post('/trips/:id/members', authenticateToken, (req: AuthRequest, res: Response) => {
  const tripId = req.params.id;
  const { email, role } = req.body; // role: 'Editor' or 'Viewer'

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Check if target user exists
  const targetUser: any = db.prepare('SELECT id, full_name FROM users WHERE email = ?').get(email);
  const memId = `mem_${Date.now()}`;

  db.prepare(`
    INSERT INTO trip_members (id, trip_id, user_id, email, role, status)
    VALUES (?, ?, ?, ?, ?, 'Accepted')
  `).run(memId, tripId, targetUser ? targetUser.id : null, email, role || 'Editor');

  if (targetUser) {
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, link_url)
      VALUES (?, ?, 'Trip Collaboration Invite 👥', ?, 'invite', ?)
    `).run(`notif_${Date.now()}`, targetUser.id, `You were added as a ${role || 'Editor'} to a trip!`, `/trips/${tripId}`);
  }

  const members = db.prepare(`
    SELECT tm.*, u.full_name, u.profile_photo
    FROM trip_members tm
    LEFT JOIN users u ON tm.user_id = u.id
    WHERE tm.trip_id = ?
  `).all(tripId);

  return res.status(201).json(members);
});

// DELETE /api/trips/:id/members/:userId
router.delete('/trips/:id/members/:userId', authenticateToken, (req: AuthRequest, res: Response) => {
  const { id: tripId, userId } = req.params;
  db.prepare('DELETE FROM trip_members WHERE trip_id = ? AND (user_id = ? OR email = ?)').run(tripId, userId, userId);
  return res.json({ message: 'Member removed from trip' });
});

// GET /api/trips/:id/comments
router.get('/trips/:id/comments', (req, res) => {
  const tripId = req.params.id;
  const comments = db.prepare(`
    SELECT c.*, u.full_name, u.profile_photo
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.trip_id = ?
    ORDER BY c.created_at ASC
  `).all(tripId);

  return res.json(comments);
});

// POST /api/trips/:id/comments
router.post('/trips/:id/comments', authenticateToken, (req: AuthRequest, res: Response) => {
  const tripId = req.params.id;
  const userId = req.user!.id;
  const { content, activity_id } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Comment content is required' });
  }

  const commentId = `comm_${Date.now()}`;
  db.prepare(`
    INSERT INTO comments (id, trip_id, user_id, activity_id, content)
    VALUES (?, ?, ?, ?, ?)
  `).run(commentId, tripId, userId, activity_id || null, content);

  const newComment = db.prepare(`
    SELECT c.*, u.full_name, u.profile_photo
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `).get(commentId);

  return res.status(201).json(newComment);
});

// POST /api/trip-activities/:id/vote
router.post('/trip-activities/:id/vote', authenticateToken, (req: AuthRequest, res: Response) => {
  const tactId = req.params.id;
  const userId = req.user!.id;
  const { vote_type } = req.body; // 'up' or 'down'

  if (!['up', 'down'].includes(vote_type)) {
    return res.status(400).json({ error: 'vote_type must be up or down' });
  }

  const voteId = `vote_${Date.now()}`;
  db.prepare(`
    INSERT OR REPLACE INTO activity_votes (id, trip_activity_id, user_id, vote_type)
    VALUES (?, ?, ?, ?)
  `).run(voteId, tactId, userId, vote_type);

  const upvotes: any = db.prepare("SELECT COUNT(*) as count FROM activity_votes WHERE trip_activity_id = ? AND vote_type = 'up'").get(tactId);
  const downvotes: any = db.prepare("SELECT COUNT(*) as count FROM activity_votes WHERE trip_activity_id = ? AND vote_type = 'down'").get(tactId);

  return res.json({
    trip_activity_id: tactId,
    upvotes: upvotes.count,
    downvotes: downvotes.count
  });
});

export default router;
