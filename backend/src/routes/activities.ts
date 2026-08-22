import { Router, Response } from 'express';
import { db } from '../db/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/activities
router.get('/activities', async (req, res, next) => {
  try {
    const { city_id, category, search, min_cost, max_cost, max_duration, sort_by } = req.query;

    let query = `SELECT a.*, c.name as city_name, c.country_name FROM activities a JOIN cities c ON a.city_id = c.id WHERE 1=1`;
    const params: any[] = [];

    if (city_id) {
      query += ` AND a.city_id = ?`;
      params.push(city_id);
    }

    if (category && category !== 'All') {
      query += ` AND a.category = ?`;
      params.push(category);
    }

    if (search) {
      query += ` AND (a.name LIKE ? OR a.description LIKE ? OR a.location_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (min_cost) {
      query += ` AND a.estimated_cost >= ?`;
      params.push(Number(min_cost));
    }

    if (max_cost) {
      query += ` AND a.estimated_cost <= ?`;
      params.push(Number(max_cost));
    }

    if (max_duration) {
      query += ` AND a.duration_minutes <= ?`;
      params.push(Number(max_duration));
    }

    if (sort_by === 'cost_asc') {
      query += ` ORDER BY a.estimated_cost ASC, a.rating DESC`;
    } else if (sort_by === 'cost_desc') {
      query += ` ORDER BY a.estimated_cost DESC, a.rating DESC`;
    } else if (sort_by === 'duration') {
      query += ` ORDER BY a.duration_minutes ASC, a.rating DESC`;
    } else {
      query += ` ORDER BY a.rating DESC, a.name ASC`;
    }

    const activities = await db.prepare(query).all(...params);
    return res.json(activities);
  } catch (err) {
    next(err);
  }
});

// GET /api/cities/:id/activities
router.get('/cities/:id/activities', async (req, res, next) => {
  try {
    const cityId = req.params.id;
    const activities = await db.prepare('SELECT * FROM activities WHERE city_id = ? ORDER BY rating DESC').all(cityId);
    return res.json(activities);
  } catch (err) {
    next(err);
  }
});

// POST /api/trips/:id/activities
router.post('/trips/:id/activities', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const tripId = req.params.id;
    const { trip_stop_id, activity_id, day_number, custom_title, category, time_slot, duration_minutes, cost, notes } = req.body;

    if (!trip_stop_id || !day_number) {
      return res.status(400).json({ error: 'trip_stop_id and day_number are required' });
    }

    let title = custom_title;
    let actCategory = category || 'Sightseeing';
    let actCost = cost || 0;
    let actDuration = duration_minutes || 60;

    if (activity_id) {
      const origAct: any = await db.prepare('SELECT * FROM activities WHERE id = ?').get(activity_id);
      if (origAct) {
        title = title || origAct.name;
        actCategory = actCategory || origAct.category;
        actCost = cost !== undefined ? cost : origAct.estimated_cost;
        actDuration = actDuration || origAct.duration_minutes;
      }
    }

    const maxOrder: any = await db.prepare('SELECT MAX(activity_order) as max_ord FROM trip_activities WHERE trip_stop_id = ? AND day_number = ?').get(trip_stop_id, day_number);
    const nextOrder = (maxOrder && maxOrder.max_ord) ? maxOrder.max_ord + 1 : 1;

    const tactId = `tact_${Date.now()}`;
    await db.prepare(`
      INSERT INTO trip_activities (id, trip_id, trip_stop_id, activity_id, day_number, custom_title, category, time_slot, duration_minutes, cost, notes, activity_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(tactId, tripId, trip_stop_id, activity_id || null, day_number, title || 'Custom Activity', actCategory, time_slot || '10:00', actDuration, actCost, notes || '', nextOrder);

    const newTact = await db.prepare('SELECT * FROM trip_activities WHERE id = ?').get(tactId);
    return res.status(201).json(newTact);
  } catch (err) {
    next(err);
  }
});

// PUT /api/trip-activities/:id
router.put('/trip-activities/:id', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const tactId = req.params.id;
    const { custom_title, category, time_slot, duration_minutes, cost, notes, day_number, is_completed } = req.body;

    await db.prepare(`
      UPDATE trip_activities
      SET custom_title = COALESCE(?, custom_title),
          category = COALESCE(?, category),
          time_slot = COALESCE(?, time_slot),
          duration_minutes = COALESCE(?, duration_minutes),
          cost = COALESCE(?, cost),
          notes = COALESCE(?, notes),
          day_number = COALESCE(?, day_number),
          is_completed = COALESCE(?, is_completed)
      WHERE id = ?
    `).run(custom_title, category, time_slot, duration_minutes, cost, notes, day_number, is_completed !== undefined ? (is_completed ? 1 : 0) : null, tactId);

    const updated = await db.prepare('SELECT * FROM trip_activities WHERE id = ?').get(tactId);
    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/trip-activities/:id
router.delete('/trip-activities/:id', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const tactId = req.params.id;
    await db.prepare('DELETE FROM trip_activities WHERE id = ?').run(tactId);
    return res.json({ message: 'Activity removed from trip' });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/trips/:id/activities/reorder
router.patch('/trips/:id/activities/reorder', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const tripId = req.params.id;
    const { ordered_activity_ids } = req.body;

    if (!Array.isArray(ordered_activity_ids)) {
      return res.status(400).json({ error: 'ordered_activity_ids array is required' });
    }

    const stmt = db.prepare('UPDATE trip_activities SET activity_order = ? WHERE id = ? AND trip_id = ?');
    for (let index = 0; index < ordered_activity_ids.length; index++) {
      const tactId = ordered_activity_ids[index];
      await stmt.run(index + 1, tactId, tripId);
    }

    return res.json({ message: 'Activities reordered successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
