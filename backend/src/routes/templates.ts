import { Router, Response } from 'express';
import { db } from '../db/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/templates
router.get('/templates', async (req, res, next) => {
  try {
    const templates = await db.prepare('SELECT * FROM trip_templates').all();
    const formatted = templates.map((t: any) => ({
      ...t,
      template_data: JSON.parse(t.template_data_json || '{}')
    }));
    return res.json(formatted);
  } catch (err) {
    next(err);
  }
});

// POST /api/templates/:id/use
router.post('/templates/:id/use', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const templateId = req.params.id;
    const userId = req.user!.id;

    const template: any = await db.prepare('SELECT * FROM trip_templates WHERE id = ?').get(templateId);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const tripId = `trip_${Date.now()}`;
    const slug = template.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);
    const startDate = new Date().toISOString().split('T')[0];

    const endDateObj = new Date();
    endDateObj.setDate(endDateObj.getDate() + (template.duration_days || 5));
    const endDate = endDateObj.toISOString().split('T')[0];

    // 1. Create Trip Entry
    await db.prepare(`
      INSERT INTO trips (id, user_id, title, description, cover_image, start_date, end_date, estimated_budget, currency, status, visibility, public_slug)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Upcoming', 'Private', ?)
    `).run(
      tripId,
      userId,
      template.title,
      template.description || '',
      template.cover_image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
      startDate,
      endDate,
      template.estimated_budget || 25000,
      template.currency || 'INR',
      slug
    );

    // 2. Resolve Cities and Create Stops
    const fallbackCity: any = await db.prepare('SELECT id FROM cities LIMIT 1').get();
    const defaultCityId = fallbackCity ? fallbackCity.id : 'city_amd';

    let tplData: any = {};
    try {
      tplData = JSON.parse(template.template_data_json || '{}');
    } catch (e) {
      tplData = {};
    }

    const rawCities = tplData.cities && Array.isArray(tplData.cities) && tplData.cities.length > 0
      ? tplData.cities
      : [defaultCityId];

    for (let idx = 0; idx < rawCities.length; idx++) {
      const cityItem = rawCities[idx];
      let validCityId = defaultCityId;

      // Find matching city in DB by ID or by Name
      const matchedCity: any = await db.prepare('SELECT id FROM cities WHERE id = ? OR name LIKE ? LIMIT 1').get(cityItem, `%${cityItem}%`);
      if (matchedCity) {
        validCityId = matchedCity.id;
      }

      const stopId = `stop_${Date.now()}_${idx}`;

      try {
        await db.prepare(`
          INSERT INTO trip_stops (id, trip_id, city_id, stop_order, arrival_date, departure_date, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(stopId, tripId, validCityId, idx + 1, startDate, endDate, `Template stop ${idx + 1}`);

        // Pre-populate 1 activity for this city stop if available
        const cityAct: any = await db.prepare('SELECT * FROM activities WHERE city_id = ? LIMIT 1').get(validCityId);
        if (cityAct) {
          await db.prepare(`
            INSERT INTO trip_activities (id, trip_id, trip_stop_id, activity_id, day_number, custom_title, category, time_slot, duration_minutes, cost, notes, activity_order)
            VALUES (?, ?, ?, ?, 1, ?, ?, '10:00', ?, ?, 'Pre-planned activity', 1)
          `).run(
            `tact_${Date.now()}_${idx}`,
            tripId,
            stopId,
            cityAct.id,
            cityAct.name,
            cityAct.category || 'Sightseeing',
            cityAct.duration_minutes || 90,
            cityAct.estimated_cost || 0
          );
        }
      } catch (stopErr) {
        console.error('Stop creation warning:', stopErr);
      }
    }

    // 3. Add User as Owner Member
    try {
      await db.prepare(`
        INSERT INTO trip_members (id, trip_id, user_id, email, role, status)
        VALUES (?, ?, ?, ?, 'Owner', 'Accepted')
      `).run(`mem_${Date.now()}`, tripId, userId, req.user!.email);
    } catch (memErr) {
      console.error('Member insert warning:', memErr);
    }

    return res.status(201).json({
      message: 'Trip created from template!',
      tripId
    });
  } catch (err) {
    console.error('Error creating trip from template:', err);
    next(err);
  }
});

export default router;
