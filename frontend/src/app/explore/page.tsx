'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Compass, MapPin, Star, Plus } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';

export default function ExplorePage() {
  const router = useRouter();
  const [cities, setCities] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedCountry, setSelectedCountry] = useState('All');

  useEffect(() => {
    fetchExploreData();
  }, [selectedRegion, selectedCountry]);

  const fetchExploreData = async () => {
    setLoading(true);
    try {
      let url = '/destinations?';
      if (selectedRegion !== 'All') url += `&region=${selectedRegion}`;
      if (selectedCountry !== 'All') url += `&country_id=${selectedCountry}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const [cityRes, countryRes] = await Promise.all([
        apiRequest<any[]>(url),
        apiRequest<any[]>('/countries')
      ]);

      setCities(cityRes);
      setCountries(countryRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAddTrip = async (cityId: string, cityName: string) => {
    try {
      const res = await apiRequest<any>('/trips', {
        method: 'POST',
        body: JSON.stringify({
          title: `Trip to ${cityName}`,
          description: `Personalized travel package for ${cityName}`,
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
          estimated_budget: 25000,
          initial_cities: [cityId]
        })
      });
      toast.success(`Created trip to ${cityName}!`);
      router.push(`/trips/${res.id}/builder`);
    } catch (err: any) {
      toast.error('Failed to create trip');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <Compass className="w-7 h-7 text-sky-500" /> Destination & Activity Discovery
        </h1>
        <p className="text-xs text-slate-500">Discover popular cities, local sightseeing tours, culinary experiences, and adventure sports</p>
      </div>

      {/* Search & Filter Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by city name, country, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchExploreData()}
            className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none font-semibold"
          >
            <option value="All">All Regions</option>
            <option value="North India">North India</option>
            <option value="West India">West India</option>
            <option value="Middle East">Middle East</option>
            <option value="Europe">Europe</option>
            <option value="East Asia">East Asia</option>
          </select>

          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none font-semibold"
          >
            <option value="All">All Countries</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Destination Cities Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-72 bg-slate-100 border border-slate-200 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cities.map((city) => (
            <Card
              key={city.id}
              className="bg-white border-slate-200 rounded-3xl overflow-hidden hover:border-sky-400 transition duration-300 shadow-sm hover:shadow-xl flex flex-col justify-between group"
            >
              <div className="relative h-48 overflow-hidden">
                <img src={city.image_url} alt={city.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-amber-600 flex items-center gap-1 border border-slate-200 shadow-sm">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {city.popularity_score}
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="font-extrabold text-xl">{city.name}</h3>
                  <div className="text-xs text-slate-200">{city.country_name} • Best Time: {city.best_time_to_visit}</div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{city.description}</p>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Avg Daily Budget</div>
                    <div className="font-extrabold text-sm text-slate-900">₹{city.avg_daily_cost?.toLocaleString()} / day</div>
                  </div>

                  <Button
                    onClick={() => handleQuickAddTrip(city.id, city.name)}
                    variant="default"
                    size="sm"
                    className="gap-1 font-bold"
                  >
                    <Plus className="w-4 h-4" /> Add to Trip
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
}
