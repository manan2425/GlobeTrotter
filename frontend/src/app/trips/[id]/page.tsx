'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Compass, MapPin, Calendar, Clock, DollarSign, Sparkles,
  Share2, Edit, Luggage, ArrowLeft, Layers, CheckCircle2, Circle,
  Building2, MessageSquare, Bot, ArrowRight, Users, Pencil
} from 'lucide-react';
import { apiRequest } from '../../../lib/api';
import toast from 'react-hot-toast';

import TripMap from '../../../components/TripMap';
import WeatherWidget from '../../../components/WeatherWidget';
import PackingListModal from '../../../components/PackingListModal';
import ShareModal from '../../../components/ShareModal';
import CollaborationPanel from '../../../components/CollaborationPanel';
import TripCalendarView from '../../../components/TripCalendarView';
import AIAssistantModal from '../../../components/AIAssistantModal';
import ActivitySearchModal from '../../../components/ActivitySearchModal';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';

export default function TripViewPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar' | 'discussion'>('timeline');
  const [selectedStopId, setSelectedStopId] = useState<string | undefined>(undefined);

  // Modals
  const [showPackingModal, setShowPackingModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showActivitySearchModal, setShowActivitySearchModal] = useState<any | null>(null);

  // Edit Trip Modal state
  const [showEditTripModal, setShowEditTripModal] = useState(false);
  const [editTripTitle, setEditTripTitle] = useState('');
  const [editTripDescription, setEditTripDescription] = useState('');
  const [editTripStartDate, setEditTripStartDate] = useState('');
  const [editTripEndDate, setEditTripEndDate] = useState('');
  const [editTripBudget, setEditTripBudget] = useState('0');
  const [editTripStatus, setEditTripStatus] = useState('Upcoming');

  useEffect(() => {
    fetchTrip();
  }, [tripId]);

  const fetchTrip = async () => {
    try {
      const data = await apiRequest<any>(`/trips/${tripId}`);
      setTrip(data);
      if (data.stops && data.stops.length > 0 && !selectedStopId) {
        setSelectedStopId(data.stops[0].id);
      }
    } catch (err: any) {
      toast.error('Failed to load trip');
    } finally {
      setLoading(false);
    }
  };

  const openEditTripModal = () => {
    if (!trip) return;
    setEditTripTitle(trip.title || '');
    setEditTripDescription(trip.description || '');
    setEditTripStartDate(trip.start_date || '');
    setEditTripEndDate(trip.end_date || '');
    setEditTripBudget(String(trip.estimated_budget || 0));
    setEditTripStatus(trip.status || 'Upcoming');
    setShowEditTripModal(true);
  };

  const handleUpdateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest(`/trips/${tripId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editTripTitle,
          description: editTripDescription,
          start_date: editTripStartDate,
          end_date: editTripEndDate,
          estimated_budget: Number(editTripBudget) || 0,
          status: editTripStatus
        })
      });
      toast.success('Trip dates & details updated!');
      setShowEditTripModal(false);
      fetchTrip();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update trip details');
    }
  };

  const handleToggleActivityCompletion = async (actId: string, currentStatus: boolean) => {
    try {
      await apiRequest(`/trip-activities/${actId}`, {
        method: 'PUT',
        body: JSON.stringify({ is_completed: !currentStatus })
      });
      fetchTrip();
      toast.success(!currentStatus ? 'Activity marked completed! 🎉' : 'Activity status updated');
    } catch (err: any) {
      toast.error('Failed to update activity status');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400 space-y-4 animate-pulse">
        <Compass className="w-10 h-10 text-sky-500 animate-spin mx-auto" />
        <div className="text-sm font-bold text-slate-600">Loading Itinerary Workspace...</div>
      </div>
    );
  }

  if (!trip) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Hero Header Banner */}
      <div className="relative h-72 sm:h-96 rounded-3xl overflow-hidden shadow-2xl border border-slate-200/90 group">
        <img
          src={trip.cover_image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=80'}
          alt={trip.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/20" />

        {/* Top Control Bar */}
        <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 z-10">
          <Link
            href="/trips"
            className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-xs font-extrabold text-slate-800 hover:bg-white hover:text-slate-950 flex items-center gap-1.5 border border-white/80 shadow-md"
          >
            <ArrowLeft className="w-4 h-4" /> Back to My Trips
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setShowPackingModal(true)}
              variant="amber"
              size="sm"
              className="gap-1.5 shadow-md font-bold text-xs"
            >
              <Luggage className="w-4 h-4" /> AI Packing List
            </Button>
            <Button
              onClick={() => setShowShareModal(true)}
              variant="secondary"
              size="sm"
              className="gap-1.5 bg-white/90 backdrop-blur-md text-slate-900 hover:bg-white border-white/80 shadow-md font-bold text-xs"
            >
              <Share2 className="w-4 h-4 text-emerald-600" /> Share
            </Button>
            <Link href={`/trips/${tripId}/builder`}>
              <Button variant="default" size="sm" className="gap-1.5 shadow-md font-bold text-xs">
                <Edit className="w-4 h-4" /> Edit Builder
              </Button>
            </Link>
          </div>
        </div>

        {/* Bottom Banner Title */}
        <div className="absolute bottom-6 left-6 right-6 text-white space-y-2 z-10 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default" className="bg-sky-500 text-white font-extrabold px-3 py-1 border-none shadow-md">
              {trip.status}
            </Badge>
            <button
              onClick={openEditTripModal}
              className="text-xs text-slate-200 font-bold bg-slate-900/60 hover:bg-slate-800/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 flex items-center gap-1.5 transition cursor-pointer hover:border-sky-400"
              title="Edit Trip Dates & Details"
            >
              <Pencil className="w-3 h-3 text-sky-400" />
              <span>{trip.start_date} → {trip.end_date}</span>
            </button>
            <span className="text-xs text-emerald-300 font-bold bg-slate-900/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
              Budget: ₹{(trip.estimated_budget || 0).toLocaleString()}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight drop-shadow-md">{trip.title}</h1>
          {trip.description && (
            <p className="text-xs sm:text-sm text-slate-200/90 max-w-2xl line-clamp-2 drop-shadow">{trip.description}</p>
          )}
        </div>
      </div>

      {/* Sub-navigation Controls (Unified 3-Tab Mode: Timeline, Calendar & Discussion) */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-3.5 rounded-3xl border border-slate-200/90 shadow-md">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
              viewMode === 'timeline'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-4 h-4" /> Day Timeline Mode
          </button>

          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
              viewMode === 'calendar'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Calendar className="w-4 h-4" /> Calendar View Mode
          </button>

          <button
            onClick={() => setViewMode('discussion')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
              viewMode === 'discussion'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Trip & Member Discussion
            {trip.comments && trip.comments.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                viewMode === 'discussion' ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-700'
              }`}>
                {trip.comments.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href={`/trips/${tripId}/budget`}>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-emerald-700 bg-emerald-50/80 border-emerald-200 hover:bg-emerald-100 font-extrabold text-xs shadow-2xs"
            >
              <DollarSign className="w-4 h-4 text-emerald-600" /> Open Budget Tracker
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content Layout: Interactive Route Map & Weather + Active Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Interactive Map & Live Weather Widget */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-white border-slate-200/90 p-5 sm:p-6 shadow-md space-y-4 rounded-3xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 pt-1">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-500 shrink-0" /> Interactive Route Map
              </h3>
              <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-700 border-sky-200 font-extrabold px-2.5 py-0.5 rounded-full shrink-0">
                Unsplash Photos
              </Badge>
            </div>
            
            <TripMap
              stops={trip.stops || []}
              selectedStopId={selectedStopId}
              onSelectStop={(stopId) => setSelectedStopId(stopId)}
            />
          </Card>

          {/* Live Open-Meteo Weather Widget */}
          <WeatherWidget tripId={tripId} />
        </div>

        {/* Right Column: Active Tab Content (Timeline, Real Calendar, or Discussion) */}
        <div className="lg:col-span-2 space-y-6">
          {viewMode === 'timeline' && (
            /* Day-wise Layout with City Headers and Activity Blocks */
            <div className="space-y-6">
              {trip.stops?.map((stop: any, index: number) => {
                const stopActivities = trip.activities?.filter((a: any) => a.trip_stop_id === stop.id) || [];
                const stopHotels = trip.accommodations?.filter((h: any) => h.trip_stop_id === stop.id) || [];
                const dayCost = stopActivities.reduce((sum: number, act: any) => sum + (Number(act.cost) || 0), 0);

                const isSelected = stop.id === selectedStopId;

                return (
                  <Card
                    key={stop.id}
                    className={`bg-white border transition-all duration-300 p-6 shadow-md rounded-3xl space-y-5 ${
                      isSelected ? 'border-sky-500 ring-2 ring-sky-500/20 shadow-lg' : 'border-slate-200/90'
                    }`}
                  >
                    {/* City Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-sky-600 uppercase tracking-wider bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                            Day {index + 1}
                          </span>
                          {stop.arrival_date && (
                            <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" /> {stop.arrival_date}
                              {stop.departure_date && <span> → {stop.departure_date}</span>}
                            </span>
                          )}
                        </div>

                        <h2 className="text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
                          {stop.city_name}
                          {stop.country_name && (
                            <span className="text-xs font-semibold text-slate-500">({stop.country_name})</span>
                          )}
                        </h2>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                        <Button
                          onClick={() => setShowActivitySearchModal(stop)}
                          variant="outline"
                          size="sm"
                          className="text-xs font-bold text-sky-700 bg-sky-50 border-sky-200 hover:bg-sky-100 gap-1"
                        >
                          <Compass className="w-3.5 h-3.5 text-sky-500" /> Explore Activities
                        </Button>

                        <div className="text-xs text-emerald-700 font-extrabold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" /> Day Total: ₹{dayCost.toLocaleString()}
                        </div>

                        {stopHotels.length > 0 && (
                          <div className="text-xs text-amber-700 font-bold bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" /> {stopHotels[0].name}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Activity Blocks with Time and Cost */}
                    <div className="space-y-3 relative pl-5 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {stopActivities.length === 0 ? (
                        <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-500 flex items-center justify-between border border-slate-100">
                          <span>No specific activities scheduled for this day yet.</span>
                          <button
                            onClick={() => setShowActivitySearchModal(stop)}
                            className="text-sky-600 font-bold hover:underline text-xs flex items-center gap-1"
                          >
                            + Browse & Add Activities
                          </button>
                        </div>
                      ) : (
                        stopActivities.map((act: any) => (
                          <div
                            key={act.id}
                            className={`relative bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/90 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-200 ${
                              act.is_completed ? 'opacity-70 bg-slate-100/50' : ''
                            }`}
                          >
                            {/* Dot on timeline stem */}
                            <div
                              className={`absolute -left-[21px] top-5 w-3 h-3 rounded-full border-2 border-white shadow ${
                                act.is_completed ? 'bg-emerald-500 ring-2 ring-emerald-300' : 'bg-sky-500 ring-2 ring-sky-300'
                              }`}
                            />
                            
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-14 h-14 rounded-2xl bg-slate-200 overflow-hidden shrink-0 shadow-sm">
                                <img
                                  src={act.original_image || 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=400&q=80'}
                                  alt={act.custom_title}
                                  className="w-full h-full object-cover"
                                />
                              </div>

                              <div className="space-y-1 min-w-0">
                                <div className={`font-extrabold text-slate-900 text-sm flex items-center gap-2 ${act.is_completed ? 'line-through text-slate-400' : ''}`}>
                                  <button
                                    onClick={() => handleToggleActivityCompletion(act.id, !!act.is_completed)}
                                    className="hover:scale-110 transition shrink-0"
                                    title={act.is_completed ? 'Mark incomplete' : 'Mark completed'}
                                  >
                                    {act.is_completed ? (
                                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                                    ) : (
                                      <Circle className="w-4.5 h-4.5 text-slate-400 hover:text-sky-500" />
                                    )}
                                  </button>
                                  <span className="truncate">{act.custom_title || act.original_name}</span>
                                </div>

                                <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 font-medium">
                                  <span className="flex items-center gap-1 text-sky-600 font-bold bg-sky-50 px-2 py-0.5 rounded-md">
                                    <Clock className="w-3 h-3" /> {act.time_slot || '10:00 AM'} ({act.duration_minutes || 90} min)
                                  </span>
                                  <span className="bg-slate-200/80 px-2 py-0.5 rounded-md text-[10px] text-slate-700 font-extrabold">
                                    {act.category || 'Sightseeing'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                              <div className="text-right">
                                <div className="font-black text-sm text-emerald-600">
                                  ₹{Number(act.cost || 0).toLocaleString()}
                                </div>
                                <div className="text-[10px] text-slate-400 font-semibold">Estimated Cost</div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {viewMode === 'calendar' && (
            /* Real Interactive Monthly Calendar View */
            <TripCalendarView
              trip={trip}
              onSelectStop={(stopId) => setSelectedStopId(stopId)}
              onSwitchToTimeline={(stopId) => {
                if (stopId) setSelectedStopId(stopId);
                setViewMode('timeline');
              }}
              onAddActivity={(stop) => setShowActivitySearchModal(stop)}
              onToggleActivityCompletion={handleToggleActivityCompletion}
            />
          )}

          {viewMode === 'discussion' && (
            /* Trip & Member Discussion Tab */
            <CollaborationPanel
              tripId={tripId}
              members={trip.members || []}
              comments={trip.comments || []}
              onRefresh={fetchTrip}
            />
          )}
        </div>

      </div>

      {/* Floating AI Assistant Trigger */}
      <button
        onClick={() => setShowAIModal(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-sky-500 to-indigo-600 text-white p-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 group font-bold text-xs ring-4 ring-sky-500/20"
        title="Ask GlobeTrotter AI Assistant"
      >
        <Bot className="w-5 h-5 text-amber-300 animate-bounce" />
        <span className="hidden sm:inline pr-1">Ask Trip AI</span>
      </button>

      {/* Modals */}
      <PackingListModal
        tripId={tripId}
        destinationName={trip.title}
        durationDays={trip.stops?.length || 5}
        isOpen={showPackingModal}
        onClose={() => setShowPackingModal(false)}
      />

      <ShareModal
        tripId={tripId}
        currentVisibility={trip.visibility}
        publicSlug={trip.public_slug}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />

      {/* Edit Trip Details Modal */}
      {showEditTripModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-500" /> Edit Trip Dates & Details
            </h3>
            <form onSubmit={handleUpdateTrip} className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1 font-medium">Trip Title</label>
                <input
                  type="text"
                  required
                  value={editTripTitle}
                  onChange={(e) => setEditTripTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-sky-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1 font-medium">Description</label>
                <textarea
                  rows={2}
                  value={editTripDescription}
                  onChange={(e) => setEditTripDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-sky-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500 block mb-1 font-medium">Trip Start Date</label>
                  <input
                    type="date"
                    required
                    value={editTripStartDate}
                    onChange={(e) => setEditTripStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 outline-none focus:border-sky-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1 font-medium">Trip End Date</label>
                  <input
                    type="date"
                    required
                    value={editTripEndDate}
                    onChange={(e) => setEditTripEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 outline-none focus:border-sky-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500 block mb-1 font-medium">Estimated Budget (₹)</label>
                  <input
                    type="number"
                    value={editTripBudget}
                    onChange={(e) => setEditTripBudget(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 outline-none focus:border-sky-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1 font-medium">Status</label>
                  <select
                    value={editTripStatus}
                    onChange={(e) => setEditTripStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 outline-none focus:border-sky-500 font-semibold"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" onClick={() => setShowEditTripModal(false)} variant="ghost" size="sm">
                  Cancel
                </Button>
                <Button type="submit" variant="default" size="sm">
                  Save Trip Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AIAssistantModal tripId={tripId} isOpen={showAIModal} onClose={() => setShowAIModal(false)} />

      <ActivitySearchModal
        isOpen={!!showActivitySearchModal}
        onClose={() => setShowActivitySearchModal(null)}
        tripId={tripId}
        stopId={showActivitySearchModal?.id}
        cityName={showActivitySearchModal?.city_name}
        cityId={showActivitySearchModal?.city_id}
        allStops={trip?.stops || []}
        existingTripActivities={trip?.activities || []}
        onActivityAdded={fetchTrip}
      />

    </div>
  );
}
