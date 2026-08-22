import { Router, Response } from 'express';
import { db } from '../db/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/templates
router.get('/templates', (req, res) => {
  const templates = db.prepare('SELECT * FROM trip_templates').all();
  const formatted = templates.map((t: any) => ({
    ...t,
    template_data: JSON.parse(t.template_data_json || '{}')
  }));
  return res.json(formatted);
});

// POST /api/templates/:id/use
router.post('/templates/:id/use', authenticateToken, (req: AuthRequest, res: Response) => {
  const templateId = req.params.id;
  const userId = req.user!.id;

  const template: any = db.prepare('SELECT * FROM trip_templates WHERE id = ?').get(templateId);
  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }

  const tripId = `trip_${Date.now()}`;
  const slug = template.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);
  const startDate = new Date().toISOString().split('T')[0];

  const endDateObj = new Date();
  endDateObj.setDate(endDateObj.getDate() + template.duration_days);
  const endDate = endDateObj.toISOString().split('T')[0];

  db.prepare(`
    INSERT INTO trips (id, user_id, title, description, cover_image, start_date, end_date, estimated_budget, currency, status, visibility, public_slug)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft', 'Private', ?)
  `).run(tripId, userId, template.title, template.description, template.cover_image, startDate, endDate, template.estimated_budget, template.currency, slug);

  // Add cities from template
  const tplData = JSON.parse(template.template_data_json || '{}');
  if (tplData.cities && Array.isArray(tplData.cities)) {
    const stmtStop = db.prepare(`
      INSERT INTO trip_stops (id, trip_id, city_id, stop_order, arrival_date, departure_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    tplData.cities.forEach((cityId: string, idx: number) => {
      stmtStop.run(`stop_${Date.now()}_${idx}`, tripId, cityId, idx + 1, startDate, endDate, `Template stop ${idx + 1}`);
    });
  }

  db.prepare(`
    INSERT INTO trip_members (id, trip_id, user_id, email, role, status)
    VALUES (?, ?, ?, ?, 'Owner', 'Accepted')
  `).run(`mem_${Date.now()}`, tripId, userId, req.user!.email);

  return res.status(201).json({
    message: 'Trip created from template!',
    tripId
  });
});

export default router;
