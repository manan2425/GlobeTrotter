import { Router, Response } from 'express';
import { db } from '../db/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/trips/:id/share
router.post('/trips/:id/share', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const tripId = req.params.id;
    const { visibility } = req.body;

    if (!['Private', 'Friends', 'Public'].includes(visibility)) {
      return res.status(400).json({ error: 'Visibility must be Private, Friends, or Public' });
    }

    const trip: any = await db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    let slug = trip.public_slug;
    if (!slug) {
      slug = trip.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);
    }

    await db.prepare(`
      UPDATE trips
      SET visibility = ?, public_slug = ?
      WHERE id = ?
    `).run(visibility, slug, tripId);

    const publicUrl = `http://localhost:3000/public/trips/${slug}`;

    return res.json({
      message: `Trip visibility set to ${visibility}`,
      visibility,
      public_slug: slug,
      public_url: publicUrl
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/public/trips/:slug
router.get('/public/trips/:slug', async (req, res, next) => {
  try {
    const slug = req.params.slug;

    const trip: any = await db.prepare(`
      SELECT t.*, u.full_name as author_name, u.profile_photo as author_photo
      FROM trips t
      JOIN users u ON t.user_id = u.id
      WHERE t.public_slug = ? AND t.visibility = 'Public'
    `).get(slug);

    if (!trip) {
      return res.status(404).json({ error: 'Public trip not found or access is restricted' });
    }

    const stops = await db.prepare(`
      SELECT ts.*, c.name as city_name, c.country_name, c.image_url as city_image, c.latitude, c.longitude
      FROM trip_stops ts
      JOIN cities c ON ts.city_id = c.id
      WHERE ts.trip_id = ?
      ORDER BY ts.stop_order ASC
    `).all(trip.id);

    const activities = await db.prepare(`
      SELECT ta.*, a.name as original_name, a.image_url as original_image
      FROM trip_activities ta
      LEFT JOIN activities a ON ta.activity_id = a.id
      WHERE ta.trip_id = ?
      ORDER BY ta.day_number ASC, ta.activity_order ASC
    `).all(trip.id);

    const accommodations = await db.prepare('SELECT * FROM accommodations WHERE trip_id = ?').all(trip.id);
    const transportation = await db.prepare('SELECT * FROM transportation WHERE trip_id = ?').all(trip.id);

    return res.json({
      ...trip,
      stops,
      activities,
      accommodations,
      transportation
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/public/trips/:slug/copy
router.post('/public/trips/:slug/copy', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const slug = req.params.slug;
    const userId = req.user!.id;

    const sourceTrip: any = await db.prepare(`SELECT * FROM trips WHERE public_slug = ? AND visibility = 'Public'`).get(slug);
    if (!sourceTrip) {
      return res.status(404).json({ error: 'Public trip not found' });
    }

    const newTripId = `trip_${Date.now()}`;
    const newTitle = `Copy of ${sourceTrip.title}`;
    const newSlug = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);

    await db.prepare(`
      INSERT INTO trips (id, user_id, title, description, cover_image, start_date, end_date, estimated_budget, currency, status, visibility, public_slug)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft', 'Private', ?)
    `).run(newTripId, userId, newTitle, sourceTrip.description, sourceTrip.cover_image, sourceTrip.start_date, sourceTrip.end_date, sourceTrip.estimated_budget, sourceTrip.currency, newSlug);

    const stops = await db.prepare('SELECT * FROM trip_stops WHERE trip_id = ?').all(sourceTrip.id);
    const stopMap: Record<string, string> = {};

    for (let index = 0; index < stops.length; index++) {
      const stop: any = stops[index];
      const newStopId = `stop_${Date.now()}_${index}`;
      stopMap[stop.id] = newStopId;

      await db.prepare(`
        INSERT INTO trip_stops (id, trip_id, city_id, stop_order, arrival_date, departure_date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(newStopId, newTripId, stop.city_id, stop.stop_order, stop.arrival_date, stop.departure_date, stop.notes);
    }

    const activities = await db.prepare('SELECT * FROM trip_activities WHERE trip_id = ?').all(sourceTrip.id);
    for (let index = 0; index < activities.length; index++) {
      const act: any = activities[index];
      const newActId = `tact_${Date.now()}_${index}`;
      const targetStopId = stopMap[act.trip_stop_id] || Object.values(stopMap)[0];

      await db.prepare(`
        INSERT INTO trip_activities (id, trip_id, trip_stop_id, activity_id, day_number, custom_title, category, time_slot, duration_minutes, cost, notes, activity_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(newActId, newTripId, targetStopId, act.activity_id, act.day_number, act.custom_title, act.category, act.time_slot, act.duration_minutes, act.cost, act.notes, act.activity_order);
    }

    await db.prepare(`
      INSERT INTO trip_members (id, trip_id, user_id, email, role, status)
      VALUES (?, ?, ?, ?, 'Owner', 'Accepted')
    `).run(`mem_${Date.now()}`, newTripId, userId, req.user!.email);

    return res.status(201).json({
      message: 'Trip copied to your account successfully!',
      newTripId
    });
  } catch (err) {
    next(err);
  }
});

export default router;
