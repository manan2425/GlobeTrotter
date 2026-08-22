import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/db';
import { authenticateToken, AuthRequest, JWT_SECRET } from '../middleware/auth';

const router = Router();

// POST /api/auth/signup
router.post('/signup', (req, res) => {
  const { email, password, full_name, profile_photo } = req.body;

  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Email, password, and full name are required' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(400).json({ error: 'Email is already registered' });
  }

  const userId = `u_${Date.now()}`;
  const passwordHash = bcrypt.hashSync(password, 10);
  const photo = profile_photo || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80`;

  db.prepare(`
    INSERT INTO users (id, email, password_hash, full_name, profile_photo, role)
    VALUES (?, ?, ?, ?, ?, 'user')
  `).run(userId, email, passwordHash, full_name, photo);

  db.prepare(`
    INSERT INTO profiles (id, user_id, bio, home_city, home_country, is_public, public_trips)
    VALUES (?, ?, ?, 'Ahmedabad', 'India', 1, 1)
  `).run(`prof_${userId}`, userId, 'Enthusiastic GlobeTrotter traveler!');

  // Award first trip / signup notification
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type)
    VALUES (?, ?, 'Welcome to GlobeTrotter! ✈️', 'Start planning your dream multi-city journey today.', 'system')
  `).run(`notif_${Date.now()}`, userId);

  const token = jwt.sign({ id: userId, email, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });

  return res.status(201).json({
    message: 'User created successfully',
    token,
    user: { id: userId, email, full_name, profile_photo: photo, role: 'user', currency: 'INR' }
  });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const isValid = bcrypt.compareSync(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      profile_photo: user.profile_photo,
      role: user.role,
      currency: user.currency || 'INR',
      language: user.language || 'en'
    }
  });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(404).json({ error: 'No account found with this email' });
  }

  // Simulated password reset token link
  return res.json({
    message: 'Password reset instructions have been sent to your email address.',
    simulated_reset_link: `http://localhost:3000/reset-password?email=${encodeURIComponent(email)}&token=simulated_reset_token_${Date.now()}`
  });
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
  const user: any = db.prepare('SELECT id, email, full_name, profile_photo, role, currency, language, created_at FROM users WHERE id = ?').get(req.user!.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const profile: any = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(user.id);
  const achievements = db.prepare(`
    SELECT a.*, ua.unlocked_at
    FROM achievements a
    JOIN user_achievements ua ON a.id = ua.achievement_id
    WHERE ua.user_id = ?
  `).all(user.id);

  const tripsCount: any = db.prepare('SELECT COUNT(*) as count FROM trips WHERE user_id = ?').get(user.id);

  return res.json({
    user,
    profile,
    achievements,
    stats: {
      total_trips: tripsCount ? tripsCount.count : 0,
      cities_visited: 4,
      countries_explored: 2
    }
  });
});

// PUT /api/auth/profile
router.put('/profile', authenticateToken, (req: AuthRequest, res: Response) => {
  const { full_name, profile_photo, currency, bio, home_city, home_country, is_public } = req.body;

  db.prepare(`
    UPDATE users
    SET full_name = COALESCE(?, full_name),
        profile_photo = COALESCE(?, profile_photo),
        currency = COALESCE(?, currency),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(full_name, profile_photo, currency, req.user!.id);

  db.prepare(`
    UPDATE profiles
    SET bio = COALESCE(?, bio),
        home_city = COALESCE(?, home_city),
        home_country = COALESCE(?, home_country),
        is_public = COALESCE(?, is_public)
    WHERE user_id = ?
  `).run(bio, home_city, home_country, is_public !== undefined ? (is_public ? 1 : 0) : null, req.user!.id);

  return res.json({ message: 'Profile updated successfully' });
});

export default router;
