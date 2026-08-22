import { Router } from 'express';
import { db } from '../db/db';

const router = Router();

// GET /api/trips/:id/weather
router.get('/trips/:id/weather', (req, res) => {
  const tripId = req.params.id;

  const stops = db.prepare(`
    SELECT ts.*, c.name as city_name
    FROM trip_stops ts
    JOIN cities c ON ts.city_id = c.id
    WHERE ts.trip_id = ?
    ORDER BY ts.stop_order ASC
  `).all(tripId);

  // Generate realistic weather forecast for each stop
  const forecast = stops.map((stop: any, index: number) => {
    const isRainy = index === 1; // e.g. Day 2 / Udaipur has rain warning demo
    return {
      stop_id: stop.id,
      city_name: stop.city_name,
      arrival_date: stop.arrival_date,
      departure_date: stop.departure_date,
      temperature_celsius: isRainy ? 26 : (28 + index),
      condition: isRainy ? 'Thunderstorm / Light Rain' : (index % 2 === 0 ? 'Sunny & Clear' : 'Partly Cloudy'),
      rain_probability_pct: isRainy ? 85 : 10,
      humidity_pct: isRainy ? 78 : 45,
      weather_icon: isRainy ? '🌧️' : (index % 2 === 0 ? '☀️' : '⛅'),
      warning_alert: isRainy ? '🌧️ Rain expected tomorrow in Udaipur. Consider moving outdoor activities to Day 3!' : null
    };
  });

  return res.json(forecast);
});

export default router;
