'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, TrendingUp, BarChart2 } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

export default function AdminDashboardPage() {
  const [adminData, setAdminData] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [dashRes, usersRes] = await Promise.all([
        apiRequest<any>('/admin/dashboard'),
        apiRequest<any[]>('/admin/users')
      ]);

      setAdminData(dashRes);
      setUsersList(usersRes);
    } catch (err: any) {
      toast.error('Failed to load admin telemetry');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-xs animate-pulse">Loading Admin Control Portal...</div>;
  }

  if (!adminData) return null;

  const COLORS = ['#0284c7', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <div className="flex items-center justify-between bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <Badge variant="warning" className="gap-1 font-bold">
            <ShieldCheck className="w-4 h-4" /> Admin Operations Control
          </Badge>
          <h1 className="text-2xl font-extrabold text-slate-900">GlobeTrotter Platform Analytics</h1>
          <p className="text-xs text-slate-500">System metrics, user registrations, trip creation volume, and destination trends</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-5 border-slate-200 shadow-sm bg-white space-y-1">
          <div className="text-slate-500 text-xs font-semibold">Total Registered Users</div>
          <div className="text-2xl font-extrabold text-slate-900">{adminData.kpis?.total_users}</div>
          <div className="text-[11px] text-emerald-600 font-bold">+100% active</div>
        </Card>

        <Card className="p-5 border-slate-200 shadow-sm bg-white space-y-1">
          <div className="text-slate-500 text-xs font-semibold">Total Trips Created</div>
          <div className="text-2xl font-extrabold text-sky-600">{adminData.kpis?.total_trips}</div>
          <div className="text-[11px] text-slate-500">Platform total</div>
        </Card>

        <Card className="p-5 border-slate-200 shadow-sm bg-white space-y-1">
          <div className="text-slate-500 text-xs font-semibold">Shared Public Trips</div>
          <div className="text-2xl font-extrabold text-emerald-600">{adminData.kpis?.shared_trips}</div>
          <div className="text-[11px] text-slate-500">Public itineraries</div>
        </Card>

        <Card className="p-5 border-slate-200 shadow-sm bg-white space-y-1">
          <div className="text-slate-400 text-xs font-semibold">Avg Trip Budget</div>
          <div className="text-2xl font-extrabold text-amber-600">₹{adminData.kpis?.avg_trip_budget?.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500">Average target</div>
        </Card>

        <Card className="p-5 border-slate-200 shadow-sm bg-white space-y-1">
          <div className="text-slate-500 text-xs font-semibold">Active Destinations</div>
          <div className="text-2xl font-extrabold text-indigo-600">12 Cities</div>
          <div className="text-[11px] text-slate-500">Across 5 countries</div>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Trips Created Trend */}
        <Card className="bg-white border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-500" /> Trips Created Over Time
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={adminData.trips_created_trend}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip />
                <Bar dataKey="trips" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Activity Category Distribution */}
        <Card className="bg-white border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-amber-500" /> Activity Categories Distribution
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={adminData.activity_category_breakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="category"
                >
                  {adminData.activity_category_breakdown?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

      </div>

      {/* Users Management Table */}
      <Card className="bg-white border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">User Directory & Management</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-extrabold border-b border-slate-200">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Trips Created</th>
                <th className="p-3">Joined Date</th>
                <th className="p-3 text-right">Status / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {usersList.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-bold text-slate-900">{u.full_name}</td>
                  <td className="p-3 text-slate-500">{u.email}</td>
                  <td className="p-3">
                    <Badge variant={u.role === 'admin' ? 'warning' : 'default'}>{u.role}</Badge>
                  </td>
                  <td className="p-3 text-slate-900 font-bold">{u.trips_count}</td>
                  <td className="p-3 text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="p-3 text-right">
                    <Button
                      onClick={() => toast.success(`User status updated for ${u.full_name}`)}
                      variant="outline"
                      size="sm"
                      className="text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 font-bold"
                    >
                      Active
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}
