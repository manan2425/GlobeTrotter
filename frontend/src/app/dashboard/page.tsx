'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Compass, 
  MapPin, 
  Calendar, 
  DollarSign, 
  ArrowRight, 
  Star, 
  Globe, 
  Sparkles, 
  Luggage,
  Search,
  Filter,
  Activity,
  Plane,
  Clock,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [trips, setTrips] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total_trips: 0, cities_visited: 0, countries_explored: 0, total_budget: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [tripsRes, destsRes] = await Promise.all([
        apiRequest<any[]>('/trips'),
        apiRequest<any[]>('/destinations')
      ]);

      setTrips(tripsRes);
      setDestinations(destsRes.slice(0, 6));

      const totalB = tripsRes.reduce((acc, t) => acc + (t.estimated_budget || 0), 0);
      setStats({
        total_trips: tripsRes.length,
        cities_visited: 6,
        countries_explored: 3,
        total_budget: totalB
      });
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAddTripWithCity = async (cityId: string, cityName: string) => {
    try {
      const res = await apiRequest<any>('/trips', {
        method: 'POST',
        body: JSON.stringify({
          title: `Trip to ${cityName}`,
          description: `Planned multi-city travel package including ${cityName}.`,
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
          estimated_budget: 25000,
          initial_cities: [cityId]
        })
      });

      toast.success(`Created trip to ${cityName}!`);
      router.push(`/trips/${res.id}/builder`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create trip');
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (trip.description && trip.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = selectedStatus === 'ALL' || (trip.status && trip.status.toUpperCase() === selectedStatus);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Top Area: Integrated Command Header with Integrated Metrics (NO separate cards) */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl text-white">
        {/* Glowing Background Radial */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-6">
          {/* Top Row: User Greeting & Main CTA Buttons */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-semibold border border-sky-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>GlobeTrotter Command Center</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                {getGreeting()}, {user?.full_name?.split(' ')[0] || 'Manan'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
                Seamlessly orchestrate multi-city itineraries, monitor budget telemetry, and manage your travel schedule.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <Link href="/explore" className="w-full md:w-auto">
                <Button variant="outline" className="w-full md:w-auto border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold gap-1.5">
                  <Compass className="w-4 h-4 text-sky-400" />
                  <span>Explore Cities</span>
                </Button>
              </Link>
              <Link href="/trips/new" className="w-full md:w-auto">
                <Button variant="amber" className="w-full md:w-auto text-xs font-bold gap-1.5 shadow-lg shadow-amber-500/10">
                  <Plus className="w-4 h-4" />
                  <span>Plan New Trip</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Integrated Telemetry Bar (Card-free stats strip) */}
          <div className="pt-6 border-t border-slate-800/80">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-800/80 gap-y-4 md:gap-y-0">
              <div className="pr-4 space-y-1">
                <div className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                  <Luggage className="w-3.5 h-3.5 text-sky-400" /> Total Active Trips
                </div>
                <div className="text-2xl font-black text-white">{stats.total_trips}</div>
                <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <Activity className="w-3 h-3" /> Live itineraries
                </div>
              </div>

              <div className="pt-4 md:pt-0 md:px-6 space-y-1">
                <div className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" /> Cities Visited
                </div>
                <div className="text-2xl font-black text-white">{stats.cities_visited}</div>
                <div className="text-[11px] text-slate-400">Regional destination coverage</div>
              </div>

              <div className="pt-4 md:pt-0 md:px-6 space-y-1">
                <div className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" /> Countries Explored
                </div>
                <div className="text-2xl font-black text-white">{stats.countries_explored}</div>
                <div className="text-[11px] text-slate-400">Global footprint</div>
              </div>

              <div className="pt-4 md:pt-0 md:pl-6 space-y-1">
                <div className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Planned Budget
                </div>
                <div className="text-2xl font-black text-white">₹{stats.total_budget.toLocaleString()}</div>
                <div className="text-[11px] text-slate-400">Allocated travel funds</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search trips by title or city..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-slate-400 text-xs font-medium flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {['ALL', 'CONFIRMED', 'PLANNING', 'COMPLETED'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                selectedStatus === status
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Upcoming & Active Trips Section (Visual Card Grid) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-500" /> Upcoming & Active Trips
            </h2>
            <p className="text-xs text-slate-500">Your planned multi-city travel itineraries</p>
          </div>
          <Link href="/trips" className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1">
            View All Trips <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-3xl bg-slate-100 animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200/80 space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
              <Plane className="w-6 h-6" />
            </div>
            <div className="font-bold text-slate-900 text-base">No trips match your search</div>
            <p className="text-xs text-slate-500">Try adjusting your filters or plan a new journey!</p>
            <Link href="/trips/new">
              <Button variant="default" size="sm" className="gap-1.5 font-semibold text-xs mt-2">
                <Plus className="w-4 h-4" /> Plan First Journey
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map((trip) => (
              <div
                key={trip.id}
                onClick={() => router.push(`/trips/${trip.id}`)}
                className="group cursor-pointer rounded-3xl border border-slate-200/80 hover:border-sky-500/40 bg-white shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between hover:-translate-y-1"
              >
                {/* Trip Card Header Photo */}
                <div className="relative h-48 overflow-hidden bg-slate-900">
                  <img
                    src={trip.cover_image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828'}
                    alt={trip.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-sky-600 border border-slate-200/80 shadow-sm">
                    {trip.status || 'Planned'}
                  </div>

                  {/* Title & Dates on Photo Overlay */}
                  <div className="absolute bottom-3 left-4 right-4 text-white space-y-0.5">
                    <h3 className="font-extrabold text-lg group-hover:text-sky-300 transition-colors truncate">
                      {trip.title}
                    </h3>
                    <div className="text-xs text-slate-200 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-300" />
                      <span>{trip.start_date} → {trip.end_date}</span>
                    </div>
                  </div>
                </div>

                {/* Trip Card Specs Body */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between bg-white">
                  <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Cities</div>
                      <div className="font-extrabold text-xs text-slate-800">{trip.cities_count || 1}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Days</div>
                      <div className="font-extrabold text-xs text-slate-800">{trip.days_count || 5}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Budget</div>
                      <div className="font-extrabold text-xs text-emerald-600">₹{(trip.estimated_budget || 0).toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Progress Bar & Footer Link */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                      <span>Itinerary Progress</span>
                      <span className="font-bold text-sky-600">75% Completed</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full w-[75%] rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommended Destinations / Locations Section (Visual Location Card Grid) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-500" /> Recommended Destinations
            </h2>
            <p className="text-xs text-slate-500">Top-rated global cities for your upcoming travel itineraries</p>
          </div>
          <Link href="/explore" className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1">
            Explore All Cities <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((dest) => (
            <div
              key={dest.id}
              className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden hover:border-sky-400 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between shadow-sm hover:-translate-y-1"
            >
              {/* Location Card Photo Header */}
              <div className="relative h-44 overflow-hidden">
                <img
                  src={dest.image_url}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
                
                {/* Rating Badge */}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-amber-600 flex items-center gap-1 border border-slate-200 shadow-sm">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{dest.popularity_score}</span>
                </div>

                {/* City & Country Label */}
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <h3 className="font-extrabold text-lg">{dest.name}</h3>
                  <div className="text-xs text-slate-200">{dest.country_name} • {dest.region}</div>
                </div>
              </div>

              {/* Location Card Body & CTA */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{dest.description}</p>
                
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Avg Daily Cost</div>
                    <div className="font-extrabold text-sm text-slate-900">₹{dest.avg_daily_cost.toLocaleString()} / day</div>
                  </div>

                  <Button
                    onClick={() => handleQuickAddTripWithCity(dest.id, dest.name)}
                    variant="outline"
                    size="sm"
                    className="gap-1 hover:border-sky-500 hover:text-sky-600 font-bold border-slate-200 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Trip</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

