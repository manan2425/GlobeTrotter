import { Router, Response } from 'express';
import { db } from '../db/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/activities
router.get('/activities', (req, res) => {
  const { city_id, category, search } = req.query;

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

  query += ` ORDER BY a.rating DESC, a.name ASC`;
  const activities = db.prepare(query).all(...params);
  return res.json(activities);
});

// GET /api/cities/:id/activities
router.get('/cities/:id/activities', (req, res) => {
  const cityId = req.params.id;
  const activities = db.prepare('SELECT * FROM activities WHERE city_id = ? ORDER BY rating DESC').all(cityId);
  return res.json(activities);
});

// POST /api/trips/:id/activities
router.post('/trips/:id/activities', authenticateToken, (req: AuthRequest, res: Response) => {
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
    const origAct: any = db.prepare('SELECT * FROM activities WHERE id = ?').get(activity_id);
    if (origAct) {
      title = title || origAct.name;
      actCategory = actCategory || origAct.category;
      actCost = cost !== undefined ? cost : origAct.estimated_cost;
      actDuration = actDuration || origAct.duration_minutes;
    }
  }

  const maxOrder: any = db.prepare('SELECT MAX(activity_order) as max_ord FROM trip_activities WHERE trip_stop_id = ? AND day_number = ?').get(trip_stop_id, day_number);
  const nextOrder = (maxOrder && maxOrder.max_ord) ? maxOrder.max_ord + 1 : 1;

  const tactId = `tact_${Date.now()}`;
  db.prepare(`
    INSERT INTO trip_activities (id, trip_id, trip_stop_id, activity_id, day_number, custom_title, category, time_slot, duration_minutes, cost, notes, activity_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(tactId, tripId, trip_stop_id, activity_id || null, day_number, title || 'Custom Activity', actCategory, time_slot || '10:00', actDuration, actCost, notes || '', nextOrder);

  const newTact = db.prepare('SELECT * FROM trip_activities WHERE id = ?').get(tactId);
  return res.status(201).json(newTact);
});

// PUT /api/trip-activities/:id
router.put('/trip-activities/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const tactId = req.params.id;
  const { custom_title, category, time_slot, duration_minutes, cost, notes, day_number, is_completed } = req.body;

  db.prepare(`
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

  const updated = db.prepare('SELECT * FROM trip_activities WHERE id = ?').get(tactId);
  return res.json(updated);
});

// DELETE /api/trip-activities/:id
router.delete('/trip-activities/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const tactId = req.params.id;
  db.prepare('DELETE FROM trip_activities WHERE id = ?').run(tactId);
  return res.json({ message: 'Activity removed from trip' });
});

// PATCH /api/trips/:id/activities/reorder
router.patch('/trips/:id/activities/reorder', authenticateToken, (req: AuthRequest, res: Response) => {
  const tripId = req.params.id;
  const { ordered_activity_ids } = req.body;

  if (!Array.isArray(ordered_activity_ids)) {
    return res.status(400).json({ error: 'ordered_activity_ids array is required' });
  }

  const stmt = db.prepare('UPDATE trip_activities SET activity_order = ? WHERE id = ? AND trip_id = ?');
  ordered_activity_ids.forEach((tactId: string, index: number) => {
    stmt.run(index + 1, tactId, tripId);
  });

  return res.json({ message: 'Activities reordered successfully' });
});

export default router;
