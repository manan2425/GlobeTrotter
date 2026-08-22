import { Router, Response } from 'express';
import { db } from '../db/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/trips/:id/members
router.post('/trips/:id/members', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const tripId = req.params.id;
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const targetUser: any = await db.prepare('SELECT id, full_name FROM users WHERE email = ?').get(email);
    const memId = `mem_${Date.now()}`;

    await db.prepare(`
      INSERT INTO trip_members (id, trip_id, user_id, email, role, status)
      VALUES (?, ?, ?, ?, ?, 'Accepted')
    `).run(memId, tripId, targetUser ? targetUser.id : null, email, role || 'Editor');

    if (targetUser) {
      await db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, link_url)
        VALUES (?, ?, 'Trip Collaboration Invite 👥', ?, 'invite', ?)
      `).run(`notif_${Date.now()}`, targetUser.id, `You were added as a ${role || 'Editor'} to a trip!`, `/trips/${tripId}`);
    }

    const members = await db.prepare(`
      SELECT tm.*, u.full_name, u.profile_photo
      FROM trip_members tm
      LEFT JOIN users u ON tm.user_id = u.id
      WHERE tm.trip_id = ?
    `).all(tripId);

    return res.status(201).json(members);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/trips/:id/members/:userId
router.delete('/trips/:id/members/:userId', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { id: tripId, userId } = req.params;
    await db.prepare('DELETE FROM trip_members WHERE trip_id = ? AND (user_id = ? OR email = ?)').run(tripId, userId, userId);
    return res.json({ message: 'Member removed from trip' });
  } catch (err) {
    next(err);
  }
});

// GET /api/trips/:id/comments
router.get('/trips/:id/comments', async (req, res, next) => {
  try {
    const tripId = req.params.id;
    const comments = await db.prepare(`
      SELECT c.*, u.full_name, u.profile_photo
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.trip_id = ?
      ORDER BY c.created_at ASC
    `).all(tripId);

    return res.json(comments);
  } catch (err) {
    next(err);
  }
});

// POST /api/trips/:id/comments
router.post('/trips/:id/comments', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const tripId = req.params.id;
    const userId = req.user!.id;
    const { content, activity_id } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const commentId = `comm_${Date.now()}`;
    await db.prepare(`
      INSERT INTO comments (id, trip_id, user_id, activity_id, content)
      VALUES (?, ?, ?, ?, ?)
    `).run(commentId, tripId, userId, activity_id || null, content);

    const newComment = await db.prepare(`
      SELECT c.*, u.full_name, u.profile_photo
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(commentId);

    return res.status(201).json(newComment);
  } catch (err) {
    next(err);
  }
});

// POST /api/trip-activities/:id/vote
router.post('/trip-activities/:id/vote', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const tactId = req.params.id;
    const userId = req.user!.id;
    const { vote_type } = req.body;

    if (!['up', 'down'].includes(vote_type)) {
      return res.status(400).json({ error: 'vote_type must be up or down' });
    }

    const voteId = `vote_${Date.now()}`;
    await db.prepare(`
      INSERT INTO activity_votes (id, trip_activity_id, user_id, vote_type)
      VALUES (?, ?, ?, ?)
    `).run(voteId, tactId, userId, vote_type);

    const upvotes: any = await db.prepare("SELECT COUNT(*) as count FROM activity_votes WHERE trip_activity_id = ? AND vote_type = 'up'").get(tactId);
    const downvotes: any = await db.prepare("SELECT COUNT(*) as count FROM activity_votes WHERE trip_activity_id = ? AND vote_type = 'down'").get(tactId);

    return res.json({
      trip_activity_id: tactId,
      upvotes: upvotes ? upvotes.count : 0,
      downvotes: downvotes ? downvotes.count : 0
    });
  } catch (err) {
    next(err);
  }
});

export default router;
