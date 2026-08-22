'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Compass, MapPin, Calendar, DollarSign, ArrowRight, Star, Globe, TrendingUp, Sparkles, Luggage } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [trips, setTrips] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total_trips: 0, cities_visited: 0, countries_explored: 0, total_budget: 0 });
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 p-6 sm:p-10 shadow-xl text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold border border-white/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>GlobeTrotter Explorer Portal</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
              {getGreeting()}, {user?.full_name?.split(' ')[0] || 'Manan'} 👋
            </h1>
            <p className="text-xs sm:text-sm text-sky-100 max-w-xl leading-relaxed">
              Where are you going next? Explore destinations, craft multi-city itineraries, and optimize your travel budgets.
            </p>
          </div>

          <Link href="/trips/new">
            <Button variant="amber" size="lg" className="gap-2 shadow-lg">
              <Plus className="w-5 h-5" />
              <span>Plan New Trip</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Statistics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 border-slate-200 shadow-sm bg-white space-y-1">
          <div className="text-slate-500 text-xs font-semibold flex items-center gap-1.5">
            <Luggage className="w-4 h-4 text-sky-500" /> Total Trips
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.total_trips}</div>
          <div className="text-[11px] text-emerald-600 font-bold">+2 this month</div>
        </Card>

        <Card className="p-5 border-slate-200 shadow-sm bg-white space-y-1">
          <div className="text-slate-500 text-xs font-semibold flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-amber-500" /> Cities Visited
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.cities_visited}</div>
          <div className="text-[11px] text-slate-500">Across Rajasthan & West India</div>
        </Card>

        <Card className="p-5 border-slate-200 shadow-sm bg-white space-y-1">
          <div className="text-slate-500 text-xs font-semibold flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-indigo-500" /> Countries Explored
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.countries_explored}</div>
          <div className="text-[11px] text-slate-500">Global travel footprint</div>
        </Card>

        <Card className="p-5 border-slate-200 shadow-sm bg-white space-y-1">
          <div className="text-slate-500 text-xs font-semibold flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-500" /> Total Planned Budget
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">₹{stats.total_budget.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500">Across upcoming journeys</div>
        </Card>
      </div>

      {/* Upcoming Trips Section */}
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
        ) : trips.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 space-y-3 shadow-sm">
            <div className="text-3xl">✈️</div>
            <div className="font-bold text-slate-900 text-base">No trips planned yet</div>
            <p className="text-xs text-slate-500">Start planning your next adventure today!</p>
            <Link href="/trips/new">
              <Button variant="default" size="default" className="gap-2">
                <Plus className="w-4 h-4" /> Plan Your First Trip
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <Card
                key={trip.id}
                onClick={() => router.push(`/trips/${trip.id}`)}
                className="group cursor-pointer border border-slate-200 hover:border-sky-500/50 hover:shadow-xl transition-all duration-300 flex flex-col bg-white"
              >
                {/* Cover Image & Status Badge */}
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={trip.cover_image}
                    alt={trip.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                  
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-sky-600 border border-slate-200 shadow-sm">
                    {trip.status}
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="font-extrabold text-lg group-hover:text-sky-300 transition-colors truncate">
                      {trip.title}
                    </h3>
                    <div className="text-xs text-slate-200 font-medium">
                      {trip.start_date} → {trip.end_date}
                    </div>
                  </div>
                </div>

                {/* Trip Card Footer Specs */}
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

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Itinerary Progress</span>
                      <span className="font-bold text-sky-600">75% Completed</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full w-[75%] rounded-full" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recommended Destinations Section */}
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
            <Card
              key={dest.id}
              className="bg-white border-slate-200 overflow-hidden hover:border-sky-400 transition group flex flex-col justify-between shadow-sm"
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={dest.image_url}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-amber-600 flex items-center gap-1 border border-slate-200 shadow-sm">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{dest.popularity_score}</span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="font-extrabold text-lg">{dest.name}</h3>
                  <div className="text-xs text-slate-200">{dest.country_name} • {dest.region}</div>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{dest.description}</p>
                
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Avg Daily Cost</div>
                    <div className="font-extrabold text-sm text-slate-900">₹{dest.avg_daily_cost.toLocaleString()} / day</div>
                  </div>

                  <Button
                    onClick={() => handleQuickAddTripWithCity(dest.id, dest.name)}
                    variant="outline"
                    size="sm"
                    className="gap-1 hover:border-sky-500 hover:text-sky-600 font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Trip</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

    </div>
  );
}
