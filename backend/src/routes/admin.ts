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
        avg_trip_budget: Math.round(avgBudget ? avgBudget.avg_b || 28500 : 28500)
      },
      popular_cities: popularCities,
      activity_category_breakdown: activityCategoryBreakdown,
      trips_created_trend: [
        { month: 'May', trips: 12 },
        { month: 'Jun', trips: 28 },
        { month: 'Jul', trips: 45 },
        { month: 'Aug', trips: 89 }
      ]
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users
router.get('/users', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const users = await db.prepare(`
      SELECT u.id, u.email, u.full_name, u.role, u.created_at,
             (SELECT COUNT(*) FROM trips WHERE user_id = u.id) as trips_count
      FROM users u
      ORDER BY u.created_at DESC
    `).all();

    return res.json(users);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/trips
router.get('/trips', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const trips = await db.prepare(`
      SELECT t.*, u.full_name as author_name
      FROM trips t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `).all();

    return res.json(trips);
  } catch (err) {
    next(err);
  }
});

export default router;
