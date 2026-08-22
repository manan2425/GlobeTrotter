'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Compass, MapPin, Calendar, Clock, DollarSign, Sparkles,
  Share2, Edit, Luggage, ArrowLeft, Layers
} from 'lucide-react';
import { apiRequest } from '../../../lib/api';
import toast from 'react-hot-toast';

import TripMap from '../../../components/TripMap';
import WeatherWidget from '../../../components/WeatherWidget';
import PackingListModal from '../../../components/PackingListModal';
import ShareModal from '../../../components/ShareModal';
import CollaborationPanel from '../../../components/CollaborationPanel';
import AIAssistantModal from '../../../components/AIAssistantModal';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';

export default function TripViewPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar'>('timeline');

  // Modals
  const [showPackingModal, setShowPackingModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  useEffect(() => {
    fetchTrip();
  }, [tripId]);

  const fetchTrip = async () => {
    try {
      const data = await apiRequest<any>(`/trips/${tripId}`);
      setTrip(data);
    } catch (err: any) {
      toast.error('Failed to load trip');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-400 space-y-3 animate-pulse">
        <Compass className="w-8 h-8 text-sky-500 animate-spin mx-auto" />
        <div>Loading Itinerary Experience...</div>
      </div>
    );
  }

  if (!trip) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner / Hero Card */}
      <div className="relative h-64 sm:h-80 rounded-3xl overflow-hidden shadow-xl border border-slate-200">
        <img src={trip.cover_image} alt={trip.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <Link href="/trips" className="bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-800 hover:text-slate-950 flex items-center gap-1 border border-slate-200 shadow-sm">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to My Trips
          </Link>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowPackingModal(true)}
              variant="amber"
              size="sm"
              className="gap-1.5"
            >
              <Luggage className="w-4 h-4" /> AI Packing List
            </Button>
            <Button
              onClick={() => setShowShareModal(true)}
              variant="secondary"
              size="sm"
              className="gap-1.5 bg-white/90 text-slate-900 hover:bg-white border-slate-200"
            >
              <Share2 className="w-4 h-4 text-emerald-600" /> Share
            </Button>
            <Link href={`/trips/${tripId}/builder`}>
              <Button variant="default" size="sm" className="gap-1.5">
                <Edit className="w-4 h-4" /> Edit Builder
              </Button>
            </Link>
          </div>
        </div>

        <div className="absolute bottom-6 left-6 right-6 text-white space-y-2 z-10">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-sky-500 text-white border-none">{trip.status}</Badge>
            <span className="text-xs text-slate-200 font-semibold">{trip.start_date} → {trip.end_date}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">{trip.title}</h1>
          <p className="text-xs sm:text-sm text-slate-200 max-w-2xl">{trip.description}</p>
        </div>
      </div>

      {/* Navigation Sub-bar (Timeline vs Calendar Toggle, Budget & Optimizer Links) */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'timeline' ? 'bg-sky-500 text-white shadow' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" /> Timeline Mode
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'calendar' ? 'bg-sky-500 text-white shadow' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" /> Calendar Mode
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/trips/${tripId}/budget`}>
            <Button variant="outline" size="sm" className="gap-1.5 text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 font-bold">
              <DollarSign className="w-4 h-4" /> Budget Dashboard
            </Button>
          </Link>
          <Link href={`/trips/${tripId}/optimize`}>
            <Button variant="outline" size="sm" className="gap-1.5 text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100 font-bold">
              <Sparkles className="w-4 h-4 text-amber-500" /> Optimize Trip
            </Button>
          </Link>
        </div>
      </div>

      {/* Weather Widget */}
      <WeatherWidget tripId={tripId} />

      {/* Main Content Layout: Interactive Map + Timeline/Calendar Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Interactive Map */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-white border-slate-200 p-4 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-500" /> Interactive Route Map
            </h3>
            
            <TripMap stops={trip.stops || []} />
          </Card>

          {/* Collaboration & Comments */}
          <CollaborationPanel
            tripId={tripId}
            members={trip.members || []}
            comments={trip.comments || []}
            onRefresh={fetchTrip}
          />
        </div>

        {/* Right Column: Timeline / Calendar View */}
        <div className="lg:col-span-2 space-y-6">
          {viewMode === 'timeline' ? (
            <div className="space-y-6">
              {trip.stops?.map((stop: any, index: number) => {
                const stopActivities = trip.activities?.filter((a: any) => a.trip_stop_id === stop.id) || [];

                return (
                  <Card key={stop.id} className="bg-white border-slate-200 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <div className="text-xs font-bold text-sky-600 uppercase tracking-wider">Day {index + 1}</div>
                        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                          {stop.city_name} <span className="text-xs font-medium text-slate-500">({stop.country_name})</span>
                        </h2>
                      </div>
                      <div className="text-xs text-slate-600 font-bold bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                        {stop.arrival_date}
                      </div>
                    </div>

                    {/* Timeline Activity Cards */}
                    <div className="space-y-3 relative pl-4 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {stopActivities.length === 0 ? (
                        <div className="text-xs text-slate-400 italic py-2">No specific activities scheduled yet.</div>
                      ) : (
                        stopActivities.map((act: any) => (
                          <div key={act.id} className="relative bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="absolute -left-[17px] top-4 w-2.5 h-2.5 rounded-full bg-sky-500 ring-4 ring-white" />
                            
                            <div className="flex items-center gap-3">
                              <div className="w-14 h-12 rounded-xl bg-slate-200 overflow-hidden shrink-0">
                                <img src={act.original_image || 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=400&q=80'} alt={act.custom_title} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <div className="font-extrabold text-slate-900 text-sm">{act.custom_title || act.original_name}</div>
                                <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 font-medium">
                                  <span className="flex items-center gap-1 text-sky-600 font-bold"><Clock className="w-3 h-3" /> {act.time_slot} ({act.duration_minutes} min)</span>
                                  <span>•</span>
                                  <span className="bg-slate-200 px-2 py-0.2 rounded text-[10px] text-slate-700 font-bold">{act.category}</span>
                                </div>
                              </div>
                            </div>

                            <div className="font-extrabold text-sm text-emerald-600 shrink-0">
                              ₹{act.cost}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="bg-white border-slate-200 p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sky-500" /> Itinerary Calendar Grid
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {trip.stops?.map((stop: any, idx: number) => (
                  <div key={stop.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <div className="text-xs font-bold text-sky-600">Day {idx + 1} • {stop.arrival_date}</div>
                    <div className="font-extrabold text-slate-900">{stop.city_name}</div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {(trip.activities?.filter((a: any) => a.trip_stop_id === stop.id) || []).length} Scheduled Events
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

      </div>

      {/* Modals */}
      <PackingListModal
        tripId={tripId}
        destinationName={trip.title}
        durationDays={6}
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

      <AIAssistantModal tripId={tripId} isOpen={showAIModal} onClose={() => setShowAIModal(false)} />

    </div>
  );
}
