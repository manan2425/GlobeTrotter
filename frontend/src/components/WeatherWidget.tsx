'use client';

import React, { useEffect, useState } from 'react';
import { Sun, AlertTriangle, Calendar, Info, Thermometer, CloudRain, Droplets } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';

interface WeatherData {
  available: boolean;
  reason: string | null;
  days_until_start?: number;
  start_date?: string;
  forecast: Array<{
    stop_id: string;
    city_name: string;
    arrival_date?: string;
    departure_date?: string;
    temperature_celsius: number;
    temp_max: number;
    temp_min: number;
    condition: string;
    rain_probability_pct: number;
    humidity_pct: number;
    weather_icon: string;
    warning_alert: string | null;
  }>;
}

export default function WeatherWidget({ tripId }: { tripId: string }) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tripId) {
      fetchWeather();
    }
  }, [tripId]);

  const fetchWeather = async () => {
    try {
      const data = await apiRequest<any>(`/trips/${tripId}/weather`);
      // Handle array format fallback or object format
      if (Array.isArray(data)) {
        setWeatherData({
          available: true,
          reason: null,
          forecast: data
        });
      } else {
        setWeatherData(data);
      }
    } catch (err) {
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-slate-50/80 backdrop-blur-md rounded-2xl border border-slate-200/80 text-xs text-slate-500 animate-pulse flex items-center justify-center gap-2">
        <Sun className="w-4 h-4 text-sky-500 animate-spin" />
        <span>Fetching live destination weather via Open-Meteo...</span>
      </div>
    );
  }

  if (!weatherData) return null;

  // Case 1: Forecast not available because trip is more than 5 days out
  if (!weatherData.available) {
    return (
      <Card className="bg-gradient-to-r from-sky-50/70 via-blue-50/50 to-indigo-50/70 border border-sky-100 shadow-sm overflow-hidden">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0 border border-sky-200/50">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900">Destination Weather Outlook</span>
                <Badge variant="outline" className="text-[10px] bg-white/80 text-sky-700 border-sky-200">
                  Open-Meteo Live API
                </Badge>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Weather forecasts unlock <span className="font-bold text-sky-700">5 days before departure</span> or when your trip is ongoing.
                {weatherData.start_date && (
                  <span> Forecast activates on <strong className="text-slate-800">{weatherData.start_date}</strong>.</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-slate-200/80 text-[11px] font-bold text-slate-700 shadow-2xs self-end sm:self-center">
            <Info className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <span>Forecast Window Locked</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const forecast = weatherData.forecast || [];
  if (forecast.length === 0) return null;

  // Case 2: Weather is available! Render live forecast cards for each stop
  return (
    <Card className="bg-white border-slate-200/90 shadow-md overflow-hidden">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 bg-slate-50/50 border-b border-slate-100">
        <CardTitle className="text-sm font-extrabold flex items-center gap-2 text-slate-900">
          <Sun className="w-4.5 h-4.5 text-amber-500 animate-pulse" /> Live Multi-City Weather Forecast
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-sky-500 hover:bg-sky-600 text-white text-[10px] font-bold">
            Live Open-Meteo
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {forecast.map((fc) => (
            <div
              key={fc.stop_id}
              className={`p-4 rounded-2xl border transition-all duration-200 hover:shadow-md ${
                fc.warning_alert
                  ? 'bg-amber-50/80 border-amber-300/80 shadow-amber-500/5'
                  : 'bg-gradient-to-br from-slate-50 to-sky-50/30 border-slate-200/90'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">{fc.city_name}</span>
                <span className="text-2xl hover:scale-110 transition-transform">{fc.weather_icon}</span>
              </div>

              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-1 text-slate-900 font-black text-2xl tracking-tight">
                  <span>{fc.temperature_celsius}°C</span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/90 border border-slate-200 text-slate-700 shadow-2xs">
                  {fc.condition}
                </span>
              </div>

              <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-200/50 grid grid-cols-2 gap-1 font-medium">
                <div className="flex items-center gap-1">
                  <CloudRain className="w-3 h-3 text-sky-500" />
                  <span>Rain: {fc.rain_probability_pct}%</span>
                </div>
                <div className="flex items-center gap-1 justify-end">
                  <Droplets className="w-3 h-3 text-blue-500" />
                  <span>Hum: {fc.humidity_pct}%</span>
                </div>
              </div>

              {fc.warning_alert && (
                <div className="mt-2.5 text-[11px] text-amber-900 font-semibold bg-amber-100/90 p-2.5 rounded-xl border border-amber-300 flex items-start gap-2 shadow-2xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <span className="leading-snug">{fc.warning_alert}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

