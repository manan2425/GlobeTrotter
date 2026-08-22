import { Router, Response } from 'express';
import { db } from '../db/db';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/admin/dashboard
router.get('/dashboard', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const usersCount: any = await db.prepare('SELECT COUNT(*) as cnt FROM users').get();
    const tripsCount: any = await db.prepare('SELECT COUNT(*) as cnt FROM trips').get();
    const sharedTripsCount: any = await db.prepare("SELECT COUNT(*) as cnt FROM trips WHERE visibility = 'Public'").get();
    const avgBudget: any = await db.prepare('SELECT AVG(estimated_budget) as avg_b FROM trips').get();
    const citiesCount: any = await db.prepare('SELECT COUNT(*) as cnt FROM cities').get();
    const activitiesCount: any = await db.prepare('SELECT COUNT(*) as cnt FROM activities').get();

    const popularCities = await db.prepare(`
      SELECT c.name as city_name, c.country_name, COUNT(ts.id) as trip_stops_count
      FROM cities c
      LEFT JOIN trip_stops ts ON c.id = ts.city_id
      GROUP BY c.id, c.name, c.country_name
      ORDER BY trip_stops_count DESC
      LIMIT 6
    `).all();

    const activityCategoryBreakdown = await db.prepare(`
      SELECT category, COUNT(*) as count
      FROM activities
      GROUP BY category
    `).all();

    return res.json({
      kpis: {
        total_users: usersCount ? usersCount.cnt : 0,
        total_trips: tripsCount ? tripsCount.cnt : 0,
        active_users: Math.max(1, usersCount ? usersCount.cnt : 0),
        shared_trips: sharedTripsCount ? sharedTripsCount.cnt : 0,
        total_cities: citiesCount ? citiesCount.cnt : 0,
        total_activities: activitiesCount ? activitiesCount.cnt : 0,
        avg_trip_budget: Math.round(avgBudget ? avgBudget.avg_b || 28500 : 28500)
      },
      popular_cities: popularCities,
      activity_category_breakdown: activityCategoryBreakdown,
      trips_created_trend: [
        { month: 'May', trips: 12, users: 8 },
        { month: 'Jun', trips: 28, users: 19 },
        { month: 'Jul', trips: 45, users: 34 },
        { month: 'Aug', trips: 89, users: 62 }
      ]
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users
router.get('/users', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const search = req.query.search as string;
    let query = `
      SELECT u.id, u.email, u.full_name, u.role, u.status, u.created_at,
             (SELECT COUNT(*) FROM trips WHERE user_id = u.id) as trips_count
      FROM users u
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      query += ` AND (u.full_name LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY u.created_at DESC`;
    const users = await db.prepare(query).all(...params);

    return res.json(users);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { role } = req.body;
    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Role must be admin or user' });
    }

    await db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
    return res.json({ message: `User role updated to ${role}` });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/users/:id/status
router.patch('/users/:id/status', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { status } = req.body; // 'Active' or 'Banned'
    if (!['Active', 'Banned'].includes(status)) {
      return res.status(400).json({ error: 'Status must be Active or Banned' });
    }

    await db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, req.params.id);
    return res.json({ message: `User status updated to ${status}` });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    await db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    return res.json({ message: 'User account purged successfully' });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/trips
router.get('/trips', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const search = req.query.search as string;
    let query = `
      SELECT t.*, u.full_name as author_name, u.email as author_email,
             (SELECT COUNT(DISTINCT city_id) FROM trip_stops WHERE trip_id = t.id) as cities_count
      FROM trips t
      JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      query += ` AND (t.title LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY t.created_at DESC`;
    const trips = await db.prepare(query).all(...params);

    return res.json(trips);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/trips/:id/visibility
router.patch('/trips/:id/visibility', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { visibility } = req.body;
    if (!['Public', 'Private', 'Friends'].includes(visibility)) {
      return res.status(400).json({ error: 'Visibility must be Public, Private, or Friends' });
    }

    await db.prepare('UPDATE trips SET visibility = ? WHERE id = ?').run(visibility, req.params.id);
    return res.json({ message: `Trip visibility overridden to ${visibility}` });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/trips/:id
router.delete('/trips/:id', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    await db.prepare('DELETE FROM trips WHERE id = ?').run(req.params.id);
    return res.json({ message: 'Trip deleted by admin moderation' });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/cities
router.post('/cities', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { name, country_name, region, popularity_score, avg_daily_cost, image_url, description, latitude, longitude } = req.body;

    if (!name || !country_name) {
      return res.status(400).json({ error: 'City name and country are required' });
    }

    const cityId = `city_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;

    await db.prepare(`
      INSERT INTO cities (id, country_id, name, country_name, region, popularity_score, avg_daily_cost, image_url, description, latitude, longitude)
      VALUES (?, 'cntry_ind', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      cityId,
      name,
      country_name,
      region || 'Asia',
      Number(popularity_score) || 4.5,
      Number(avg_daily_cost) || 3500,
      image_url || 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80',
      description || '',
      Number(latitude) || 20.0992,
      Number(longitude) || 75.7873
    );

    const createdCity = await db.prepare('SELECT * FROM cities WHERE id = ?').get(cityId);
    return res.status(201).json(createdCity);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/activities
router.post('/activities', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { city_id, name, category, location_name, duration_minutes, estimated_cost, description, image_url } = req.body;

    if (!city_id || !name) {
      return res.status(400).json({ error: 'City ID and Activity name are required' });
    }

    const actId = `act_${Date.now()}`;

    await db.prepare(`
      INSERT INTO activities (id, city_id, name, category, location_name, duration_minutes, estimated_cost, description, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      actId,
      city_id,
      name,
      category || 'Sightseeing',
      location_name || '',
      Number(duration_minutes) || 120,
      Number(estimated_cost) || 500,
      description || '',
      image_url || 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80'
    );

    const createdAct = await db.prepare('SELECT * FROM activities WHERE id = ?').get(actId);
    return res.status(201).json(createdAct);
  } catch (err) {
    next(err);
  }
});

export default router;
