import { Router, Response, Request } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/admin/dashboard (Public / Optional Token)
router.get('/dashboard', async (req: Request, res: Response, next) => {
  try {
    const usersCount: any = (await db.prepare('SELECT COUNT(*) as cnt FROM users').get()) || { cnt: 0 };
    const tripsCount: any = (await db.prepare('SELECT COUNT(*) as cnt FROM trips').get()) || { cnt: 0 };
    const sharedTripsCount: any = (await db.prepare("SELECT COUNT(*) as cnt FROM trips WHERE visibility = 'Public'").get()) || { cnt: 0 };
    const avgBudget: any = (await db.prepare('SELECT AVG(estimated_budget) as avg_b FROM trips').get()) || { avg_b: 28500 };
    const citiesCount: any = (await db.prepare('SELECT COUNT(*) as cnt FROM cities').get()) || { cnt: 0 };
    const activitiesCount: any = (await db.prepare('SELECT COUNT(*) as cnt FROM activities').get()) || { cnt: 0 };
    const templatesCount: any = (await db.prepare('SELECT COUNT(*) as cnt FROM trip_templates').get()) || { cnt: 0 };
    const countriesCount: any = (await db.prepare('SELECT COUNT(*) as cnt FROM countries').get()) || { cnt: 0 };

    let popularCities: any[] = [];
    try {
      popularCities = await db.prepare(`
        SELECT c.name as city_name, c.country_name, COUNT(ts.id) as trip_stops_count
        FROM cities c
        LEFT JOIN trip_stops ts ON c.id = ts.city_id
        GROUP BY c.id, c.name, c.country_name
        ORDER BY trip_stops_count DESC
        LIMIT 6
      `).all();
    } catch (e) {
      popularCities = [];
    }

    let activityCategoryBreakdown: any[] = [];
    try {
      activityCategoryBreakdown = await db.prepare(`
        SELECT category, COUNT(*) as count
        FROM activities
        GROUP BY category
      `).all();
    } catch (e) {
      activityCategoryBreakdown = [];
    }

    return res.json({
      kpis: {
        total_users: Number(usersCount.cnt || 0),
        total_trips: Number(tripsCount.cnt || 0),
        active_users: Math.max(1, Number(usersCount.cnt || 0)),
        shared_trips: Number(sharedTripsCount.cnt || 0),
        total_cities: Number(citiesCount.cnt || 0),
        total_activities: Number(activitiesCount.cnt || 0),
        total_templates: Number(templatesCount.cnt || 0),
        total_countries: Number(countriesCount.cnt || 0),
        avg_trip_budget: Math.round(Number(avgBudget.avg_b || 28500))
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
    console.error('Error in /admin/dashboard:', err);
    next(err);
  }
});

/* ==========================================================================
   1. USER MANAGEMENT CRUD
   ========================================================================== */

// GET /api/admin/users
router.get('/users', async (req: Request, res: Response, next) => {
  try {
    const search = req.query.search as string;
    let query = `
      SELECT u.id, u.email, u.full_name, u.role, u.status, u.currency, u.created_at,
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

// POST /api/admin/users (Create User)
router.post('/users', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { email, password, full_name, role, status } = req.body;
    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, password, and full name are required' });
    }

    const existing: any = await db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'User email already registered' });
    }

    const userId = `usr_${Date.now()}`;
    const password_hash = await bcrypt.hash(password, 10);

    await db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role, status, currency)
      VALUES (?, ?, ?, ?, ?, ?, 'INR')
    `).run(userId, email, password_hash, full_name, role || 'user', status || 'Active');

    await db.prepare(`
      INSERT INTO profiles (id, user_id, bio, home_city, home_country)
      VALUES (?, ?, 'Travel enthusiast on GlobeTrotter', 'Mumbai', 'India')
    `).run(`prof_${Date.now()}`, userId);

    const newUser = await db.prepare('SELECT id, email, full_name, role, status, created_at FROM users WHERE id = ?').get(userId);
    return res.status(201).json(newUser);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/users/:id (Update User)
router.put('/users/:id', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { full_name, email, role, status } = req.body;
    const userId = req.params.id;

    await db.prepare(`
      UPDATE users
      SET full_name = ?, email = ?, role = ?, status = ?
      WHERE id = ?
    `).run(full_name, email, role, status, userId);

    const updated = await db.prepare('SELECT id, email, full_name, role, status FROM users WHERE id = ?').get(userId);
    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { role } = req.body;
    await db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
    return res.json({ message: `User role updated to ${role}` });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/users/:id/status
router.patch('/users/:id/status', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { status } = req.body;
    await db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, req.params.id);
    return res.json({ message: `User status updated to ${status}` });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/users/:id (Delete User)
router.delete('/users/:id', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    await db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    return res.json({ message: 'User account purged successfully' });
  } catch (err) {
    next(err);
  }
});

/* ==========================================================================
   2. TRIP MANAGEMENT CRUD
   ========================================================================== */

// GET /api/admin/trips
router.get('/trips', async (req: Request, res: Response, next) => {
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

// POST /api/admin/trips (Create Trip)
router.post('/trips', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { user_id, title, description, cover_image, start_date, end_date, estimated_budget, visibility } = req.body;
    if (!title || !start_date || !end_date) {
      return res.status(400).json({ error: 'Title, start date, and end date are required' });
    }

    const tripId = `trip_${Date.now()}`;
    const targetUserId = user_id || req.user!.id;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);

    await db.prepare(`
      INSERT INTO trips (id, user_id, title, description, cover_image, start_date, end_date, estimated_budget, visibility, public_slug)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      tripId,
      targetUserId,
      title,
      description || '',
      cover_image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
      start_date,
      end_date,
      Number(estimated_budget) || 25000,
      visibility || 'Private',
      slug
    );

    const newTrip = await db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
    return res.status(201).json(newTrip);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/trips/:id (Update Trip)
router.put('/trips/:id', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { title, description, start_date, end_date, estimated_budget, status, visibility } = req.body;
    const tripId = req.params.id;

    await db.prepare(`
      UPDATE trips
      SET title = ?, description = ?, start_date = ?, end_date = ?, estimated_budget = ?, status = ?, visibility = ?
      WHERE id = ?
    `).run(title, description, start_date, end_date, Number(estimated_budget), status, visibility, tripId);

    const updated = await db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/trips/:id/visibility
router.patch('/trips/:id/visibility', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { visibility } = req.body;
    await db.prepare('UPDATE trips SET visibility = ? WHERE id = ?').run(visibility, req.params.id);
    return res.json({ message: `Trip visibility overridden to ${visibility}` });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/trips/:id (Delete Trip)
router.delete('/trips/:id', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    await db.prepare('DELETE FROM trips WHERE id = ?').run(req.params.id);
    return res.json({ message: 'Trip deleted by admin moderation' });
  } catch (err) {
    next(err);
  }
});

/* ==========================================================================
   3. DESTINATION CITIES CRUD
   ========================================================================== */

// POST /api/admin/cities (Create City)
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

// PUT /api/admin/cities/:id (Update City)
router.put('/cities/:id', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { name, country_name, region, popularity_score, avg_daily_cost, image_url, description } = req.body;
    const cityId = req.params.id;

    await db.prepare(`
      UPDATE cities
      SET name = ?, country_name = ?, region = ?, popularity_score = ?, avg_daily_cost = ?, image_url = ?, description = ?
      WHERE id = ?
    `).run(name, country_name, region, Number(popularity_score), Number(avg_daily_cost), image_url, description, cityId);

    const updated = await db.prepare('SELECT * FROM cities WHERE id = ?').get(cityId);
    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/cities/:id (Delete City)
router.delete('/cities/:id', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    await db.prepare('DELETE FROM cities WHERE id = ?').run(req.params.id);
    return res.json({ message: 'City deleted successfully' });
  } catch (err) {
    next(err);
  }
});

/* ==========================================================================
   4. ACTIVITIES CATALOG CRUD
   ========================================================================== */

// POST /api/admin/activities (Create Activity)
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

// PUT /api/admin/activities/:id (Update Activity)
router.put('/activities/:id', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { name, category, duration_minutes, estimated_cost, description, image_url } = req.body;
    const actId = req.params.id;

    await db.prepare(`
      UPDATE activities
      SET name = ?, category = ?, duration_minutes = ?, estimated_cost = ?, description = ?, image_url = ?
      WHERE id = ?
    `).run(name, category, Number(duration_minutes), Number(estimated_cost), description, image_url, actId);

    const updated = await db.prepare('SELECT * FROM activities WHERE id = ?').get(actId);
    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/activities/:id (Delete Activity)
router.delete('/activities/:id', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    await db.prepare('DELETE FROM activities WHERE id = ?').run(req.params.id);
    return res.json({ message: 'Activity deleted successfully' });
  } catch (err) {
    next(err);
  }
});

/* ==========================================================================
   5. TRIP TEMPLATES CRUD
   ========================================================================== */

// GET /api/admin/templates
router.get('/templates', async (req: Request, res: Response, next) => {
  try {
    const templates = await db.prepare('SELECT * FROM trip_templates').all();
    return res.json(templates);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/templates (Create Template)
router.post('/templates', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { title, description, category, cover_image, duration_days, estimated_budget, template_data_json } = req.body;
    if (!title || !duration_days || !estimated_budget) {
      return res.status(400).json({ error: 'Title, duration days, and estimated budget are required' });
    }

    const tmplId = `tmpl_${Date.now()}`;
    await db.prepare(`
      INSERT INTO trip_templates (id, title, description, category, cover_image, duration_days, estimated_budget, currency, template_data_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'INR', ?)
    `).run(
      tmplId,
      title,
      description || '',
      category || 'Heritage',
      cover_image || 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80',
      Number(duration_days),
      Number(estimated_budget),
      template_data_json || JSON.stringify({ cities: ['Varanasi'], highlights: ['Ganga Aarti'] })
    );

    const created = await db.prepare('SELECT * FROM trip_templates WHERE id = ?').get(tmplId);
    return res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/templates/:id (Update Template)
router.put('/templates/:id', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { title, description, category, cover_image, duration_days, estimated_budget } = req.body;
    const tmplId = req.params.id;

    await db.prepare(`
      UPDATE trip_templates
      SET title = ?, description = ?, category = ?, cover_image = ?, duration_days = ?, estimated_budget = ?
      WHERE id = ?
    `).run(title, description, category, cover_image, Number(duration_days), Number(estimated_budget), tmplId);

    const updated = await db.prepare('SELECT * FROM trip_templates WHERE id = ?').get(tmplId);
    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/templates/:id (Delete Template)
router.delete('/templates/:id', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    await db.prepare('DELETE FROM trip_templates WHERE id = ?').run(req.params.id);
    return res.json({ message: 'Trip template deleted successfully' });
  } catch (err) {
    next(err);
  }
});

/* ==========================================================================
   6. COUNTRIES CRUD
   ========================================================================== */

// GET /api/admin/countries
router.get('/countries', async (req: Request, res: Response, next) => {
  try {
    const countries = await db.prepare('SELECT * FROM countries').all();
    return res.json(countries);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/countries (Create Country)
router.post('/countries', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { name, code, currency, region } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Country name and ISO code are required' });
    }

    const cntryId = `cntry_${code.toLowerCase()}`;
    await db.prepare(`
      INSERT INTO countries (id, name, code, currency, region)
      VALUES (?, ?, ?, ?, ?)
    `).run(cntryId, name, code.toUpperCase(), currency || 'INR', region || 'Asia');

    const created = await db.prepare('SELECT * FROM countries WHERE id = ?').get(cntryId);
    return res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/countries/:id (Update Country)
router.put('/countries/:id', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const { name, code, currency, region } = req.body;
    const cntryId = req.params.id;

    await db.prepare(`
      UPDATE countries
      SET name = ?, code = ?, currency = ?, region = ?
      WHERE id = ?
    `).run(name, code.toUpperCase(), currency, region, cntryId);

    const updated = await db.prepare('SELECT * FROM countries WHERE id = ?').get(cntryId);
    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/countries/:id (Delete Country)
router.delete('/countries/:id', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    await db.prepare('DELETE FROM countries WHERE id = ?').run(req.params.id);
    return res.json({ message: 'Country entry deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
