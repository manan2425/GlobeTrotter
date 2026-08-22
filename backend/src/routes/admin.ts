import { Router, Response } from 'express';
import { db } from '../db/db';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/admin/dashboard
router.get('/dashboard', authenticateToken, (req: AuthRequest, res: Response) => {
  const usersCount: any = db.prepare('SELECT COUNT(*) as cnt FROM users').get();
  const tripsCount: any = db.prepare('SELECT COUNT(*) as cnt FROM trips').get();
  const sharedTripsCount: any = db.prepare("SELECT COUNT(*) as cnt FROM trips WHERE visibility = 'Public'").get();
  const avgBudget: any = db.prepare('SELECT AVG(estimated_budget) as avg_b FROM trips').get();

  const popularCities = db.prepare(`
    SELECT c.name as city_name, c.country_name, COUNT(ts.id) as trip_stops_count
    FROM cities c
    LEFT JOIN trip_stops ts ON c.id = ts.city_id
    GROUP BY c.id
    ORDER BY trip_stops_count DESC
    LIMIT 6
  `).all();

  const activityCategoryBreakdown = db.prepare(`
    SELECT category, COUNT(*) as count
    FROM activities
    GROUP BY category
  `).all();

  return res.json({
    kpis: {
      total_users: usersCount.cnt,
      total_trips: tripsCount.cnt,
      active_users: Math.max(1, usersCount.cnt),
      shared_trips: sharedTripsCount.cnt,
      avg_trip_budget: Math.round(avgBudget.avg_b || 28500)
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
});

// GET /api/admin/users
router.get('/users', authenticateToken, (req: AuthRequest, res: Response) => {
  const users = db.prepare(`
    SELECT u.id, u.email, u.full_name, u.role, u.created_at,
           (SELECT COUNT(*) FROM trips WHERE user_id = u.id) as trips_count
    FROM users u
    ORDER BY u.created_at DESC
  `).all();

  return res.json(users);
});

// GET /api/admin/trips
router.get('/trips', authenticateToken, (req: AuthRequest, res: Response) => {
  const trips = db.prepare(`
    SELECT t.*, u.full_name as author_name
    FROM trips t
    JOIN users u ON t.user_id = u.id
    ORDER BY t.created_at DESC
  `).all();

  return res.json(trips);
});

export default router;
