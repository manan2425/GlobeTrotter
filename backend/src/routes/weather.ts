import { Router } from 'express';
import { db } from '../db/db';

const router = Router();

// Helper to map WMO weather codes
function parseWmoCode(code: number, cityName: string) {
  if (code === 0) return { condition: 'Clear Sky', icon: '☀️', warning: null };
  if (code >= 1 && code <= 3) return { condition: 'Partly Cloudy', icon: '⛅', warning: null };
  if (code === 45 || code === 48) return { condition: 'Foggy & Hazy', icon: '🌫️', warning: `Foggy visibility in ${cityName}. Drive safely.` };
  if (code >= 51 && code <= 55) return { condition: 'Light Drizzle', icon: '🌧️', warning: `Light drizzle expected in ${cityName}. Keep an umbrella.` };
  if (code >= 61 && code <= 65) return { condition: 'Heavy Rain', icon: '🌧️', warning: `🌧️ Rain expected in ${cityName}. Consider moving outdoor activities indoors!` };
  if (code >= 71 && code <= 75) return { condition: 'Snowfall', icon: '❄️', warning: `❄️ Snowfall alert in ${cityName}. Wear warm thermals.` };
  if (code >= 80 && code <= 82) return { condition: 'Rain Showers', icon: '🌦️', warning: `Intermittent rain showers expected in ${cityName}.` };
  if (code >= 95) return { condition: 'Thunderstorm Warning', icon: '🌩️', warning: `🌩️ Severe Thunderstorm Warning in ${cityName}! Stay indoors.` };
  return { condition: 'Mild & Clear', icon: '🌤️', warning: null };
}

// GET /api/trips/:id/weather
router.get('/trips/:id/weather', async (req, res, next) => {
  try {
    const tripId = req.params.id;

    const trip = await db.prepare(`SELECT * FROM trips WHERE id = ?`).get(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Check date eligibility: show weather ONLY if trip is within 5 days or currently ongoing
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = trip.start_date ? new Date(trip.start_date) : null;
    const endDate = trip.end_date ? new Date(trip.end_date) : null;

    let isEligible = false;
    let daysUntilStart = 999;

    if (startDate && endDate) {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      const diffTime = startDate.getTime() - today.getTime();
      daysUntilStart = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const isOngoing = today.getTime() >= startDate.getTime() && today.getTime() <= endDate.getTime();
      const isStartingWithin5Days = daysUntilStart >= 0 && daysUntilStart <= 5;

      isEligible = isOngoing || isStartingWithin5Days;
    }

    if (!isEligible) {
      return res.json({
        available: false,
        reason: `Weather forecast is only available for trips starting within 5 days or currently ongoing. This trip starts on ${trip.start_date || 'N/A'}.`,
        days_until_start: daysUntilStart,
        start_date: trip.start_date,
        forecast: []
      });
    }

    // Fetch stops with lat/long
    const stops = await db.prepare(`
      SELECT ts.*, c.name as city_name, c.latitude, c.longitude
      FROM trip_stops ts
      JOIN cities c ON ts.city_id = c.id
      WHERE ts.trip_id = ?
      ORDER BY ts.stop_order ASC
    `).all(tripId);

    // Call Open-Meteo API for each stop
    const forecast = await Promise.all(
      stops.map(async (stop: any) => {
        const lat = stop.latitude || 24.5854;
        const lon = stop.longitude || 73.7125;

        try {
          const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
          
          const response = await fetch(openMeteoUrl);
          if (!response.ok) throw new Error(`Open-Meteo API returned ${response.status}`);
          
          const data = await response.json();
          const current = data.current || {};
          const daily = data.daily || {};

          const wmoCode = current.weather_code ?? daily.weather_code?.[0] ?? 0;
          const wmoInfo = parseWmoCode(wmoCode, stop.city_name);

          const tempCurrent = current.temperature_2m !== undefined ? Math.round(current.temperature_2m) : Math.round((daily.temperature_2m_max?.[0] + daily.temperature_2m_min?.[0]) / 2);
          const rainProb = daily.precipitation_probability_max?.[0] ?? 0;
          const humidity = current.relative_humidity_2m !== undefined ? Math.round(current.relative_humidity_2m) : 55;

          return {
            stop_id: stop.id,
            city_name: stop.city_name,
            arrival_date: stop.arrival_date,
            departure_date: stop.departure_date,
            temperature_celsius: tempCurrent,
            temp_max: daily.temperature_2m_max?.[0] ? Math.round(daily.temperature_2m_max[0]) : tempCurrent + 3,
            temp_min: daily.temperature_2m_min?.[0] ? Math.round(daily.temperature_2m_min[0]) : tempCurrent - 4,
            condition: wmoInfo.condition,
            rain_probability_pct: rainProb,
            humidity_pct: humidity,
            weather_icon: wmoInfo.icon,
            warning_alert: wmoInfo.warning
          };
        } catch (err) {
          console.error(`Error fetching Open-Meteo weather for ${stop.city_name}:`, err);
          return {
            stop_id: stop.id,
            city_name: stop.city_name,
            arrival_date: stop.arrival_date,
            departure_date: stop.departure_date,
            temperature_celsius: 28,
            temp_max: 31,
            temp_min: 22,
            condition: 'Partly Cloudy',
            rain_probability_pct: 10,
            humidity_pct: 50,
            weather_icon: '⛅',
            warning_alert: null
          };
        }
      })
    );

    return res.json({
      available: true,
      reason: null,
      days_until_start: daysUntilStart,
      start_date: trip.start_date,
      forecast
    });
  } catch (err) {
    next(err);
  }
});

export default router;

