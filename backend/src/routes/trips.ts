import { Router, Response } from 'express';
import { db } from '../db/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/trips
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const status = req.query.status as string;
  const search = req.query.search as string;
  const sort = (req.query.sort as string) || 'newest';

  let query = `
    SELECT t.*,
           (SELECT COUNT(DISTINCT city_id) FROM trip_stops WHERE trip_id = t.id) as cities_count,
           (SELECT COUNT(*) FROM trip_activities WHERE trip_id = t.id) as activities_count,
           (SELECT SUM(cost) FROM trip_activities WHERE trip_id = t.id) as calculated_activities_cost,
           (SELECT SUM(total_cost) FROM accommodations WHERE trip_id = t.id) as calculated_acc_cost,
           (SELECT SUM(cost) FROM transportation WHERE trip_id = t.id) as calculated_trans_cost
    FROM trips t
    WHERE (t.user_id = ? OR t.id IN (SELECT trip_id FROM trip_members WHERE user_id = ? OR email = ?))
  `;

  const params: any[] = [userId, userId, req.user!.email];

  if (status && status !== 'All') {
    query += ` AND t.status = ?`;
    params.push(status);
  }

  if (search) {
    query += ` AND (t.title LIKE ? OR t.description LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  if (sort === 'budget_high') {
    query += ` ORDER BY t.estimated_budget DESC`;
  } else if (sort === 'budget_low') {
    query += ` ORDER BY t.estimated_budget ASC`;
  } else if (sort === 'oldest') {
    query += ` ORDER BY t.created_at ASC`;
  } else {
    query += ` ORDER BY t.start_date DESC, t.created_at DESC`;
  }

  const trips = db.prepare(query).all(...params);

  // Compute calculated statistics per trip
  const formattedTrips = trips.map((t: any) => {
    const startDate = new Date(t.start_date);
    const endDate = new Date(t.end_date);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const totalEst = (t.calculated_activities_cost || 0) + (t.calculated_acc_cost || 0) + (t.calculated_trans_cost || 0);

    return {
      ...t,
      days_count: daysCount,
      total_estimated_cost: totalEst > 0 ? totalEst : t.estimated_budget
    };
  });

  return res.json(formattedTrips);
});

// POST /api/trips
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { title, description, cover_image, start_date, end_date, estimated_budget, currency, initial_cities } = req.body;

  if (!title || !start_date || !end_date) {
    return res.status(400).json({ error: 'Title, start date, and end date are required' });
  }

  const tripId = `trip_${Date.now()}`;
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);
  const image = cover_image || 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=80';

  db.prepare(`
    INSERT INTO trips (id, user_id, title, description, cover_image, start_date, end_date, estimated_budget, currency, status, visibility, public_slug)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Upcoming', 'Private', ?)
  `).run(tripId, userId, title, description || '', image, start_date, end_date, estimated_budget || 0, currency || 'INR', slug);

  // Add creator as Owner in trip_members
  db.prepare(`
    INSERT INTO trip_members (id, trip_id, user_id, email, role, status)
    VALUES (?, ?, ?, ?, 'Owner', 'Accepted')
  `).run(`mem_${Date.now()}`, tripId, userId, req.user!.email);

  // Add initial city stops if provided
  if (initial_cities && Array.isArray(initial_cities)) {
    const stmtStop = db.prepare(`
      INSERT INTO trip_stops (id, trip_id, city_id, stop_order, arrival_date, departure_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    initial_cities.forEach((cityId: string, index: number) => {
      const stopId = `stop_${Date.now()}_${index}`;
      stmtStop.run(stopId, tripId, cityId, index + 1, start_date, end_date, `Stop #${index + 1}`);
    });
  }

  // Create achievement if first trip
  const count: any = db.prepare('SELECT COUNT(*) as cnt FROM trips WHERE user_id = ?').get(userId);
  if (count.cnt === 1) {
    db.prepare('INSERT OR IGNORE INTO user_achievements (id, user_id, achievement_id) VALUES (?, ?, ?)')
      .run(`ua_${Date.now()}`, userId, 'ach_1');
  }

  const createdTrip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
  return res.status(201).json(createdTrip);
});

// GET /api/trips/:id
router.get('/:id', (req, res) => {
  const tripId = req.params.id;

  const trip: any = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  // Fetch stops with city details
  const stops = db.prepare(`
    SELECT ts.*, c.name as city_name, c.country_name, c.image_url as city_image, c.latitude, c.longitude, c.avg_daily_cost
    FROM trip_stops ts
    JOIN cities c ON ts.city_id = c.id
    WHERE ts.trip_id = ?
    ORDER BY ts.stop_order ASC
  `).all(tripId);

  // Fetch activities
  const activities = db.prepare(`
    SELECT ta.*, a.name as original_name, a.image_url as original_image, a.rating,
           (SELECT COUNT(*) FROM activity_votes WHERE trip_activity_id = ta.id AND vote_type = 'up') as upvotes,
           (SELECT COUNT(*) FROM activity_votes WHERE trip_activity_id = ta.id AND vote_type = 'down') as downvotes
    FROM trip_activities ta
    LEFT JOIN activities a ON ta.activity_id = a.id
    WHERE ta.trip_id = ?
    ORDER BY ta.day_number ASC, ta.activity_order ASC, ta.time_slot ASC
  `).all(tripId);

  // Fetch accommodations
  const accommodations = db.prepare(`
    SELECT * FROM accommodations WHERE trip_id = ? ORDER BY check_in ASC
  `).all(tripId);

  // Fetch transportation
  const transportation = db.prepare(`
    SELECT * FROM transportation WHERE trip_id = ? ORDER BY departure_time ASC
  `).all(tripId);

  // Fetch actual expenses
  const expenses = db.prepare(`
    SELECT * FROM expenses WHERE trip_id = ? ORDER BY date DESC, created_at DESC
  `).all(tripId);

  // Fetch members
  const members = db.prepare(`
    SELECT tm.*, u.full_name, u.profile_photo
    FROM trip_members tm
    LEFT JOIN users u ON tm.user_id = u.id
    WHERE tm.trip_id = ?
  `).all(tripId);

  // Fetch comments
  const comments = db.prepare(`
    SELECT c.*, u.full_name, u.profile_photo
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.trip_id = ?
    ORDER BY c.created_at ASC
  `).all(tripId);

  return res.json({
    ...trip,
    stops,
    activities,
    accommodations,
    transportation,
    expenses,
    members,
    comments
  });
});

// PUT /api/trips/:id
router.put('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const tripId = req.params.id;
  const { title, description, cover_image, start_date, end_date, estimated_budget, currency, status, visibility } = req.body;

  const trip: any = db.prepare('SELECT user_id FROM trips WHERE id = ?').get(tripId);
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  db.prepare(`
    UPDATE trips
    SET title = COALESCE(?, title),
        description = COALESCE(?, description),
        cover_image = COALESCE(?, cover_image),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        estimated_budget = COALESCE(?, estimated_budget),
        currency = COALESCE(?, currency),
        status = COALESCE(?, status),
        visibility = COALESCE(?, visibility),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(title, description, cover_image, start_date, end_date, estimated_budget, currency, status, visibility, tripId);

  const updated = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
  return res.json(updated);
});

// DELETE /api/trips/:id
router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const tripId = req.params.id;

  const result = db.prepare('DELETE FROM trips WHERE id = ? AND user_id = ?').run(tripId, req.user!.id);
  if (result.changes === 0) {
    return res.status(403).json({ error: 'Trip not found or unauthorized' });
  }

  return res.json({ message: 'Trip deleted successfully' });
});

// POST /api/trips/:id/duplicate
router.post('/:id/duplicate', authenticateToken, (req: AuthRequest, res: Response) => {
  const sourceTripId = req.params.id;
  const userId = req.user!.id;

  const sourceTrip: any = db.prepare('SELECT * FROM trips WHERE id = ?').get(sourceTripId);
  if (!sourceTrip) {
    return res.status(404).json({ error: 'Source trip not found' });
  }

  const newTripId = `trip_${Date.now()}`;
  const newTitle = `Copy of ${sourceTrip.title}`;
  const slug = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);

  db.prepare(`
    INSERT INTO trips (id, user_id, title, description, cover_image, start_date, end_date, estimated_budget, currency, status, visibility, public_slug)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft', 'Private', ?)
  `).run(newTripId, userId, newTitle, sourceTrip.description, sourceTrip.cover_image, sourceTrip.start_date, sourceTrip.end_date, sourceTrip.estimated_budget, sourceTrip.currency, slug);

  // Duplicate stops
  const stops = db.prepare('SELECT * FROM trip_stops WHERE trip_id = ?').all(sourceTripId);
  const stopMap: Record<string, string> = {};

  stops.forEach((stop: any, index: number) => {
    const newStopId = `stop_${Date.now()}_${index}`;
    stopMap[stop.id] = newStopId;

    db.prepare(`
      INSERT INTO trip_stops (id, trip_id, city_id, stop_order, arrival_date, departure_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(newStopId, newTripId, stop.city_id, stop.stop_order, stop.arrival_date, stop.departure_date, stop.notes);
  });

  // Duplicate activities
  const activities = db.prepare('SELECT * FROM trip_activities WHERE trip_id = ?').all(sourceTripId);
  activities.forEach((act: any, index: number) => {
    const newActId = `tact_${Date.now()}_${index}`;
    const targetStopId = stopMap[act.trip_stop_id] || Object.values(stopMap)[0];

    db.prepare(`
      INSERT INTO trip_activities (id, trip_id, trip_stop_id, activity_id, day_number, custom_title, category, time_slot, duration_minutes, cost, notes, activity_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(newActId, newTripId, targetStopId, act.activity_id, act.day_number, act.custom_title, act.category, act.time_slot, act.duration_minutes, act.cost, act.notes, act.activity_order);
  });

  db.prepare(`
    INSERT INTO trip_members (id, trip_id, user_id, email, role, status)
    VALUES (?, ?, ?, ?, 'Owner', 'Accepted')
  `).run(`mem_${Date.now()}`, newTripId, userId, req.user!.email);

  return res.status(201).json({ message: 'Trip duplicated successfully', newTripId });
});

export default router;
