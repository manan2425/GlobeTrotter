'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Compass, Copy, MapPin, Calendar, Clock, ArrowRight } from 'lucide-react';
import { apiRequest } from '../../../../lib/api';
import toast from 'react-hot-toast';
import TripMap from '../../../../components/TripMap';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';

export default function PublicTripViewPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicTrip();
  }, [slug]);

  const fetchPublicTrip = async () => {
    try {
      const data = await apiRequest<any>(`/public/trips/${slug}`);
      setTrip(data);
    } catch (err: any) {
      toast.error('Public trip not found or access restricted');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTripToAccount = async () => {
    try {
      const res = await apiRequest<{ newTripId: string }>(`/public/trips/${slug}/copy`, { method: 'POST' });
      toast.success('Trip copied to your GlobeTrotter account! ✈️');
      router.push(`/trips/${res.newTripId}`);
    } catch (err: any) {
      toast.error('Please sign in to copy this trip to your account.');
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-400 space-y-3 animate-pulse">
        <Compass className="w-8 h-8 text-sky-500 animate-spin mx-auto" />
        <div>Loading Public Itinerary Experience...</div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center text-slate-500 space-y-4">
        <div className="text-4xl">🔒</div>
        <div className="font-bold text-slate-900 text-lg">Public Trip Unavailable</div>
        <p className="text-xs text-slate-500">This trip link is private or no longer exists.</p>
        <Link href="/explore">
          <Button variant="default" size="sm">Explore Other Destinations</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Public Hero */}
      <div className="relative h-72 sm:h-96 rounded-3xl overflow-hidden shadow-xl border border-slate-200">
        <img src={trip.cover_image} alt={trip.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />

        <div className="absolute top-4 right-4 z-10">
          <Button
            onClick={handleCopyTripToAccount}
            variant="amber"
            size="default"
            className="gap-2 shadow-xl font-extrabold"
          >
            <Copy className="w-4 h-4" />
            <span>Copy Trip to My Account</span>
          </Button>
        </div>

        <div className="absolute bottom-6 left-6 right-6 text-white space-y-3 z-10">
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200 text-slate-800 font-semibold shadow-sm">
              <img src={trip.author_photo} alt={trip.author_name} className="w-4 h-4 rounded-full" />
              <span>{trip.author_name}</span>
            </div>
            <span className="text-slate-200 font-semibold">•</span>
            <span className="text-sky-300 font-bold">{trip.start_date} → {trip.end_date}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">{trip.title}</h1>
          <p className="text-xs sm:text-sm text-slate-200 max-w-2xl">{trip.description}</p>
        </div>
      </div>

      {/* Main Grid: Interactive Map + Timeline Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Map */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-white border-slate-200 p-4 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-500" /> Route Map Overview
            </h3>
            <TripMap stops={trip.stops || []} />
          </Card>

          {/* Copy CTA Banner */}
          <div className="bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white p-6 rounded-3xl space-y-3 shadow-xl">
            <div className="font-extrabold text-white text-base">Inspired by this itinerary?</div>
            <p className="text-xs text-sky-100 leading-relaxed">
              Copy this complete multi-city itinerary directly into your GlobeTrotter account to customize dates, swap activities, or recalculate budgets!
            </p>
            <Button
              onClick={handleCopyTripToAccount}
              variant="amber"
              size="default"
              className="w-full gap-2 font-extrabold shadow-md"
            >
              <Copy className="w-4 h-4" /> Copy This Public Trip
            </Button>
          </div>
        </div>

        {/* Read-Only Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {trip.stops?.map((stop: any, idx: number) => {
            const stopActivities = trip.activities?.filter((a: any) => a.trip_stop_id === stop.id) || [];

            return (
              <Card key={stop.id} className="bg-white border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <div className="text-xs font-bold text-sky-600 uppercase tracking-wider">Day {idx + 1}</div>
                    <h2 className="text-xl font-extrabold text-slate-900">{stop.city_name}</h2>
                  </div>
                  <div className="text-xs text-slate-500 font-semibold">{stop.arrival_date}</div>
                </div>

                <div className="space-y-3 relative pl-4 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {stopActivities.map((act: any) => (
                    <div key={act.id} className="relative bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between gap-4">
                      <div className="absolute -left-[17px] top-4 w-2.5 h-2.5 rounded-full bg-sky-500 ring-4 ring-white" />
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{act.custom_title || act.original_name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 font-medium">
                          <span className="text-sky-600 font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> {act.time_slot}</span>
                          <span>•</span>
                          <span>{act.category}</span>
                        </div>
                      </div>
                      <div className="font-extrabold text-sm text-emerald-600">₹{act.cost}</div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

      </div>

    </div>
  );
}
