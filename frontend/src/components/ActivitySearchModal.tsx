'use client';

import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Star, Clock, DollarSign, Plus, Check, Trash2,
  X, Info, MapPin, Sparkles, Compass, Tag, ChevronRight, SlidersHorizontal
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import toast from 'react-hot-toast';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

interface ActivitySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId?: string;
  stopId?: string;
  cityName?: string;
  cityId?: string;
  allStops?: any[];
  existingTripActivities?: any[];
  onActivityAdded?: () => void;
}

const CATEGORIES = [
  'All',
  'Sightseeing',
  'Food & Dining',
  'Adventure',
  'Culture & Heritage',
  'Nature & Outdoors',
  'Shopping'
];

const COST_RANGES = [
  { label: 'All Prices', max: null },
  { label: 'Free', max: 0 },
  { label: '< ₹1,000', max: 1000 },
  { label: '< ₹2,500', max: 2500 },
  { label: '< ₹5,000', max: 5000 },
];

const DURATION_OPTIONS = [
  { label: 'Any Duration', max: null },
  { label: '< 1 hour', max: 60 },
  { label: '1 - 3 hours', max: 180 },
  { label: '3+ hours', max: 9999 }
];

export default function ActivitySearchModal({
  isOpen,
  onClose,
  tripId,
  stopId,
  cityName,
  cityId,
  allStops = [],
  existingTripActivities = [],
  onActivityAdded
}: ActivitySearchModalProps) {
  const [activities, setActivities] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Active filters
  const [selectedCityId, setSelectedCityId] = useState<string>(cityId || '');
  const [selectedStopId, setSelectedStopId] = useState<string>(stopId || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [maxCost, setMaxCost] = useState<number | null>(null);
  const [maxDuration, setMaxDuration] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'rating' | 'cost_asc' | 'cost_desc' | 'duration'>('rating');

  // Quick View Modal
  const [quickViewActivity, setQuickViewActivity] = useState<any | null>(null);

  // Custom Activity Mode toggle
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState('Sightseeing');
  const [customTimeSlot, setCustomTimeSlot] = useState('10:00');
  const [customCost, setCustomCost] = useState('0');
  const [customDuration, setCustomDuration] = useState('90');

  useEffect(() => {
    if (isOpen) {
      fetchCities();
      if (cityId) setSelectedCityId(cityId);
      if (stopId) setSelectedStopId(stopId);
    }
  }, [isOpen, cityId, stopId]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        fetchActivities();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen, selectedCityId, searchQuery, selectedCategory, maxCost, maxDuration, sortBy]);

  const fetchCities = async () => {
    try {
      const data = await apiRequest<any[]>('/destinations');
      setCities(data);
    } catch (err) {
      console.error('Failed to load cities:', err);
    }
  };

  const fetchActivities = async () => {
    setLoading(true);
    try {
      let queryParams = new URLSearchParams();
      if (selectedCityId) queryParams.append('city_id', selectedCityId);
      if (selectedCategory && selectedCategory !== 'All') {
        const catMap: Record<string, string> = {
          'Food & Dining': 'Food',
          'Culture & Heritage': 'Culture',
          'Nature & Outdoors': 'Nature'
        };
        queryParams.append('category', catMap[selectedCategory] || selectedCategory);
      }
      if (searchQuery) queryParams.append('search', searchQuery);
      if (maxCost !== null) queryParams.append('max_cost', String(maxCost));
      if (maxDuration !== null) queryParams.append('max_duration', String(maxDuration));
      if (sortBy) queryParams.append('sort_by', sortBy);

      const data = await apiRequest<any[]>(`/activities?${queryParams.toString()}`);
      setActivities(data);
    } finally {
      setLoading(false);
    }
  };

  const isActivityAdded = (activityId: string) => {
    return existingTripActivities.some((ta: any) => ta.activity_id === activityId);
  };

  const getAddedTactId = (activityId: string) => {
    const found = existingTripActivities.find((ta: any) => ta.activity_id === activityId);
    return found ? found.id : null;
  };

  const handleAddActivityToTrip = async (act: any) => {
    if (!tripId) {
      toast.error('No active trip selected');
      return;
    }

    const targetStopId = selectedStopId || (allStops.length > 0 ? allStops[0].id : null);
    if (!targetStopId) {
      toast.error('Please select a city stop for this activity');
      return;
    }

    try {
      await apiRequest(`/trips/${tripId}/activities`, {
        method: 'POST',
        body: JSON.stringify({
          trip_stop_id: targetStopId,
          activity_id: act.id,
          day_number: 1,
          custom_title: act.name,
          category: act.category,
          time_slot: '10:00',
          cost: act.estimated_cost,
          duration_minutes: act.duration_minutes
        })
      });

      toast.success(`Added "${act.name}" to itinerary! 🎉`);
      if (onActivityAdded) onActivityAdded();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add activity');
    }
  };

  const handleRemoveActivityFromTrip = async (actId: string) => {
    const tactId = getAddedTactId(actId);
    if (!tactId) return;

    try {
      await apiRequest(`/trip-activities/${tactId}`, { method: 'DELETE' });
      toast.success('Removed activity from trip');
      if (onActivityAdded) onActivityAdded();
    } catch (err: any) {
      toast.error('Failed to remove activity');
    }
  };

  const handleAddCustomActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripId || !selectedStopId) {
      toast.error('Please select a stop to add custom activity');
      return;
    }

    try {
      await apiRequest(`/trips/${tripId}/activities`, {
        method: 'POST',
        body: JSON.stringify({
          trip_stop_id: selectedStopId,
          day_number: 1,
          custom_title: customTitle,
          category: customCategory,
          time_slot: customTimeSlot,
          cost: Number(customCost) || 0,
          duration_minutes: Number(customDuration) || 90
        })
      });

      toast.success(`Added custom activity "${customTitle}"!`);
      setShowCustomForm(false);
      setCustomTitle('');
      if (onActivityAdded) onActivityAdded();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add custom activity');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-3 sm:p-6 animate-fadeIn">
      <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-sky-500 text-white font-extrabold text-[10px] uppercase tracking-wider">
                Activity Search & Discovery
              </Badge>
              {cityName && (
                <span className="text-xs text-sky-200 font-bold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-sky-400" /> {cityName}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Things to Do & Experiences
            </h2>
            <p className="text-xs text-slate-300">
              Browse, filter by category or budget, quick view details, and add directly to your itinerary
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200/80 space-y-3 shrink-0">
          
          {/* Row 1: Search Input + Stop Selector + Sort */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search activities, food tours, sightseeing..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-sky-500"
              />
            </div>

            {/* Destination / Stop Picker */}
            {allStops.length > 0 ? (
              <div>
                <select
                  value={selectedStopId}
                  onChange={(e) => {
                    setSelectedStopId(e.target.value);
                    const targetStop = allStops.find(s => s.id === e.target.value);
                    if (targetStop) setSelectedCityId(targetStop.city_id);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-800 font-bold outline-none"
                >
                  <option value="">-- All Stops --</option>
                  {allStops.map((stop: any) => (
                    <option key={stop.id} value={stop.id}>
                      Target Stop: {stop.city_name} (Day #{stop.stop_order})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <select
                  value={selectedCityId}
                  onChange={(e) => setSelectedCityId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-800 font-bold outline-none"
                >
                  <option value="">All Destinations</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.country_name})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-800 font-medium outline-none"
              >
                <option value="rating">Sort: Highest Rated</option>
                <option value="cost_asc">Sort: Price (Low → High)</option>
                <option value="cost_desc">Sort: Price (High → Low)</option>
                <option value="duration">Sort: Quick Duration</option>
              </select>
            </div>
          </div>

          {/* Row 2: Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Row 3: Cost & Duration Quick Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 border-t border-slate-200/60">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-slate-500 flex items-center gap-1 text-[11px]">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Max Cost:
              </span>
              {COST_RANGES.map((cr) => (
                <button
                  key={cr.label}
                  onClick={() => setMaxCost(cr.max)}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition ${
                    maxCost === cr.max
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cr.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-slate-500 flex items-center gap-1 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-sky-600" /> Duration:
              </span>
              {DURATION_OPTIONS.map((d) => (
                <button
                  key={d.label}
                  onClick={() => setMaxDuration(d.max)}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition ${
                    maxDuration === d.max
                      ? 'bg-sky-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Activity Cards Grid */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-100/60">
          
          {/* Custom Activity Trigger Banner */}
          <div className="mb-5 bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-xs">Don't see your desired activity?</h4>
                <p className="text-[11px] text-slate-500">Add a custom activity or event directly to your itinerary</p>
              </div>
            </div>

            <Button
              onClick={() => setShowCustomForm(!showCustomForm)}
              variant="outline"
              size="sm"
              className="bg-white border-sky-300 text-sky-700 font-bold text-xs shrink-0 hover:bg-sky-100"
            >
              {showCustomForm ? 'Cancel Custom Form' : '+ Add Custom Activity'}
            </Button>
          </div>

          {/* Custom Activity Inline Form */}
          {showCustomForm && (
            <Card className="mb-6 p-5 bg-white border-sky-400 ring-2 ring-sky-400/20 rounded-2xl shadow-md space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-500" /> Create Custom Activity
              </h3>
              <form onSubmit={handleAddCustomActivity} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 font-medium block mb-1">Activity Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Traditional Cooking Workshop or Sunset Boat Cruise"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 font-medium block mb-1">Category</label>
                    <select
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 outline-none"
                    >
                      <option value="Sightseeing">Sightseeing</option>
                      <option value="Food">Food & Dining</option>
                      <option value="Adventure">Adventure</option>
                      <option value="Culture">Culture</option>
                      <option value="Nature">Nature</option>
                      <option value="Shopping">Shopping</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 font-medium block mb-1">Time Slot</label>
                    <input
                      type="time"
                      value={customTimeSlot}
                      onChange={(e) => setCustomTimeSlot(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 font-medium block mb-1">Cost (₹)</label>
                    <input
                      type="number"
                      value={customCost}
                      onChange={(e) => setCustomCost(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 font-medium block mb-1">Duration (min)</label>
                    <input
                      type="number"
                      value={customDuration}
                      onChange={(e) => setCustomDuration(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" onClick={() => setShowCustomForm(false)} variant="ghost" size="sm">
                    Cancel
                  </Button>
                  <Button type="submit" variant="default" size="sm" className="font-bold">
                    Save Activity
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Loading Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 bg-slate-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs">
              <Compass className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="font-black text-slate-700 text-base">No matching activities found</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Try clearing filters or search for another keyword like "Sightseeing", "Food", or "Temple".
              </p>
              <Button
                onClick={() => {
                  setSelectedCategory('All');
                  setMaxCost(null);
                  setMaxDuration(null);
                  setSearchQuery('');
                }}
                variant="outline"
                size="sm"
                className="font-bold text-xs"
              >
                Reset All Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {activities.map((act) => {
                const added = isActivityAdded(act.id);

                return (
                  <Card
                    key={act.id}
                    className="bg-white border-slate-200/90 rounded-2xl overflow-hidden hover:border-sky-400 transition duration-300 shadow-sm hover:shadow-md flex flex-col justify-between group"
                  >
                    {/* Top Image Preview & Badges */}
                    <div className="relative h-44 overflow-hidden bg-slate-100">
                      <img
                        src={act.image_url || 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80'}
                        alt={act.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

                      {/* Rating Badge */}
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-extrabold text-amber-600 flex items-center gap-1 border border-white/80 shadow-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {act.rating || 4.5}
                      </div>

                      {/* Category Pill */}
                      <div className="absolute top-3 right-3 bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-extrabold text-white uppercase tracking-wider border border-white/20">
                        {act.category}
                      </div>

                      {/* Title & City on overlay */}
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <h3 className="font-extrabold text-base leading-snug drop-shadow-sm">{act.name}</h3>
                        <div className="text-[11px] text-sky-200 font-bold flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-sky-400" /> {act.city_name || cityName || 'Destination'}
                        </div>
                      </div>
                    </div>

                    {/* Content & Metadata */}
                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {act.description || `Explore ${act.name} featuring local culture, heritage sights, and memorable experiences.`}
                      </p>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 font-semibold text-slate-600">
                        <span className="flex items-center gap-1 text-sky-600 font-bold">
                          <Clock className="w-3.5 h-3.5" /> {act.duration_minutes || 90} mins
                        </span>
                        <span className="font-extrabold text-emerald-600 text-sm">
                          {act.estimated_cost === 0 ? 'Free' : `₹${act.estimated_cost?.toLocaleString()}`}
                        </span>
                      </div>

                      {/* Action Controls: Quick View + Add/Remove */}
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          onClick={() => setQuickViewActivity(act)}
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1 text-xs font-bold text-slate-700 bg-slate-50 border-slate-200 hover:bg-slate-100"
                        >
                          <Info className="w-3.5 h-3.5 text-sky-500" /> Quick View
                        </Button>

                        {tripId && (
                          added ? (
                            <Button
                              onClick={() => handleRemoveActivityFromTrip(act.id)}
                              variant="destructive"
                              size="sm"
                              className="gap-1 text-xs font-bold"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remove
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleAddActivityToTrip(act)}
                              variant="default"
                              size="sm"
                              className="flex-1 gap-1 text-xs font-bold shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add to Stop
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

        </div>

      </div>

      {/* Quick View Detailed Dialog */}
      {quickViewActivity && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden space-y-4 max-h-[85vh] overflow-y-auto">
            
            {/* Header Image */}
            <div className="relative h-60 w-full overflow-hidden bg-slate-900">
              <img
                src={quickViewActivity.image_url || 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80'}
                alt={quickViewActivity.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

              <button
                onClick={() => setQuickViewActivity(null)}
                className="absolute top-4 right-4 bg-slate-950/60 hover:bg-slate-950 text-white p-2 rounded-full backdrop-blur-md"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="default" className="bg-sky-500 text-white font-bold text-[10px]">
                    {quickViewActivity.category}
                  </Badge>
                  <span className="text-xs text-amber-400 font-extrabold flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400" /> {quickViewActivity.rating || 4.5} Rating
                  </span>
                </div>
                <h2 className="text-2xl font-black">{quickViewActivity.name}</h2>
              </div>
            </div>

            {/* Quick View Body Content */}
            <div className="p-6 space-y-5 text-slate-800">
              
              <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs font-semibold">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Estimated Cost</div>
                  <div className="font-extrabold text-sm text-emerald-600">
                    {quickViewActivity.estimated_cost === 0 ? 'Free' : `₹${quickViewActivity.estimated_cost}`}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Duration</div>
                  <div className="font-extrabold text-sm text-sky-600">
                    {quickViewActivity.duration_minutes || 90} Mins
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Location</div>
                  <div className="font-bold text-xs text-slate-700 truncate">
                    {quickViewActivity.location_name || quickViewActivity.city_name || 'City Center'}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-sm text-slate-900">About this Experience</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {quickViewActivity.description || `Experience ${quickViewActivity.name} with curated sightseeing tours, photo spots, and local guide highlights. Perfect for travelers looking to discover memorable spots and cultural heritage.`}
                </p>
              </div>

              {quickViewActivity.location_name && (
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-sky-50/70 p-3 rounded-xl border border-sky-200">
                  <MapPin className="w-4 h-4 text-sky-500 shrink-0" />
                  <span>Address / Landmark: {quickViewActivity.location_name}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button onClick={() => setQuickViewActivity(null)} variant="ghost" size="sm">
                  Close Quick View
                </Button>
                {tripId && (
                  isActivityAdded(quickViewActivity.id) ? (
                    <Button
                      onClick={() => {
                        handleRemoveActivityFromTrip(quickViewActivity.id);
                        setQuickViewActivity(null);
                      }}
                      variant="destructive"
                      size="sm"
                      className="font-bold gap-1"
                    >
                      <Trash2 className="w-4 h-4" /> Remove from Trip
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        handleAddActivityToTrip(quickViewActivity);
                        setQuickViewActivity(null);
                      }}
                      variant="default"
                      size="sm"
                      className="font-bold gap-1"
                    >
                      <Plus className="w-4 h-4" /> Add to Trip Stop
                    </Button>
                  )
                )}
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
