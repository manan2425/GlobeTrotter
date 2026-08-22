'use client';

import React, { useState } from 'react';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, MapPin,
  Clock, DollarSign, Building2, CheckCircle2, Circle, Plus, Sparkles, X, ArrowRight
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface TripCalendarViewProps {
  trip: any;
  onSelectStop: (stopId: string) => void;
  onSwitchToTimeline: (stopId?: string) => void;
  onAddActivity: (stop: any) => void;
  onToggleActivityCompletion: (activityId: string, currentStatus: boolean) => void;
}

export default function TripCalendarView({
  trip,
  onSelectStop,
  onSwitchToTimeline,
  onAddActivity,
  onToggleActivityCompletion
}: TripCalendarViewProps) {
  // Determine initial calendar month based on trip start date or first stop arrival date or today
  const getInitialDate = () => {
    if (trip?.start_date) {
      const d = new Date(trip.start_date);
      if (!isNaN(d.getTime())) return d;
    }
    if (trip?.stops && trip.stops.length > 0 && trip.stops[0].arrival_date) {
      const d = new Date(trip.stops[0].arrival_date);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  };

  const [currentDate, setCurrentDate] = useState<Date>(getInitialDate);
  const [selectedDayDetail, setSelectedDayDetail] = useState<any | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleResetToTripMonth = () => {
    setCurrentDate(getInitialDate());
  };

  // Helper to format date as YYYY-MM-DD using local time
  const formatDateStr = (y: number, m: number, d: number) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  // Build calendar matrix
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Create grid cells (42 cells = 6 rows of 7)
  const calendarCells: Array<{
    dayNumber: number;
    monthOffset: -1 | 0 | 1; // -1 prev month, 0 current, 1 next month
    dateStr: string;
  }> = [];

  // Previous month trailing days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const pDay = daysInPrevMonth - i;
    const pMonth = month === 0 ? 11 : month - 1;
    const pYear = month === 0 ? year - 1 : year;
    calendarCells.push({
      dayNumber: pDay,
      monthOffset: -1,
      dateStr: formatDateStr(pYear, pMonth, pDay)
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({
      dayNumber: d,
      monthOffset: 0,
      dateStr: formatDateStr(year, month, d)
    });
  }

  // Next month leading days to fill up grid to multiples of 7 (up to 35 or 42)
  const remainingCells = (7 - (calendarCells.length % 7)) % 7;
  for (let n = 1; n <= remainingCells; n++) {
    const nMonth = month === 11 ? 0 : month + 1;
    const nYear = month === 11 ? year + 1 : year;
    calendarCells.push({
      dayNumber: n,
      monthOffset: 1,
      dateStr: formatDateStr(nYear, nMonth, n)
    });
  }

  // Map dates to trip stops & activities
  const getDayData = (dateStr: string) => {
    if (!trip?.stops) return { stop: null, activities: [], hotel: null, dayIndex: -1 };

    // Find stop that matches arrival_date or index
    let stopIndex = trip.stops.findIndex((s: any) => s.arrival_date === dateStr);
    
    // If no direct arrival_date match, check if fallback calculation matches
    if (stopIndex === -1 && trip.start_date) {
      const startDateObj = new Date(trip.start_date);
      const cellDateObj = new Date(dateStr);
      const diffTime = cellDateObj.getTime() - startDateObj.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < trip.stops.length) {
        stopIndex = diffDays;
      }
    }

    if (stopIndex === -1) return { stop: null, activities: [], hotel: null, dayIndex: -1 };

    const stop = trip.stops[stopIndex];
    const activities = trip.activities?.filter((a: any) => a.trip_stop_id === stop.id) || [];
    const hotel = trip.accommodations?.find((h: any) => h.trip_stop_id === stop.id) || null;

    return {
      stop,
      activities,
      hotel,
      dayIndex: stopIndex + 1
    };
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-md space-y-6">
      
      {/* Calendar Top Control Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-sky-500" />
              <span>{monthNames[month]} {year}</span>
            </h2>
            <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 font-extrabold text-xs">
              Interactive Calendar
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Click on any trip day to inspect scheduled activities, add items, or open the day timeline.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          <Button
            onClick={handleResetToTripMonth}
            variant="outline"
            size="sm"
            className="text-xs font-bold text-slate-700 bg-slate-50 border-slate-200 hover:bg-slate-100"
          >
            Trip Month
          </Button>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition shadow-2xs"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition shadow-2xs"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
        <span className="font-extrabold uppercase tracking-wider text-[10px] text-slate-400">Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-sky-500/20 border border-sky-500" />
          <span>Trip Destination Day</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-emerald-500/20 border border-emerald-500" />
          <span>Scheduled Activity</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-amber-500/20 border border-amber-500" />
          <span>Hotel Stay</span>
        </div>
      </div>

      {/* Days of Week Header Grid */}
      <div className="grid grid-cols-7 gap-1 text-center font-extrabold text-xs text-slate-500 uppercase tracking-wider py-1 border-b border-slate-100">
        {daysOfWeek.map((day, idx) => (
          <div key={idx} className={idx === 0 || idx === 6 ? 'text-indigo-500/80' : 'text-slate-600'}>
            {day}
          </div>
        ))}
      </div>

      {/* 7-Column Monthly Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {calendarCells.map((cell, idx) => {
          const { dayNumber, monthOffset, dateStr } = cell;
          const isCurrentMonth = monthOffset === 0;
          const isToday = dateStr === todayStr;
          const { stop, activities, hotel, dayIndex } = getDayData(dateStr);
          const hasTripData = !!stop;
          const totalCost = activities.reduce((sum: number, act: any) => sum + (Number(act.cost) || 0), 0);

          return (
            <div
              key={idx}
              onClick={() => {
                if (hasTripData) {
                  onSelectStop(stop.id);
                  setSelectedDayDetail({ stop, activities, hotel, dayIndex, dateStr });
                }
              }}
              className={`min-h-[110px] sm:min-h-[135px] p-2 rounded-2xl border transition-all duration-200 flex flex-col justify-between relative group ${
                !isCurrentMonth
                  ? 'bg-slate-50/40 border-slate-100 text-slate-300 opacity-60'
                  : hasTripData
                  ? 'bg-gradient-to-br from-sky-50/90 via-sky-50/40 to-blue-50/30 border-sky-300/90 hover:border-sky-500 hover:shadow-md cursor-pointer ring-1 ring-sky-400/20'
                  : 'bg-white border-slate-200/80 text-slate-700 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              {/* Top Row: Date Number & Badges */}
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`text-xs font-black px-1.5 py-0.5 rounded-full ${
                    isToday
                      ? 'bg-sky-500 text-white shadow-xs'
                      : isCurrentMonth
                      ? 'text-slate-800'
                      : 'text-slate-400'
                  }`}
                >
                  {dayNumber}
                </span>

                {hasTripData && (
                  <Badge variant="default" className="bg-sky-600 text-white text-[9px] font-black px-1.5 py-0 rounded-full shrink-0">
                    Day {dayIndex}
                  </Badge>
                )}
              </div>

              {/* Middle Section: Stop City & Activities */}
              {hasTripData ? (
                <div className="my-1 space-y-1 overflow-hidden flex-1">
                  {/* City Name */}
                  <div className="font-extrabold text-xs text-sky-950 flex items-center gap-1 truncate group-hover:text-sky-600 transition">
                    <MapPin className="w-3 h-3 text-sky-500 shrink-0" />
                    <span className="truncate">{stop.city_name}</span>
                  </div>

                  {/* Hotel Stay */}
                  {hotel && (
                    <div className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/80 truncate flex items-center gap-1">
                      <Building2 className="w-2.5 h-2.5 shrink-0 text-amber-600" />
                      <span className="truncate">{hotel.name}</span>
                    </div>
                  )}

                  {/* Activity Pills */}
                  <div className="space-y-0.5 mt-1">
                    {activities.slice(0, 2).map((act: any) => (
                      <div
                        key={act.id}
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md truncate border flex items-center justify-between gap-1 ${
                          act.is_completed
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 line-through'
                            : 'bg-white/90 text-slate-800 border-slate-200/90 shadow-2xs'
                        }`}
                      >
                        <span className="truncate">{act.custom_title || act.original_name}</span>
                        {act.time_slot && (
                          <span className="text-[9px] text-slate-400 shrink-0">{act.time_slot}</span>
                        )}
                      </div>
                    ))}
                    {activities.length > 2 && (
                      <div className="text-[9px] font-bold text-sky-600 bg-sky-100/60 px-1.5 py-0.2 rounded-md text-center">
                        +{activities.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <span className="text-[10px] font-semibold text-slate-400">Off-trip</span>
                </div>
              )}

              {/* Bottom Row: Cost Summary */}
              {hasTripData && (
                <div className="pt-1 border-t border-sky-200/60 flex items-center justify-between text-[10px] font-extrabold text-slate-600 mt-auto">
                  <span className="text-emerald-700">₹{totalCost.toLocaleString()}</span>
                  <span className="text-[9px] text-sky-600 group-hover:underline flex items-center gap-0.5">
                    View <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Day Quick Inspector Drawer / Modal */}
      {selectedDayDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-white/20 backdrop-blur-md text-white text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Day {selectedDayDetail.dayIndex}
                  </span>
                  <span className="text-xs text-sky-100 font-bold">{selectedDayDetail.dateStr}</span>
                </div>
                <h3 className="text-xl font-black mt-1 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-amber-300 shrink-0" />
                  <span>{selectedDayDetail.stop?.city_name}</span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedDayDetail(null)}
                className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              
              {/* Hotel accommodation */}
              {selectedDayDetail.hotel && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900">{selectedDayDetail.hotel.name}</div>
                      <div className="text-[10px] text-amber-700 font-medium">Booked Hotel Accommodation</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Scheduled Activities */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                    <span>Scheduled Activities ({selectedDayDetail.activities.length})</span>
                  </h4>
                  <Button
                    onClick={() => {
                      const s = selectedDayDetail.stop;
                      setSelectedDayDetail(null);
                      onAddActivity(s);
                    }}
                    variant="outline"
                    size="sm"
                    className="text-xs font-bold text-sky-700 bg-sky-50 border-sky-200 hover:bg-sky-100 gap-1 h-7 px-2.5"
                  >
                    <Plus className="w-3 h-3" /> Add Activity
                  </Button>
                </div>

                {selectedDayDetail.activities.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500 space-y-2">
                    <p>No activities scheduled for this day yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedDayDetail.activities.map((act: any) => (
                      <div
                        key={act.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs transition ${
                          act.is_completed
                            ? 'bg-slate-50 border-slate-200 text-slate-400'
                            : 'bg-slate-50/80 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            onClick={() => onToggleActivityCompletion(act.id, !!act.is_completed)}
                            className="hover:scale-110 transition shrink-0"
                          >
                            {act.is_completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-400 hover:text-sky-500" />
                            )}
                          </button>
                          <div className="min-w-0">
                            <div className={`font-bold truncate ${act.is_completed ? 'line-through' : ''}`}>
                              {act.custom_title || act.original_name}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-2 font-medium mt-0.5">
                              {act.time_slot && (
                                <span className="flex items-center gap-1 text-sky-600">
                                  <Clock className="w-3 h-3" /> {act.time_slot}
                                </span>
                              )}
                              <span>{act.category || 'Sightseeing'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="font-extrabold text-emerald-600 shrink-0 text-right">
                          ₹{Number(act.cost || 0).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <div className="text-xs font-extrabold text-slate-700">
                Day Total: <span className="text-emerald-600">₹{selectedDayDetail.activities.reduce((s: number, a: any) => s + (Number(a.cost) || 0), 0).toLocaleString()}</span>
              </div>
              <Button
                onClick={() => {
                  const stopId = selectedDayDetail.stop?.id;
                  setSelectedDayDetail(null);
                  onSwitchToTimeline(stopId);
                }}
                variant="default"
                size="sm"
                className="gap-1.5 font-bold text-xs bg-sky-500 hover:bg-sky-600 text-white rounded-xl shadow-sm"
              >
                <span>Open in Day Timeline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
