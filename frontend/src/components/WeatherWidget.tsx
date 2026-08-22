'use client';

import React, { useEffect, useState } from 'react';
import { CloudRain, Sun, Cloud, AlertTriangle, Thermometer } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';

export default function WeatherWidget({ tripId }: { tripId: string }) {
  const [forecast, setForecast] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tripId) {
      fetchWeather();
    }
  }, [tripId]);

  const fetchWeather = async () => {
    try {
      const data = await apiRequest<any[]>(`/trips/${tripId}/weather`);
      setForecast(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 text-xs text-slate-500 animate-pulse">Loading destination weather forecast...</div>;
  }

  if (forecast.length === 0) return null;

  return (
    <Card className="bg-white border-slate-200 shadow-md">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
          <Sun className="w-4 h-4 text-amber-500" /> Destination Weather Forecast
        </CardTitle>
        <Badge variant="secondary">Real-time Weather</Badge>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {forecast.map((fc) => (
            <div
              key={fc.stop_id}
              className={`p-3.5 rounded-2xl border transition ${
                fc.warning_alert ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-slate-900">{fc.city_name}</span>
                <span className="text-xl">{fc.weather_icon}</span>
              </div>

              <div className="flex items-baseline gap-1 text-slate-900 font-extrabold text-lg">
                <span>{fc.temperature_celsius}°C</span>
                <span className="text-[10px] text-slate-500 font-medium">{fc.condition}</span>
              </div>

              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                <span>Rain: {fc.rain_probability_pct}%</span>
                <span>•</span>
                <span>Humidity: {fc.humidity_pct}%</span>
              </div>

              {fc.warning_alert && (
                <div className="mt-2 text-[11px] text-amber-800 font-semibold bg-amber-100 p-2 rounded-xl border border-amber-200 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                  <span>{fc.warning_alert}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
