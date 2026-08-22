import { Router, Response } from 'express';
import { db } from '../db/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/destinations
router.get('/destinations', async (req, res, next) => {
  try {
    const { search, region, country_id, min_budget, max_budget } = req.query;

    let query = `
      SELECT c.*,
             (SELECT COUNT(*) FROM activities WHERE city_id = c.id) as activities_count
      FROM cities c
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      query += ` AND (c.name LIKE ? OR c.country_name LIKE ? OR c.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (region && region !== 'All') {
      query += ` AND c.region = ?`;
      params.push(region);
    }

    if (country_id && country_id !== 'All') {
      query += ` AND c.country_id = ?`;
      params.push(country_id);
    }

    if (max_budget) {
      query += ` AND c.avg_daily_cost <= ?`;
      params.push(Number(max_budget));
    }

    query += ` ORDER BY c.popularity_score DESC, c.name ASC`;
    const cities = await db.prepare(query).all(...params);
    return res.json(cities);
  } catch (err) {
    next(err);
  }
});

// GET /api/destinations/:id
router.get('/destinations/:id', async (req, res, next) => {
  try {
    const cityId = req.params.id;

    const city: any = await db.prepare('SELECT * FROM cities WHERE id = ?').get(cityId);
    if (!city) {
      return res.status(404).json({ error: 'City not found' });
    }

    const activities = await db.prepare('SELECT * FROM activities WHERE city_id = ? ORDER BY rating DESC').all(cityId);

    return res.json({
      ...city,
      activities
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/countries
router.get('/countries', async (req, res, next) => {
  try {
    const countries = await db.prepare('SELECT * FROM countries ORDER BY name ASC').all();
    return res.json(countries);
  } catch (err) {
    next(err);
  }
});

// POST /api/destinations/:id/save
router.post('/destinations/:id/save', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const cityId = req.params.id;
    const userId = req.user!.id;

    const existing = await db.prepare('SELECT id FROM saved_destinations WHERE user_id = ? AND city_id = ?').get(userId, cityId);
    if (existing) {
      await db.prepare('DELETE FROM saved_destinations WHERE user_id = ? AND city_id = ?').run(userId, cityId);
      return res.json({ saved: false, message: 'Destination removed from saved list' });
    } else {
      await db.prepare('INSERT INTO saved_destinations (id, user_id, city_id) VALUES (?, ?, ?)').run(`save_${Date.now()}`, userId, cityId);
      return res.json({ saved: true, message: 'Destination saved successfully!' });
    }
  } catch (err) {
    next(err);
  }
});

// GET /api/destinations/saved/me
router.get('/destinations/saved/me', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const userId = req.user!.id;
    const saved = await db.prepare(`
      SELECT c.*
      FROM saved_destinations sd
      JOIN cities c ON sd.city_id = c.id
      WHERE sd.user_id = ?
    `).all(userId);

    return res.json(saved);
  } catch (err) {
    next(err);
  }
});

export default router;
