import { Router, Response } from 'express';
import { db } from '../db/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/trips/:id/stops
router.post('/trips/:id/stops', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const tripId = req.params.id;
    const { city_id, arrival_date, departure_date, notes } = req.body;

    if (!city_id || !arrival_date || !departure_date) {
      return res.status(400).json({ error: 'City, arrival date, and departure date are required' });
    }

    const maxOrder: any = await db.prepare('SELECT MAX(stop_order) as max_ord FROM trip_stops WHERE trip_id = ?').get(tripId);
    const nextOrder = (maxOrder && maxOrder.max_ord) ? maxOrder.max_ord + 1 : 1;

    const stopId = `stop_${Date.now()}`;
    await db.prepare(`
      INSERT INTO trip_stops (id, trip_id, city_id, stop_order, arrival_date, departure_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(stopId, tripId, city_id, nextOrder, arrival_date, departure_date, notes || '');

    const newStop = await db.prepare(`
      SELECT ts.*, c.name as city_name, c.country_name, c.image_url as city_image, c.latitude, c.longitude
      FROM trip_stops ts
      JOIN cities c ON ts.city_id = c.id
      WHERE ts.id = ?
    `).get(stopId);

    return res.status(201).json(newStop);
  } catch (err) {
    next(err);
  }
});

// PUT /api/stops/:id
router.put('/stops/:id', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const stopId = req.params.id;
    const { arrival_date, departure_date, notes, stop_order } = req.body;

    await db.prepare(`
      UPDATE trip_stops
      SET arrival_date = COALESCE(?, arrival_date),
          departure_date = COALESCE(?, departure_date),
          notes = COALESCE(?, notes),
          stop_order = COALESCE(?, stop_order)
      WHERE id = ?
    `).run(arrival_date, departure_date, notes, stop_order, stopId);

    const updated = await db.prepare(`
      SELECT ts.*, c.name as city_name, c.country_name, c.image_url as city_image
      FROM trip_stops ts
      JOIN cities c ON ts.city_id = c.id
      WHERE ts.id = ?
    `).get(stopId);

    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/stops/:id
router.delete('/stops/:id', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const stopId = req.params.id;
    await db.prepare('DELETE FROM trip_stops WHERE id = ?').run(stopId);
    return res.json({ message: 'Trip stop removed successfully' });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/trips/:id/stops/reorder
router.patch('/trips/:id/stops/reorder', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const tripId = req.params.id;
    const { ordered_stop_ids } = req.body;

    if (!Array.isArray(ordered_stop_ids)) {
      return res.status(400).json({ error: 'ordered_stop_ids array is required' });
    }

    const stmt = db.prepare('UPDATE trip_stops SET stop_order = ? WHERE id = ? AND trip_id = ?');
    for (let index = 0; index < ordered_stop_ids.length; index++) {
      const stopId = ordered_stop_ids[index];
      await stmt.run(index + 1, stopId, tripId);
    }

    return res.json({ message: 'Stops reordered successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
