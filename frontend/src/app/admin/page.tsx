'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck, TrendingUp, BarChart2, Users, MapPin, Search, Plus,
  Trash2, Eye, Globe, Lock, CheckCircle2, Ban, Layers, Building2,
  Sparkles, Compass, AlertCircle
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'trips' | 'catalog'>('overview');

  // Telemetry & Stats Data
  const [adminData, setAdminData] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [tripsList, setTripsList] = useState<any[]>([]);
  const [citiesList, setCitiesList] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  // Search Filters
  const [userSearch, setUserSearch] = useState('');
  const [tripSearch, setTripSearch] = useState('');

  // Modals for Catalog
  const [showAddCityModal, setShowAddCityModal] = useState(false);
  const [cityName, setCityName] = useState('');
  const [cityCountry, setCityCountry] = useState('India');
  const [cityRegion, setRegion] = useState('West India');
  const [cityBudget, setCityBudget] = useState('3500');
  const [cityImage, setCityImage] = useState('');
  const [cityDesc, setCityDesc] = useState('');

  const [showAddActModal, setShowAddActModal] = useState(false);
  const [actCityId, setActCityId] = useState('');
  const [actName, setActName] = useState('');
  const [actCategory, setActCategory] = useState('Sightseeing');
  const [actCost, setActCost] = useState('500');
  const [actDuration, setActDuration] = useState('120');

  useEffect(() => {
    fetchAdminOverview();
    fetchUsers();
    fetchTrips();
    fetchCatalog();
  }, []);

  const fetchAdminOverview = async () => {
    try {
      const data = await apiRequest<any>('/admin/dashboard');
      setAdminData(data);
    } catch (err: any) {
      toast.error('Failed to load admin telemetry');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const url = userSearch ? `/admin/users?search=${encodeURIComponent(userSearch)}` : '/admin/users';
      const data = await apiRequest<any[]>(url);
      setUsersList(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTrips = async () => {
    try {
      const url = tripSearch ? `/admin/trips?search=${encodeURIComponent(tripSearch)}` : '/admin/trips';
      const data = await apiRequest<any[]>(url);
      setTripsList(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCatalog = async () => {
    try {
      const data = await apiRequest<any[]>('/destinations');
      setCitiesList(data);
      if (data.length > 0) setActCityId(data[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  // User Actions
  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await apiRequest(`/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole })
      });
      toast.success(`User role updated to ${newRole}`);
      fetchUsers();
    } catch (err: any) {
      toast.error('Failed to update user role');
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Banned' ? 'Active' : 'Banned';
    try {
      await apiRequest(`/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      toast.success(`User status set to ${newStatus}`);
      fetchUsers();
    } catch (err: any) {
      toast.error('Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Purge user account for "${userName}"? This action cannot be undone.`)) return;
    try {
      await apiRequest(`/admin/users/${userId}`, { method: 'DELETE' });
      toast.success('User account purged');
      fetchUsers();
      fetchAdminOverview();
    } catch (err: any) {
      toast.error('Failed to purge user account');
    }
  };

  // Trip Actions
  const handleToggleTripVisibility = async (tripId: string, currentVis: string) => {
    const newVis = currentVis === 'Public' ? 'Private' : 'Public';
    try {
      await apiRequest(`/admin/trips/${tripId}/visibility`, {
        method: 'PATCH',
        body: JSON.stringify({ visibility: newVis })
      });
      toast.success(`Trip visibility updated to ${newVis}`);
      fetchTrips();
    } catch (err: any) {
      toast.error('Failed to update trip visibility');
    }
  };

  const handleDeleteTrip = async (tripId: string, title: string) => {
    if (!confirm(`Delete trip "${title}"? This action cannot be undone.`)) return;
    try {
      await apiRequest(`/admin/trips/${tripId}`, { method: 'DELETE' });
      toast.success('Trip deleted by moderation');
      fetchTrips();
      fetchAdminOverview();
    } catch (err: any) {
      toast.error('Failed to delete trip');
    }
  };

  // Catalog Actions
  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityName.trim() || !cityCountry.trim()) {
      toast.error('City name and country are required');
      return;
    }

    try {
      await apiRequest('/admin/cities', {
        method: 'POST',
        body: JSON.stringify({
          name: cityName.trim(),
          country_name: cityCountry.trim(),
          region: cityRegion,
          avg_daily_cost: Number(cityBudget),
          image_url: cityImage || 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80',
          description: cityDesc || `Explore the beautiful sights and rich heritage of ${cityName}.`
        })
      });
      toast.success(`Added ${cityName} to destinations catalog!`);
      setShowAddCityModal(false);
      setCityName('');
      fetchCatalog();
      fetchAdminOverview();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add destination city');
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actName.trim() || !actCityId) {
      toast.error('Activity name and city are required');
      return;
    }

    try {
      await apiRequest('/admin/activities', {
        method: 'POST',
        body: JSON.stringify({
          city_id: actCityId,
          name: actName.trim(),
          category: actCategory,
          duration_minutes: Number(actDuration),
          estimated_cost: Number(actCost)
        })
      });
      toast.success(`Added ${actName} to activity catalog!`);
      setShowAddActModal(false);
      setActName('');
      fetchAdminOverview();
    } catch (err: any) {
      toast.error('Failed to add activity');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-xs animate-pulse">Loading Admin Control Portal...</div>;
  }

  const COLORS = ['#0284c7', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <Badge variant="warning" className="gap-1 font-bold">
            <ShieldCheck className="w-4 h-4 text-amber-600" /> Admin Operations Center
          </Badge>
          <h1 className="text-2xl font-extrabold text-slate-900">GlobeTrotter Platform Management</h1>
          <p className="text-xs text-slate-500">System telemetry, user directory controls, trip moderation, and global catalog management</p>
        </div>

        {/* Database Status Indicator */}
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3 py-1.5 rounded-full font-bold">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
          <span>Neon PostgreSQL Active</span>
        </div>
      </div>

      {/* Admin Operations Tab Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'overview' ? 'bg-sky-500 text-white shadow' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Telemetry & Analytics
        </button>

        <button
          onClick={() => {
            setActiveTab('users');
            fetchUsers();
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'users' ? 'bg-sky-500 text-white shadow' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" /> User Directory ({adminData?.kpis?.total_users || 0})
        </button>

        <button
          onClick={() => {
            setActiveTab('trips');
            fetchTrips();
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'trips' ? 'bg-sky-500 text-white shadow' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Compass className="w-4 h-4" /> Trip Moderation ({adminData?.kpis?.total_trips || 0})
        </button>

        <button
          onClick={() => {
            setActiveTab('catalog');
            fetchCatalog();
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'catalog' ? 'bg-sky-500 text-white shadow' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" /> Global Catalog ({adminData?.kpis?.total_cities || 12} Cities)
        </button>
      </div>

      {/* TAB 1: OVERVIEW & SYSTEM TELEMETRY */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          
          {/* KPI Cards Strip */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-5 border-slate-200 shadow-sm bg-white space-y-1">
              <div className="text-slate-500 text-xs font-semibold">Total Users</div>
              <div className="text-2xl font-extrabold text-slate-900">{adminData?.kpis?.total_users}</div>
              <div className="text-[11px] text-emerald-600 font-bold">100% active</div>
            </Card>

            <Card className="p-5 border-slate-200 shadow-sm bg-white space-y-1">
              <div className="text-slate-500 text-xs font-semibold">Trips Created</div>
              <div className="text-2xl font-extrabold text-sky-600">{adminData?.kpis?.total_trips}</div>
              <div className="text-[11px] text-slate-500">Platform itineraries</div>
            </Card>

            <Card className="p-5 border-slate-200 shadow-sm bg-white space-y-1">
              <div className="text-slate-500 text-xs font-semibold">Public Shared Trips</div>
              <div className="text-2xl font-extrabold text-emerald-600">{adminData?.kpis?.shared_trips}</div>
              <div className="text-[11px] text-slate-500">Public links</div>
            </Card>

            <Card className="p-5 border-slate-200 shadow-sm bg-white space-y-1">
              <div className="text-slate-500 text-xs font-semibold">Avg Trip Budget</div>
              <div className="text-2xl font-extrabold text-amber-600">₹{adminData?.kpis?.avg_trip_budget?.toLocaleString()}</div>
              <div className="text-[11px] text-slate-500">Target budget</div>
            </Card>

            <Card className="p-5 border-slate-200 shadow-sm bg-white space-y-1">
              <div className="text-slate-500 text-xs font-semibold">Catalog Destinations</div>
              <div className="text-2xl font-extrabold text-indigo-600">{adminData?.kpis?.total_cities || 12} Cities</div>
              <div className="text-[11px] text-slate-500">{adminData?.kpis?.total_activities || 50}+ Activities</div>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* User & Trip Registration Growth */}
            <Card className="bg-white border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-500" /> Platform Growth & Monthly Trips
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={adminData?.trips_created_trend}>
                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="trips" fill="#0284c7" radius={[6, 6, 0, 0]} name="Trips Created" />
                    <Bar dataKey="users" fill="#10b981" radius={[6, 6, 0, 0]} name="New Users" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Activity Category Breakdown */}
            <Card className="bg-white border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-amber-500" /> Activity Category Distribution
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={adminData?.activity_category_breakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="category"
                    >
                      {adminData?.activity_category_breakdown?.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

          </div>

        </div>
      )}

      {/* TAB 2: USER DIRECTORY & MANAGEMENT */}
      {activeTab === 'users' && (
        <Card className="bg-white border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="font-bold text-slate-900 text-sm">User Directory ({usersList.length})</h3>
            
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-extrabold border-b border-slate-200">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Trips Created</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-900">{u.full_name}</td>
                    <td className="p-3 text-slate-500">{u.email}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleRole(u.id, u.role)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase transition ${
                          u.role === 'admin' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {u.role} (Toggle)
                      </button>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${u.status === 'Banned' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {u.status || 'Active'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-900 font-bold">{u.trips_count}</td>
                    <td className="p-3 text-right flex items-center justify-end gap-2">
                      <Button
                        onClick={() => handleToggleStatus(u.id, u.status || 'Active')}
                        variant="outline"
                        size="sm"
                        className={u.status === 'Banned' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200'}
                      >
                        {u.status === 'Banned' ? 'Reactivate' : 'Ban User'}
                      </Button>

                      <button
                        onClick={() => handleDeleteUser(u.id, u.full_name)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50"
                        title="Purge Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: TRIP MODERATION DIRECTORY */}
      {activeTab === 'trips' && (
        <Card className="bg-white border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="font-bold text-slate-900 text-sm">Trip Moderation Directory ({tripsList.length})</h3>
            
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter by trip title or author..."
                value={tripSearch}
                onChange={(e) => setTripSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchTrips()}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-extrabold border-b border-slate-200">
                <tr>
                  <th className="p-3">Trip Title</th>
                  <th className="p-3">Author</th>
                  <th className="p-3">Cities</th>
                  <th className="p-3">Visibility</th>
                  <th className="p-3">Budget</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {tripsList.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-900">{t.title}</td>
                    <td className="p-3 text-slate-500">{t.author_name}</td>
                    <td className="p-3 font-bold text-sky-600">{t.cities_count || 1} Cities</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleTripVisibility(t.id, t.visibility)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          t.visibility === 'Public' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {t.visibility} (Toggle)
                      </button>
                    </td>
                    <td className="p-3 font-bold text-emerald-600">₹{(t.estimated_budget || 0).toLocaleString()}</td>
                    <td className="p-3 text-right flex items-center justify-end gap-2">
                      <Link
                        href={`/trips/${t.id}`}
                        className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                        title="View Itinerary"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      <button
                        onClick={() => handleDeleteTrip(t.id, t.title)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                        title="Delete Trip"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 4: DESTINATION & ACTIVITY CATALOG MANAGEMENT */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Global Destination Catalog ({citiesList.length} Cities)</h3>
            
            <div className="flex items-center gap-2">
              <Button onClick={() => setShowAddCityModal(true)} variant="default" size="sm" className="gap-1 font-bold">
                <Plus className="w-4 h-4" /> Add New City
              </Button>
              <Button onClick={() => setShowAddActModal(true)} variant="secondary" size="sm" className="gap-1 font-bold">
                <Plus className="w-4 h-4" /> Add New Activity
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {citiesList.map((city) => (
              <Card key={city.id} className="bg-white border-slate-200 rounded-3xl overflow-hidden p-4 space-y-3 shadow-sm">
                <div className="h-36 rounded-2xl overflow-hidden relative">
                  <img src={city.image_url} alt={city.name} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[11px] font-bold text-amber-600">
                    ★ {city.popularity_score}
                  </div>
                </div>

                <div>
                  <div className="font-extrabold text-slate-900 text-base">{city.name}</div>
                  <div className="text-xs text-slate-500">{city.country_name} • ₹{city.avg_daily_cost}/day</div>
                </div>
              </Card>
            ))}
          </div>

        </div>
      )}

      {/* ADD CITY MODAL */}
      {showAddCityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Add New Destination City</h3>
            
            <form onSubmit={handleAddCity} className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1 font-semibold">City Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Varanasi, Shimla, Dubai"
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500 block mb-1 font-semibold">Country Name *</label>
                  <input
                    type="text"
                    required
                    value={cityCountry}
                    onChange={(e) => setCityCountry(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1 font-semibold">Avg Daily Budget (₹)</label>
                  <input
                    type="number"
                    value={cityBudget}
                    onChange={(e) => setCityBudget(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1 font-semibold">Cover Image URL</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={cityImage}
                  onChange={(e) => setCityImage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1 font-semibold">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief travel introduction..."
                  value={cityDesc}
                  onChange={(e) => setCityDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" onClick={() => setShowAddCityModal(false)} variant="ghost" size="sm">
                  Cancel
                </Button>
                <Button type="submit" variant="default" size="sm">
                  Save Destination
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD ACTIVITY MODAL */}
      {showAddActModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Add New Activity to Catalog</h3>
            
            <form onSubmit={handleAddActivity} className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1 font-semibold">Destination City *</label>
                <select
                  value={actCityId}
                  onChange={(e) => setActCityId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none"
                >
                  {citiesList.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.country_name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1 font-semibold">Activity Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hot Air Balloon Ride"
                  value={actName}
                  onChange={(e) => setActName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500 block mb-1 font-semibold">Category</label>
                  <select
                    value={actCategory}
                    onChange={(e) => setActCategory(e.target.value)}
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
                  <label className="text-xs text-slate-500 block mb-1 font-semibold">Estimated Cost (₹)</label>
                  <input
                    type="number"
                    value={actCost}
                    onChange={(e) => setActCost(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" onClick={() => setShowAddActModal(false)} variant="ghost" size="sm">
                  Cancel
                </Button>
                <Button type="submit" variant="default" size="sm">
                  Save Activity
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
