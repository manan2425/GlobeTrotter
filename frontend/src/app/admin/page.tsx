'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck, TrendingUp, BarChart2, Users, MapPin, Search, Plus,
  Trash2, Eye, Globe, Lock, CheckCircle2, Ban, Layers, Building2,
  Sparkles, Compass, AlertCircle, Edit, Flag, LayoutTemplate
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'trips' | 'cities' | 'templates' | 'countries'>('overview');

  // Stats & Entities State
  const [adminData, setAdminData] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [tripsList, setTripsList] = useState<any[]>([]);
  const [citiesList, setCitiesList] = useState<any[]>([]);
  const [templatesList, setTemplatesList] = useState<any[]>([]);
  const [countriesList, setCountriesList] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  // Search Filters
  const [userSearch, setUserSearch] = useState('');
  const [tripSearch, setTripSearch] = useState('');

  // --- MODAL STATES FOR CREATE & EDIT ---

  // 1. User Modal State
  const [showUserModal, setShowUserModal] = useState(false);
  const [userEditId, setUserEditId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({ full_name: '', email: '', password: '', role: 'user', status: 'Active' });

  // 2. Trip Modal State
  const [showTripModal, setShowTripModal] = useState(false);
  const [tripEditId, setTripEditId] = useState<string | null>(null);
  const [tripForm, setTripForm] = useState({ title: '', description: '', start_date: '2026-10-01', end_date: '2026-10-07', estimated_budget: '35000', visibility: 'Private', status: 'Upcoming' });

  // 3. City Modal State
  const [showCityModal, setShowCityModal] = useState(false);
  const [cityEditId, setCityEditId] = useState<string | null>(null);
  const [cityForm, setCityForm] = useState({ name: '', country_name: 'India', region: 'Asia', avg_daily_cost: '3500', popularity_score: '4.5', image_url: '', description: '' });

  // 4. Template Modal State
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [tmplEditId, setTmplEditId] = useState<string | null>(null);
  const [tmplForm, setTmplForm] = useState({ title: '', description: '', category: 'Heritage', duration_days: '5', estimated_budget: '28000', cover_image: '' });

  // 5. Country Modal State
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [cntryEditId, setCntryEditId] = useState<string | null>(null);
  const [cntryForm, setCntryForm] = useState({ name: '', code: '', currency: 'INR', region: 'Asia' });

  useEffect(() => {
    fetchAdminOverview();
    fetchUsers();
    fetchTrips();
    fetchCities();
    fetchTemplates();
    fetchCountries();
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

  const fetchCities = async () => {
    try {
      const data = await apiRequest<any[]>('/destinations');
      setCitiesList(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const data = await apiRequest<any[]>('/admin/templates');
      setTemplatesList(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCountries = async () => {
    try {
      const data = await apiRequest<any[]>('/admin/countries');
      setCountriesList(data);
    } catch (err) {
      console.error(err);
    }
  };

  /* ==========================================================================
     1. USER CRUD HANDLERS
     ========================================================================== */
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (userEditId) {
        await apiRequest(`/admin/users/${userEditId}`, {
          method: 'PUT',
          body: JSON.stringify(userForm)
        });
        toast.success('User updated successfully');
      } else {
        await apiRequest('/admin/users', {
          method: 'POST',
          body: JSON.stringify(userForm)
        });
        toast.success('User account created!');
      }
      setShowUserModal(false);
      fetchUsers();
      fetchAdminOverview();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save user');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Purge user account for "${userName}"?`)) return;
    try {
      await apiRequest(`/admin/users/${userId}`, { method: 'DELETE' });
      toast.success('User purged');
      fetchUsers();
      fetchAdminOverview();
    } catch (err: any) {
      toast.error('Failed to purge user');
    }
  };

  /* ==========================================================================
     2. TRIP CRUD HANDLERS
     ========================================================================== */
  const handleSaveTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (tripEditId) {
        await apiRequest(`/admin/trips/${tripEditId}`, {
          method: 'PUT',
          body: JSON.stringify(tripForm)
        });
        toast.success('Trip updated successfully');
      } else {
        await apiRequest('/admin/trips', {
          method: 'POST',
          body: JSON.stringify(tripForm)
        });
        toast.success('Trip created successfully!');
      }
      setShowTripModal(false);
      fetchTrips();
      fetchAdminOverview();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save trip');
    }
  };

  const handleDeleteTrip = async (tripId: string, title: string) => {
    if (!confirm(`Delete trip "${title}"?`)) return;
    try {
      await apiRequest(`/admin/trips/${tripId}`, { method: 'DELETE' });
      toast.success('Trip deleted');
      fetchTrips();
      fetchAdminOverview();
    } catch (err: any) {
      toast.error('Failed to delete trip');
    }
  };

  /* ==========================================================================
     3. CITY CRUD HANDLERS
     ========================================================================== */
  const handleSaveCity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (cityEditId) {
        await apiRequest(`/admin/cities/${cityEditId}`, {
          method: 'PUT',
          body: JSON.stringify(cityForm)
        });
        toast.success('City updated successfully');
      } else {
        await apiRequest('/admin/cities', {
          method: 'POST',
          body: JSON.stringify(cityForm)
        });
        toast.success('City created successfully!');
      }
      setShowCityModal(false);
      fetchCities();
      fetchAdminOverview();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save city');
    }
  };

  const handleDeleteCity = async (cityId: string, cityName: string) => {
    if (!confirm(`Delete city "${cityName}"?`)) return;
    try {
      await apiRequest(`/admin/cities/${cityId}`, { method: 'DELETE' });
      toast.success('City deleted');
      fetchCities();
      fetchAdminOverview();
    } catch (err: any) {
      toast.error('Failed to delete city');
    }
  };

  /* ==========================================================================
     4. TEMPLATE CRUD HANDLERS
     ========================================================================== */
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (tmplEditId) {
        await apiRequest(`/admin/templates/${tmplEditId}`, {
          method: 'PUT',
          body: JSON.stringify(tmplForm)
        });
        toast.success('Template updated successfully');
      } else {
        await apiRequest('/admin/templates', {
          method: 'POST',
          body: JSON.stringify(tmplForm)
        });
        toast.success('Template created!');
      }
      setShowTemplateModal(false);
      fetchTemplates();
      fetchAdminOverview();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save template');
    }
  };

  const handleDeleteTemplate = async (tmplId: string, title: string) => {
    if (!confirm(`Delete template "${title}"?`)) return;
    try {
      await apiRequest(`/admin/templates/${tmplId}`, { method: 'DELETE' });
      toast.success('Template deleted');
      fetchTemplates();
      fetchAdminOverview();
    } catch (err: any) {
      toast.error('Failed to delete template');
    }
  };

  /* ==========================================================================
     5. COUNTRY CRUD HANDLERS
     ========================================================================== */
  const handleSaveCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (cntryEditId) {
        await apiRequest(`/admin/countries/${cntryEditId}`, {
          method: 'PUT',
          body: JSON.stringify(cntryForm)
        });
        toast.success('Country updated');
      } else {
        await apiRequest('/admin/countries', {
          method: 'POST',
          body: JSON.stringify(cntryForm)
        });
        toast.success('Country added!');
      }
      setShowCountryModal(false);
      fetchCountries();
      fetchAdminOverview();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save country');
    }
  };

  const handleDeleteCountry = async (cntryId: string, name: string) => {
    if (!confirm(`Delete country "${name}"?`)) return;
    try {
      await apiRequest(`/admin/countries/${cntryId}`, { method: 'DELETE' });
      toast.success('Country deleted');
      fetchCountries();
      fetchAdminOverview();
    } catch (err: any) {
      toast.error('Failed to delete country');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-xs animate-pulse">Loading Full Admin Suite...</div>;
  }

  const COLORS = ['#0284c7', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <Badge variant="warning" className="gap-1 font-bold">
            <ShieldCheck className="w-4 h-4 text-amber-600" /> Enterprise Admin Operations Center
          </Badge>
          <h1 className="text-2xl font-extrabold text-slate-900">GlobeTrotter Full CRUD Master Portal</h1>
          <p className="text-xs text-slate-500">Create, Read, Update, and Delete control across Users, Trips, Cities, Activities, Templates & Countries</p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3 py-1.5 rounded-full font-bold">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
          <span>Neon PostgreSQL Active</span>
        </div>
      </div>

      {/* Tab Navigation Strip */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'overview' ? 'bg-sky-500 text-white shadow' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Telemetry Overview
        </button>

        <button
          onClick={() => { setActiveTab('users'); fetchUsers(); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'users' ? 'bg-sky-500 text-white shadow' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" /> Users ({adminData?.kpis?.total_users || 0})
        </button>

        <button
          onClick={() => { setActiveTab('trips'); fetchTrips(); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'trips' ? 'bg-sky-500 text-white shadow' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Compass className="w-4 h-4" /> Trips ({adminData?.kpis?.total_trips || 0})
        </button>

        <button
          onClick={() => { setActiveTab('cities'); fetchCities(); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'cities' ? 'bg-sky-500 text-white shadow' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" /> Cities ({adminData?.kpis?.total_cities || 12})
        </button>

        <button
          onClick={() => { setActiveTab('templates'); fetchTemplates(); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'templates' ? 'bg-sky-500 text-white shadow' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <LayoutTemplate className="w-4 h-4" /> Templates ({templatesList.length})
        </button>

        <button
          onClick={() => { setActiveTab('countries'); fetchCountries(); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'countries' ? 'bg-sky-500 text-white shadow' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Flag className="w-4 h-4" /> Countries ({countriesList.length})
        </button>
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <Card className="p-4 border-slate-200 shadow-sm bg-white">
              <div className="text-slate-500 text-[11px] font-semibold">Total Users</div>
              <div className="text-xl font-extrabold text-slate-900">{adminData?.kpis?.total_users}</div>
            </Card>

            <Card className="p-4 border-slate-200 shadow-sm bg-white">
              <div className="text-slate-500 text-[11px] font-semibold">Total Trips</div>
              <div className="text-xl font-extrabold text-sky-600">{adminData?.kpis?.total_trips}</div>
            </Card>

            <Card className="p-4 border-slate-200 shadow-sm bg-white">
              <div className="text-slate-500 text-[11px] font-semibold">Public Trips</div>
              <div className="text-xl font-extrabold text-emerald-600">{adminData?.kpis?.shared_trips}</div>
            </Card>

            <Card className="p-4 border-slate-200 shadow-sm bg-white">
              <div className="text-slate-500 text-[11px] font-semibold">Cities Catalog</div>
              <div className="text-xl font-extrabold text-indigo-600">{adminData?.kpis?.total_cities}</div>
            </Card>

            <Card className="p-4 border-slate-200 shadow-sm bg-white">
              <div className="text-slate-500 text-[11px] font-semibold">Templates</div>
              <div className="text-xl font-extrabold text-amber-600">{adminData?.kpis?.total_templates || templatesList.length}</div>
            </Card>

            <Card className="p-4 border-slate-200 shadow-sm bg-white">
              <div className="text-slate-500 text-[11px] font-semibold">Countries</div>
              <div className="text-xl font-extrabold text-rose-600">{adminData?.kpis?.total_countries || countriesList.length}</div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-white border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-500" /> Platform Growth Trend
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

            <Card className="bg-white border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-amber-500" /> Activity Category Breakdown
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={adminData?.activity_category_breakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="count" nameKey="category">
                      {adminData?.activity_category_breakdown?.map((e: any, idx: number) => (
                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
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

      {/* 2. USERS TAB */}
      {activeTab === 'users' && (
        <Card className="bg-white border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="font-bold text-slate-900 text-sm">Users Directory ({usersList.length})</h3>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="Search user..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchUsers()} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-8 pr-3 text-xs outline-none" />
              </div>
              <Button onClick={() => { setUserEditId(null); setUserForm({ full_name: '', email: '', password: '', role: 'user', status: 'Active' }); setShowUserModal(true); }} size="sm" className="gap-1 font-bold">
                <Plus className="w-4 h-4" /> Create User
              </Button>
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
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{u.full_name}</td>
                    <td className="p-3 text-slate-500">{u.email}</td>
                    <td className="p-3 font-extrabold uppercase text-[10px]">{u.role}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.status === 'Banned' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>{u.status || 'Active'}</span></td>
                    <td className="p-3 text-right flex items-center justify-end gap-2">
                      <button onClick={() => { setUserEditId(u.id); setUserForm({ full_name: u.full_name, email: u.email, password: '', role: u.role, status: u.status || 'Active' }); setShowUserModal(true); }} className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteUser(u.id, u.full_name)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
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

      {/* 3. TRIPS TAB */}
      {activeTab === 'trips' && (
        <Card className="bg-white border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="font-bold text-slate-900 text-sm">Trips Directory ({tripsList.length})</h3>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="Filter trips..." value={tripSearch} onChange={(e) => setTripSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchTrips()} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-8 pr-3 text-xs outline-none" />
              </div>
              <Button onClick={() => { setTripEditId(null); setTripForm({ title: '', description: '', start_date: '2026-10-01', end_date: '2026-10-07', estimated_budget: '35000', visibility: 'Private', status: 'Upcoming' }); setShowTripModal(true); }} size="sm" className="gap-1 font-bold">
                <Plus className="w-4 h-4" /> Create Trip
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-extrabold border-b border-slate-200">
                <tr>
                  <th className="p-3">Title</th>
                  <th className="p-3">Author</th>
                  <th className="p-3">Visibility</th>
                  <th className="p-3">Budget</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {tripsList.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{t.title}</td>
                    <td className="p-3 text-slate-500">{t.author_name}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${t.visibility === 'Public' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>{t.visibility}</span></td>
                    <td className="p-3 font-bold text-emerald-600">₹{(t.estimated_budget || 0).toLocaleString()}</td>
                    <td className="p-3 text-right flex items-center justify-end gap-2">
                      <Link href={`/trips/${t.id}`} className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg">
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <button onClick={() => { setTripEditId(t.id); setTripForm({ title: t.title, description: t.description || '', start_date: t.start_date, end_date: t.end_date, estimated_budget: String(t.estimated_budget), visibility: t.visibility, status: t.status }); setShowTripModal(true); }} className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteTrip(t.id, t.title)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
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

      {/* 4. CITIES TAB */}
      {activeTab === 'cities' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Destination Cities Catalog ({citiesList.length})</h3>
            <Button onClick={() => { setCityEditId(null); setCityForm({ name: '', country_name: 'India', region: 'Asia', avg_daily_cost: '3500', popularity_score: '4.5', image_url: '', description: '' }); setShowCityModal(true); }} size="sm" className="gap-1 font-bold">
              <Plus className="w-4 h-4" /> Add New City
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {citiesList.map((c) => (
              <Card key={c.id} className="bg-white border-slate-200 rounded-3xl overflow-hidden p-4 space-y-3 shadow-sm">
                <div className="h-36 rounded-2xl overflow-hidden relative">
                  <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <button onClick={() => { setCityEditId(c.id); setCityForm({ name: c.name, country_name: c.country_name, region: c.region, avg_daily_cost: String(c.avg_daily_cost), popularity_score: String(c.popularity_score), image_url: c.image_url, description: c.description || '' }); setShowCityModal(true); }} className="bg-white/90 p-1.5 rounded-full text-slate-700 hover:text-sky-600">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteCity(c.id, c.name)} className="bg-white/90 p-1.5 rounded-full text-slate-700 hover:text-rose-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 text-base">{c.name}</div>
                  <div className="text-xs text-slate-500">{c.country_name} • ₹{c.avg_daily_cost}/day</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 5. TEMPLATES TAB */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Curated Trip Templates ({templatesList.length})</h3>
            <Button onClick={() => { setTmplEditId(null); setTmplForm({ title: '', description: '', category: 'Heritage', duration_days: '5', estimated_budget: '28000', cover_image: '' }); setShowTemplateModal(true); }} size="sm" className="gap-1 font-bold">
              <Plus className="w-4 h-4" /> Add Template
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {templatesList.map((tmpl) => (
              <Card key={tmpl.id} className="bg-white border-slate-200 rounded-3xl overflow-hidden p-4 space-y-3 shadow-sm">
                <div className="h-36 rounded-2xl overflow-hidden relative">
                  <img src={tmpl.cover_image} alt={tmpl.title} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <button onClick={() => { setTmplEditId(tmpl.id); setTmplForm({ title: tmpl.title, description: tmpl.description, category: tmpl.category, duration_days: String(tmpl.duration_days), estimated_budget: String(tmpl.estimated_budget), cover_image: tmpl.cover_image }); setShowTemplateModal(true); }} className="bg-white/90 p-1.5 rounded-full text-slate-700 hover:text-sky-600">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteTemplate(tmpl.id, tmpl.title)} className="bg-white/90 p-1.5 rounded-full text-slate-700 hover:text-rose-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 text-base">{tmpl.title}</div>
                  <div className="text-xs text-slate-500">{tmpl.duration_days} Days • ₹{tmpl.estimated_budget?.toLocaleString()}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 6. COUNTRIES TAB */}
      {activeTab === 'countries' && (
        <Card className="bg-white border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Supported Countries ({countriesList.length})</h3>
            <Button onClick={() => { setCntryEditId(null); setCntryForm({ name: '', code: '', currency: 'INR', region: 'Asia' }); setShowCountryModal(true); }} size="sm" className="gap-1 font-bold">
              <Plus className="w-4 h-4" /> Add Country
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-extrabold border-b border-slate-200">
                <tr>
                  <th className="p-3">Country</th>
                  <th className="p-3">ISO Code</th>
                  <th className="p-3">Currency</th>
                  <th className="p-3">Region</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {countriesList.map((cntry) => (
                  <tr key={cntry.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{cntry.name}</td>
                    <td className="p-3 font-mono font-bold text-sky-600">{cntry.code}</td>
                    <td className="p-3">{cntry.currency}</td>
                    <td className="p-3">{cntry.region}</td>
                    <td className="p-3 text-right flex items-center justify-end gap-2">
                      <button onClick={() => { setCntryEditId(cntry.id); setCntryForm({ name: cntry.name, code: cntry.code, currency: cntry.currency, region: cntry.region }); setShowCountryModal(true); }} className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteCountry(cntry.id, cntry.name)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
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

      {/* --- ALL CREATE & EDIT MODALS --- */}

      {/* 1. User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">{userEditId ? 'Edit User' : 'Create New User Account'}</h3>
            <form onSubmit={handleSaveUser} className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1 font-semibold">Full Name *</label>
                <input type="text" required value={userForm.full_name} onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs outline-none" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1 font-semibold">Email *</label>
                <input type="email" required value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs outline-none" />
              </div>
              {!userEditId && (
                <div>
                  <label className="text-xs text-slate-500 block mb-1 font-semibold">Password *</label>
                  <input type="password" required value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs outline-none" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500 block mb-1 font-semibold">Role</label>
                  <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs outline-none">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1 font-semibold">Status</label>
                  <select value={userForm.status} onChange={(e) => setUserForm({ ...userForm, status: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs outline-none">
                    <option value="Active">Active</option>
                    <option value="Banned">Banned</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" onClick={() => setShowUserModal(false)} variant="ghost" size="sm">Cancel</Button>
                <Button type="submit" size="sm">Save User</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Trip Modal */}
      {showTripModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">{tripEditId ? 'Edit Trip' : 'Create New Trip'}</h3>
            <form onSubmit={handleSaveTrip} className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1 font-semibold">Trip Title *</label>
                <input type="text" required value={tripForm.title} onChange={(e) => setTripForm({ ...tripForm, title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500 block mb-1 font-semibold">Start Date *</label>
                  <input type="date" required value={tripForm.start_date} onChange={(e) => setTripForm({ ...tripForm, start_date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1 font-semibold">End Date *</label>
                  <input type="date" required value={tripForm.end_date} onChange={(e) => setTripForm({ ...tripForm, end_date: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500 block mb-1 font-semibold">Budget (₹)</label>
                  <input type="number" value={tripForm.estimated_budget} onChange={(e) => setTripForm({ ...tripForm, estimated_budget: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1 font-semibold">Visibility</label>
                  <select value={tripForm.visibility} onChange={(e) => setTripForm({ ...tripForm, visibility: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs outline-none">
                    <option value="Private">Private</option>
                    <option value="Public">Public</option>
                    <option value="Friends">Friends</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" onClick={() => setShowTripModal(false)} variant="ghost" size="sm">Cancel</Button>
                <Button type="submit" size="sm">Save Trip</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. City Modal */}
      {showCityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">{cityEditId ? 'Edit City' : 'Add Destination City'}</h3>
            <form onSubmit={handleSaveCity} className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1 font-semibold">City Name *</label>
                <input type="text" required value={cityForm.name} onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500 block mb-1 font-semibold">Country *</label>
                  <input type="text" required value={cityForm.country_name} onChange={(e) => setCityForm({ ...cityForm, country_name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1 font-semibold">Avg Daily Budget (₹)</label>
                  <input type="number" value={cityForm.avg_daily_cost} onChange={(e) => setCityForm({ ...cityForm, avg_daily_cost: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1 font-semibold">Cover Image URL</label>
                <input type="text" value={cityForm.image_url} onChange={(e) => setCityForm({ ...cityForm, image_url: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs outline-none" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" onClick={() => setShowCityModal(false)} variant="ghost" size="sm">Cancel</Button>
                <Button type="submit" size="sm">Save City</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">{tmplEditId ? 'Edit Template' : 'Add Trip Template'}</h3>
            <form onSubmit={handleSaveTemplate} className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1 font-semibold">Template Title *</label>
                <input type="text" required value={tmplForm.title} onChange={(e) => setTmplForm({ ...tmplForm, title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500 block mb-1 font-semibold">Duration (Days)</label>
                  <input type="number" value={tmplForm.duration_days} onChange={(e) => setTmplForm({ ...tmplForm, duration_days: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1 font-semibold">Budget (₹)</label>
                  <input type="number" value={tmplForm.estimated_budget} onChange={(e) => setTmplForm({ ...tmplForm, estimated_budget: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs outline-none" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" onClick={() => setShowTemplateModal(false)} variant="ghost" size="sm">Cancel</Button>
                <Button type="submit" size="sm">Save Template</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Country Modal */}
      {showCountryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">{cntryEditId ? 'Edit Country' : 'Add Country'}</h3>
            <form onSubmit={handleSaveCountry} className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1 font-semibold">Country Name *</label>
                <input type="text" required value={cntryForm.name} onChange={(e) => setCntryForm({ ...cntryForm, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500 block mb-1 font-semibold">ISO Code *</label>
                  <input type="text" required maxLength={3} value={cntryForm.code} onChange={(e) => setCntryForm({ ...cntryForm, code: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs outline-none uppercase" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1 font-semibold">Currency Code</label>
                  <input type="text" value={cntryForm.currency} onChange={(e) => setCntryForm({ ...cntryForm, currency: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs outline-none uppercase" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" onClick={() => setShowCountryModal(false)} variant="ghost" size="sm">Cancel</Button>
                <Button type="submit" size="sm">Save Country</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
