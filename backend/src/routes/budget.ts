import { Router, Response } from 'express';
import { db } from '../db/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/trips/:id/budget
router.get('/trips/:id/budget', (req, res) => {
  const tripId = req.params.id;

  const trip: any = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  // Activities cost sum & per category breakdown
  const actStats: any[] = db.prepare(`
    SELECT category, SUM(cost) as total_cost, COUNT(*) as count
    FROM trip_activities
    WHERE trip_id = ?
    GROUP BY category
  `).all(tripId);

  // Accommodations cost sum
  const accTotal: any = db.prepare('SELECT SUM(total_cost) as total FROM accommodations WHERE trip_id = ?').get(tripId);

  // Transportation cost sum
  const transTotal: any = db.prepare('SELECT SUM(cost) as total FROM transportation WHERE trip_id = ?').get(tripId);

  // Actual Expenses logged
  const actualExpenses: any[] = db.prepare('SELECT * FROM expenses WHERE trip_id = ? ORDER BY date DESC').all(tripId);
  const actualSpentTotal = actualExpenses.reduce((acc, exp) => acc + (exp.amount || 0), 0);

  // Category breakdown object
  const categoryBreakdown: Record<string, number> = {
    Transportation: transTotal.total || 0,
    Accommodation: accTotal.total || 0,
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

  // Also include logged expense category amounts
  actualExpenses.forEach((exp) => {
    if (categoryBreakdown[exp.category] !== undefined) {
      // Keep track
    }
  });

  const totalEstimatedCost = Object.values(categoryBreakdown).reduce((a, b) => a + b, 0);

  // City breakdown
  const stops = db.prepare(`
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

  // Calculate days
  const startDate = new Date(trip.start_date);
  const endDate = new Date(trip.end_date);
  const daysCount = Math.max(1, Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const dailyAverage = totalEstimatedCost / daysCount;

  // Generate Smart Budget Alerts
  const alerts: string[] = [];

  if (totalEstimatedCost > trip.estimated_budget && trip.estimated_budget > 0) {
    const diff = totalEstimatedCost - trip.estimated_budget;
    alerts.push(`⚠️ Your total estimated trip cost exceeds your planned budget by ${trip.currency} ${diff.toLocaleString()}`);
  }

  // Daily budget spike alert
  const dailyActivities: any[] = db.prepare(`
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

  if (accTotal.total > totalEstimatedCost * 0.45 && totalEstimatedCost > 0) {
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
});

// POST /api/trips/:id/expenses
router.post('/trips/:id/expenses', authenticateToken, (req: AuthRequest, res: Response) => {
  const tripId = req.params.id;
  const userId = req.user!.id;
  const { category, amount, date, description, paid_by_name, payment_method } = req.body;

  if (!category || !amount || !date) {
    return res.status(400).json({ error: 'Category, amount, and date are required' });
  }

  const expId = `exp_${Date.now()}`;
  db.prepare(`
    INSERT INTO expenses (id, trip_id, user_id, category, amount, date, description, paid_by_name, payment_method)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(expId, tripId, userId, category, amount, date, description || '', paid_by_name || req.user!.email, payment_method || 'Card');

  const newExp = db.prepare('SELECT * FROM expenses WHERE id = ?').get(expId);
  return res.status(201).json(newExp);
});

// DELETE /api/expenses/:id
router.delete('/expenses/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const expId = req.params.id;
  db.prepare('DELETE FROM expenses WHERE id = ?').run(expId);
  return res.json({ message: 'Expense deleted successfully' });
});

export default router;
