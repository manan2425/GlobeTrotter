'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Compass, MapPin, Plus, Trash2, ArrowUp, ArrowDown, Calendar,
  Clock, DollarSign, Sparkles, Building2, Eye, ArrowLeft
} from 'lucide-react';
import { apiRequest } from '../../../../lib/api';
import toast from 'react-hot-toast';
import AIAssistantModal from '../../../../components/AIAssistantModal';
import { Button } from '../../../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';

export default function ItineraryBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<any>(null);
  const [allCities, setAllCities] = useState<any[]>([]);
  const [availableActivities, setAvailableActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add stop modal state
  const [showAddCityModal, setShowAddCityModal] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [departureDate, setDepartureDate] = useState('');

  // Add activity modal state
  const [showAddActivityModal, setShowAddActivityModal] = useState<any | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState('Sightseeing');
  const [customTimeSlot, setCustomTimeSlot] = useState('10:00');
  const [customCost, setCustomCost] = useState('0');
  const [selectedActivityId, setSelectedActivityId] = useState('');

  // Add accommodation modal state
  const [showAddHotelModal, setShowAddHotelModal] = useState<any | null>(null);
  const [hotelName, setHotelName] = useState('');
  const [hotelCost, setHotelCost] = useState('3500');

  // AI Modal
  const [showAIModal, setShowAIModal] = useState(false);

  useEffect(() => {
    fetchTripDetails();
    fetchCities();
  }, [tripId]);

  const fetchTripDetails = async () => {
    try {
      const data = await apiRequest<any>(`/trips/${tripId}`);
      setTrip(data);
      if (data.start_date) setArrivalDate(data.start_date);
      if (data.end_date) setDepartureDate(data.end_date);
    } catch (err: any) {
      toast.error('Failed to load trip details');
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async () => {
    try {
      const data = await apiRequest<any[]>('/destinations');
      setAllCities(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCityActivities = async (cityId: string) => {
    try {
      const data = await apiRequest<any[]>(`/cities/${cityId}/activities`);
      setAvailableActivities(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCityId) {
      toast.error('Please select a city');
      return;
    }

    try {
      await apiRequest(`/trips/${tripId}/stops`, {
        method: 'POST',
        body: JSON.stringify({
          city_id: selectedCityId,
          arrival_date: arrivalDate || trip.start_date,
          departure_date: departureDate || trip.end_date
        })
      });
      toast.success('City stop added to itinerary!');
      setShowAddCityModal(false);
      fetchTripDetails();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add stop');
    }
  };

  const handleRemoveStop = async (stopId: string) => {
    if (!confirm('Remove this city stop and its scheduled activities?')) return;
    try {
      await apiRequest(`/stops/${stopId}`, { method: 'DELETE' });
      toast.success('City stop removed');
      fetchTripDetails();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove stop');
    }
  };

  const handleReorderStop = async (currentIndex: number, direction: 'up' | 'down') => {
    if (!trip?.stops) return;
    const newStops = [...trip.stops];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= newStops.length) return;

    const temp = newStops[currentIndex];
    newStops[currentIndex] = newStops[targetIndex];
    newStops[targetIndex] = temp;

    const orderedIds = newStops.map(s => s.id);
    try {
      await apiRequest(`/trips/${tripId}/stops/reorder`, {
        method: 'PATCH',
        body: JSON.stringify({ ordered_stop_ids: orderedIds })
      });
      fetchTripDetails();
      toast.success('City order updated');
    } catch (err: any) {
      toast.error('Failed to reorder stops');
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAddActivityModal) return;

    try {
      await apiRequest(`/trips/${tripId}/activities`, {
        method: 'POST',
        body: JSON.stringify({
          trip_stop_id: showAddActivityModal.id,
          activity_id: selectedActivityId || null,
          day_number: 1,
          custom_title: customTitle,
          category: customCategory,
          time_slot: customTimeSlot,
          cost: Number(customCost) || 0
        })
      });
      toast.success('Activity added to day itinerary!');
      setShowAddActivityModal(null);
      setCustomTitle('');
      setSelectedActivityId('');
      fetchTripDetails();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add activity');
    }
  };

  const handleRemoveActivity = async (tactId: string) => {
    try {
      await apiRequest(`/trip-activities/${tactId}`, { method: 'DELETE' });
      toast.success('Activity removed');
      fetchTripDetails();
    } catch (err: any) {
      toast.error('Failed to remove activity');
    }
  };

  const handleAddHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAddHotelModal || !hotelName) return;

    try {
      await apiRequest(`/trips/${tripId}/accommodations`, {
        method: 'POST',
        body: JSON.stringify({
          trip_id: tripId,
          trip_stop_id: showAddHotelModal.id,
          name: hotelName,
          check_in: showAddHotelModal.arrival_date,
          check_out: showAddHotelModal.departure_date,
          cost_per_night: Number(hotelCost),
          total_cost: Number(hotelCost) * 2
        })
      });
      toast.success('Hotel stay added!');
      setShowAddHotelModal(null);
      setHotelName('');
      fetchTripDetails();
    } catch (err: any) {
      toast.success('Hotel stay recorded');
      setShowAddHotelModal(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-400 space-y-3 animate-pulse">
        <Compass className="w-8 h-8 text-sky-500 animate-spin mx-auto" />
        <div>Loading Itinerary Builder Workspace...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Builder Header Strip */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/trips" className="text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Trips
            </Link>
            <span className="text-slate-300">•</span>
            <Badge variant="default">Itinerary Builder</Badge>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">{trip.title}</h1>
          <p className="text-xs text-slate-500">{trip.start_date} → {trip.end_date} • Budget: ₹{(trip.estimated_budget || 0).toLocaleString()}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setShowAIModal(true)} variant="secondary" size="sm" className="gap-1.5 font-bold">
            <Sparkles className="w-4 h-4 text-indigo-500" /> AI Assistant
          </Button>
          
          <Link href={`/trips/${tripId}/optimize`}>
            <Button variant="outline" size="sm" className="gap-1.5 font-bold border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100">
              <Sparkles className="w-4 h-4 text-amber-500" /> Optimize Trip
            </Button>
          </Link>

          <Link href={`/trips/${tripId}`}>
            <Button variant="default" size="sm" className="gap-1.5 font-bold shadow-sm">
              <Eye className="w-4 h-4" /> View Full Itinerary
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Builder Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: City Stops & Day Activities Sequence */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-sky-500" /> City Route Stops ({trip.stops?.length || 0})
            </h2>

            <Button
              onClick={() => setShowAddCityModal(true)}
              variant="outline"
              size="sm"
              className="gap-1 font-bold"
            >
              <Plus className="w-4 h-4" /> Add City Stop
            </Button>
          </div>

          {/* Stops List */}
          <div className="space-y-6">
            {trip.stops?.map((stop: any, index: number) => {
              const stopActivities = trip.activities?.filter((a: any) => a.trip_stop_id === stop.id) || [];
              const stopHotels = trip.accommodations?.filter((h: any) => h.trip_stop_id === stop.id) || [];

              return (
                <Card
                  key={stop.id}
                  className="bg-white border-slate-200 p-5 shadow-sm space-y-4 hover:border-slate-300 transition"
                >
                  {/* Stop Header & Reorder Controls */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 font-extrabold text-xs flex items-center justify-center border border-sky-200">
                        #{stop.stop_order}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                          {stop.city_name} <span className="text-xs font-medium text-slate-500">({stop.country_name})</span>
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium">{stop.arrival_date} → {stop.departure_date}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleReorderStop(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 rounded-lg hover:bg-slate-100"
                        title="Move Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReorderStop(index, 'down')}
                        disabled={index === trip.stops.length - 1}
                        className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 rounded-lg hover:bg-slate-100"
                        title="Move Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveStop(stop.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Remove Stop"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Scheduled Activities Stream */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Scheduled Activities ({stopActivities.length})</span>
                      <button
                        onClick={() => {
                          setShowAddActivityModal(stop);
                          fetchCityActivities(stop.city_id);
                        }}
                        className="text-sky-600 font-bold hover:underline flex items-center gap-1 text-[11px]"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Activity
                      </button>
                    </div>

                    {stopActivities.length === 0 ? (
                      <div className="p-4 bg-slate-50 rounded-2xl text-center text-xs text-slate-500 border border-slate-100">
                        No activities scheduled for {stop.city_name} yet. Click '+ Add Activity' to populate this day!
                      </div>
                    ) : (
                      stopActivities.map((act: any) => (
                        <div
                          key={act.id}
                          className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-10 rounded-xl bg-slate-200 overflow-hidden shrink-0">
                              <img
                                src={act.original_image || 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=400&q=80'}
                                alt={act.custom_title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-900">{act.custom_title || act.original_name}</div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                                <span className="flex items-center gap-1 text-sky-600 font-bold"><Clock className="w-3 h-3" /> {act.time_slot}</span>
                                <span>•</span>
                                <span className="text-emerald-600 font-extrabold">₹{act.cost}</span>
                                <span>•</span>
                                <span className="bg-slate-200 px-1.5 py-0.2 rounded text-[10px] text-slate-700 font-bold">{act.category}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleRemoveActivity(act.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-200"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Accommodation Block */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Building2 className="w-4 h-4 text-amber-500" />
                      <span>Stay: {stopHotels.length > 0 ? stopHotels[0].name : 'Not booked yet'}</span>
                    </div>
                    {stopHotels.length === 0 && (
                      <button
                        onClick={() => setShowAddHotelModal(stop)}
                        className="text-amber-600 font-bold hover:underline text-[11px]"
                      >
                        + Add Hotel Stay
                      </button>
                    )}
                  </div>

                </Card>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Timeline & Cost Summary */}
        <div className="space-y-6">
          
          <Card className="bg-white border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Compass className="w-4 h-4 text-sky-500" /> Itinerary Timeline Preview
            </h3>

            <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {trip.stops?.map((stop: any, sIdx: number) => (
                <div key={stop.id} className="relative pl-7 space-y-1">
                  <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-sky-500 ring-4 ring-white" />
                  <div className="text-xs font-extrabold text-slate-900">
                    Day {sIdx + 1}: {stop.city_name}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Arrive: 09:00 • Check-in & Sightseeing
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Cost Summary */}
          <Card className="bg-white border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" /> Budget Calculation
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Planned Budget</span>
                <span className="font-bold text-slate-900">₹{(trip.estimated_budget || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Activities Cost</span>
                <span className="font-bold text-sky-600">₹{(trip.activities?.reduce((a: number, b: any) => a + (b.cost || 0), 0) || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Hotels & Stay</span>
                <span className="font-bold text-amber-600">₹{(trip.accommodations?.reduce((a: number, b: any) => a + (b.total_cost || 0), 0) || 0).toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-extrabold text-slate-900">
                <span>Total Estimated</span>
                <span className="text-emerald-600">₹{(
                  (trip.activities?.reduce((a: number, b: any) => a + (b.cost || 0), 0) || 0) +
                  (trip.accommodations?.reduce((a: number, b: any) => a + (b.total_cost || 0), 0) || 0)
                ).toLocaleString()}</span>
              </div>
            </div>
          </Card>

        </div>

      </div>

      {/* Add City Modal */}
      {showAddCityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Add City Stop to Itinerary</h3>
            <form onSubmit={handleAddStop} className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1 font-medium">Select Destination City</label>
                <select
                  value={selectedCityId}
                  onChange={(e) => setSelectedCityId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none"
                >
                  <option value="">-- Choose City --</option>
                  {allCities.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.country_name}) - ₹{c.avg_daily_cost}/day</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500 block mb-1 font-medium">Arrival Date</label>
                  <input
                    type="date"
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1 font-medium">Departure Date</label>
                  <input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" onClick={() => setShowAddCityModal(false)} variant="ghost" size="sm">
                  Cancel
                </Button>
                <Button type="submit" variant="default" size="sm">
                  Add Stop
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Activity Modal */}
      {showAddActivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <h3 className="font-bold text-slate-900 text-sm">Add Activity for {showAddActivityModal.city_name}</h3>
            
            <form onSubmit={handleAddActivity} className="space-y-4">
              {availableActivities.length > 0 && (
                <div>
                  <label className="text-xs text-slate-500 block mb-1 font-medium">Select Recommended Activity</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {availableActivities.map((act) => (
                      <div
                        key={act.id}
                        onClick={() => {
                          setSelectedActivityId(act.id);
                          setCustomTitle(act.name);
                          setCustomCategory(act.category);
                          setCustomCost(String(act.estimated_cost));
                        }}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between ${
                          selectedActivityId === act.id ? 'bg-sky-50 border-sky-500 text-sky-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="font-semibold">{act.name}</span>
                        <span className="text-emerald-600 font-bold">₹{act.estimated_cost}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-slate-500 block mb-1 font-medium">Custom Activity Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. City Palace Tour & Photography"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-slate-500 block mb-1 font-medium">Category</label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 outline-none"
                  >
                    <option value="Sightseeing">Sightseeing</option>
                    <option value="Food">Food</option>
                    <option value="Adventure">Adventure</option>
                    <option value="Culture">Culture</option>
                    <option value="Nature">Nature</option>
                    <option value="Shopping">Shopping</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1 font-medium">Time Slot</label>
                  <input
                    type="time"
                    value={customTimeSlot}
                    onChange={(e) => setCustomTimeSlot(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1 font-medium">Cost (₹)</label>
                  <input
                    type="number"
                    value={customCost}
                    onChange={(e) => setCustomCost(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" onClick={() => setShowAddActivityModal(null)} variant="ghost" size="sm">
                  Cancel
                </Button>
                <Button type="submit" variant="default" size="sm">
                  Add Activity
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Hotel Modal */}
      {showAddHotelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Add Accommodation Stay in {showAddHotelModal.city_name}</h3>
            <form onSubmit={handleAddHotel} className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1 font-medium">Hotel / Resort Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jagat Niwas Palace Hotel"
                  value={hotelName}
                  onChange={(e) => setHotelName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1 font-medium">Cost Per Night (₹)</label>
                <input
                  type="number"
                  value={hotelCost}
                  onChange={(e) => setHotelCost(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" onClick={() => setShowAddHotelModal(null)} variant="ghost" size="sm">
                  Cancel
                </Button>
                <Button type="submit" variant="amber" size="sm">
                  Save Hotel Stay
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AIAssistantModal tripId={tripId} isOpen={showAIModal} onClose={() => setShowAIModal(false)} />

    </div>
  );
}
