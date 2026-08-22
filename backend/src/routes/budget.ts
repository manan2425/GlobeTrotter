import { Router, Response } from 'express';
import { db } from '../db/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/trips/:id/budget
router.get('/trips/:id/budget', async (req, res, next) => {
  try {
    const tripId = req.params.id;

    const trip: any = await db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const actStats: any[] = await db.prepare(`
      SELECT category, SUM(cost) as total_cost, COUNT(*) as count
      FROM trip_activities
      WHERE trip_id = ?
      GROUP BY category
    `).all(tripId);

    const accTotal: any = await db.prepare('SELECT SUM(total_cost) as total FROM accommodations WHERE trip_id = ?').get(tripId);
    const transTotal: any = await db.prepare('SELECT SUM(cost) as total FROM transportation WHERE trip_id = ?').get(tripId);
    const actualExpenses: any[] = await db.prepare('SELECT * FROM expenses WHERE trip_id = ? ORDER BY date DESC').all(tripId);

    const actualSpentTotal = actualExpenses.reduce((acc, exp) => acc + (exp.amount || 0), 0);

    const categoryBreakdown: Record<string, number> = {
      Transportation: (transTotal && transTotal.total) ? transTotal.total : 0,
      Accommodation: (accTotal && accTotal.total) ? accTotal.total : 0,
      Activities: 0,
      Food: 0,
      Shopping: 0,
      Miscellaneous: 0
    };

    actStats.forEach((st) => {
      if (st.category === 'Food') categoryBreakdown.Food += st.total_cost;
      else if (st.category === 'Shopping') categoryBreakdown.Shopping += st.total_cost;
      else categoryBreakdown.Activities += st.total_cost;
    });

    const totalEstimatedCost = Object.values(categoryBreakdown).reduce((a, b) => a + b, 0);

    const stops = await db.prepare(`
      SELECT ts.id, ts.city_id, c.name as city_name,
             (SELECT SUM(cost) FROM trip_activities WHERE trip_stop_id = ts.id) as activities_cost,
             (SELECT SUM(total_cost) FROM accommodations WHERE trip_stop_id = ts.id) as acc_cost
      FROM trip_stops ts
      JOIN cities c ON ts.city_id = c.id
      WHERE ts.trip_id = ?
    `).all(tripId);

    const cityBreakdown = stops.map((s: any) => ({
      city_name: s.city_name,
      estimated_cost: (s.activities_cost || 0) + (s.acc_cost || 0)
    }));

    const startDate = new Date(trip.start_date);
    const endDate = new Date(trip.end_date);
    const daysCount = Math.max(1, Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const dailyAverage = totalEstimatedCost / daysCount;

    const alerts: string[] = [];

    if (totalEstimatedCost > trip.estimated_budget && trip.estimated_budget > 0) {
      const diff = totalEstimatedCost - trip.estimated_budget;
      alerts.push(`⚠️ Your total estimated trip cost exceeds your planned budget by ${trip.currency} ${diff.toLocaleString()}`);
    }

    const dailyActivities: any[] = await db.prepare(`
      SELECT day_number, SUM(cost) as day_cost
      FROM trip_activities
      WHERE trip_id = ?
      GROUP BY day_number
    `).all(tripId);

    dailyActivities.forEach((da) => {
      if (da.day_cost > dailyAverage * 1.3) {
        const pct = Math.round(((da.day_cost - dailyAverage) / dailyAverage) * 100);
        alerts.push(`⚠️ Your Day ${da.day_number} planned budget is ${pct}% higher than your daily average.`);
      }
    });

    if (accTotal && accTotal.total > totalEstimatedCost * 0.45 && totalEstimatedCost > 0) {
      alerts.push(`💡 Accommodation accounts for >45% of your trip. Consider heritage homestays or boutique stays to save approx ${trip.currency} 1,500.`);
    }

    if (alerts.length === 0) {
      alerts.push('✅ Your trip budget is well balanced and within your planned target!');
    }

    return res.json({
      planned_budget: trip.estimated_budget,
      total_estimated_cost: totalEstimatedCost,
      actual_spent_total: actualSpentTotal,
      remaining_budget: trip.estimated_budget - (actualSpentTotal > 0 ? actualSpentTotal : totalEstimatedCost),
      daily_average: Math.round(dailyAverage),
      currency: trip.currency,
      days_count: daysCount,
      category_breakdown: categoryBreakdown,
      city_breakdown: cityBreakdown,
      actual_expenses: actualExpenses,
      alerts
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/trips/:id/expenses
router.post('/trips/:id/expenses', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const tripId = req.params.id;
    const userId = req.user!.id;
    const { category, amount, date, description, paid_by_name, payment_method } = req.body;

    if (!category || !amount || !date) {
      return res.status(400).json({ error: 'Category, amount, and date are required' });
    }

    const expId = `exp_${Date.now()}`;
    await db.prepare(`
      INSERT INTO expenses (id, trip_id, user_id, category, amount, date, description, paid_by_name, payment_method)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(expId, tripId, userId, category, amount, date, description || '', paid_by_name || req.user!.email, payment_method || 'Card');

    const newExp = await db.prepare('SELECT * FROM expenses WHERE id = ?').get(expId);
    return res.status(201).json(newExp);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/expenses/:id
router.delete('/expenses/:id', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    const expId = req.params.id;
    await db.prepare('DELETE FROM expenses WHERE id = ?').run(expId);
    return res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
