'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Calendar, MapPin, Copy, Share2, Trash2, Edit, Eye, Compass } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import toast from 'react-hot-toast';
import ShareModal from '../../components/ShareModal';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';

export default function MyTripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const [shareTrip, setShareTrip] = useState<any | null>(null);

  useEffect(() => {
    fetchTrips();
  }, [activeTab, sortBy]);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      let url = `/trips?sort=${sortBy}`;
      if (activeTab !== 'All') url += `&status=${activeTab}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

      const data = await apiRequest<any[]>(url);
      setTrips(data);
    } catch (err: any) {
      toast.error('Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (tripId: string) => {
    try {
      const res = await apiRequest<{ newTripId: string }>(`/trips/${tripId}/duplicate`, { method: 'POST' });
      toast.success('Trip duplicated! Opening new trip draft...');
      router.push(`/trips/${res.newTripId}`);
    } catch (err: any) {
      toast.error('Failed to duplicate trip');
    }
  };

  const handleDelete = async (tripId: string) => {
    if (!confirm('Are you sure you want to delete this trip?')) return;
    try {
      await apiRequest(`/trips/${tripId}`, { method: 'DELETE' });
      toast.success('Trip deleted');
      fetchTrips();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete trip');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <Compass className="w-7 h-7 text-sky-500" /> My Travel Journeys
          </h1>
          <p className="text-xs text-slate-500">Manage all your upcoming, ongoing, and completed multi-city itineraries</p>
        </div>

        <Link href="/trips/new">
          <Button variant="gradient" size="default" className="gap-2">
            <Plus className="w-4 h-4" /> Plan New Trip
          </Button>
        </Link>
      </div>

      {/* Filter Tabs & Search Control Strip */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto no-scrollbar">
          {['All', 'Upcoming', 'Ongoing', 'Completed', 'Draft'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                activeTab === tab
                  ? 'bg-sky-500 text-white shadow'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter trips by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchTrips()}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-sky-500"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 outline-none font-semibold"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="budget_high">Highest Budget</option>
            <option value="budget_low">Lowest Budget</option>
          </select>
        </div>

      </div>

      {/* Trips Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-slate-100 border border-slate-200 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : trips.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-3 shadow-sm">
          <div className="text-4xl">✈️</div>
          <div className="font-bold text-slate-900 text-base">No trips found</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || activeTab !== 'All'
              ? 'No trips matched your search filter criteria.'
              : 'You haven’t created any travel itineraries yet.'}
          </p>
          <Link href="/trips/new">
            <Button variant="default" size="default" className="gap-2">
              <Plus className="w-4 h-4" /> Create Your First Trip
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <Card
              key={trip.id}
              className="bg-white border-slate-200 rounded-3xl overflow-hidden hover:border-sky-400 transition flex flex-col justify-between shadow-sm hover:shadow-xl"
            >
              {/* Card Header & Image */}
              <div className="relative h-44 overflow-hidden">
                <img src={trip.cover_image} alt={trip.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-sky-600 border border-slate-200 shadow-sm">
                  {trip.status}
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="font-extrabold text-lg truncate">{trip.title}</h3>
                  <div className="text-xs text-slate-200">{trip.start_date} → {trip.end_date}</div>
                </div>
              </div>

              {/* Specs */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Cities</div>
                    <div className="font-extrabold text-xs text-slate-800">{trip.cities_count || 1}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Days</div>
                    <div className="font-extrabold text-xs text-slate-800">{trip.days_count || 5}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Budget</div>
                    <div className="font-extrabold text-xs text-emerald-600">₹{(trip.estimated_budget || 0).toLocaleString()}</div>
                  </div>
                </div>

                {/* Card Action Buttons (View, Edit, Duplicate, Share, Delete) */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-1">
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/trips/${trip.id}`}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl text-xs flex items-center gap-1 transition"
                      title="View Itinerary"
                    >
                      <Eye className="w-4 h-4 text-sky-600" />
                    </Link>
                    <Link
                      href={`/trips/${trip.id}/builder`}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl text-xs flex items-center gap-1 transition"
                      title="Edit Builder"
                    >
                      <Edit className="w-4 h-4 text-amber-500" />
                    </Link>
                    <button
                      onClick={() => handleDuplicate(trip.id)}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl text-xs transition"
                      title="Duplicate Trip"
                    >
                      <Copy className="w-4 h-4 text-indigo-500" />
                    </button>
                    <button
                      onClick={() => setShareTrip(trip)}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl text-xs transition"
                      title="Share Trip"
                    >
                      <Share2 className="w-4 h-4 text-emerald-500" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleDelete(trip.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl text-xs transition"
                    title="Delete Trip"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Share Modal */}
      {shareTrip && (
        <ShareModal
          tripId={shareTrip.id}
          currentVisibility={shareTrip.visibility}
          publicSlug={shareTrip.public_slug}
          isOpen={!!shareTrip}
          onClose={() => setShareTrip(null)}
        />
      )}

    </div>
  );
}
