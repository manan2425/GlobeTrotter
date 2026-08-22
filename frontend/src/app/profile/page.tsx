'use client';

import React, { useEffect, useState } from 'react';
import { Award, Settings, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [homeCity, setHomeCity] = useState('');
  const [homeCountry, setHomeCountry] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await apiRequest<any>('/auth/me');
      setProfileData(data);
      setFullName(data.user.full_name || '');
      setBio(data.profile?.bio || '');
      setHomeCity(data.profile?.home_city || '');
      setHomeCountry(data.profile?.home_country || '');
      setCurrency(data.user.currency || 'INR');
      setIsPublic(data.profile?.is_public === 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          full_name: fullName,
          bio,
          home_city: homeCity,
          home_country: homeCountry,
          currency,
          is_public: isPublic
        })
      });
      toast.success('Profile settings updated!');
      refreshUser();
      fetchProfile();
    } catch (err: any) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-xs animate-pulse">Loading Explorer Profile & Badges...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Profile Header Card */}
      <Card className="bg-white border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10 text-center sm:text-left">
          <div className="relative">
            <img
              src={user?.profile_photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
              alt={user?.full_name}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-sky-500/30 shadow-md"
            />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-900">{user?.full_name}</h1>
            <p className="text-xs text-slate-500">{user?.email} • {profileData?.profile?.home_city || 'Ahmedabad'}, {profileData?.profile?.home_country || 'India'}</p>
            <p className="text-xs text-sky-600 font-semibold italic pt-1">{profileData?.profile?.bio || 'Passionate GlobeTrotter explorer!'}</p>
          </div>
        </div>

        {/* Quick Travel Stats Bar */}
        <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Trips Created</div>
            <div className="font-extrabold text-lg text-slate-900">{profileData?.stats?.total_trips || 0}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Cities Visited</div>
            <div className="font-extrabold text-lg text-amber-600">{profileData?.stats?.cities_visited || 4}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Countries Explored</div>
            <div className="font-extrabold text-lg text-indigo-600">{profileData?.stats?.countries_explored || 2}</div>
          </div>
        </div>
      </Card>

      {/* Gamification Travel Achievements Section */}
      <Card className="bg-white border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" /> Travel Achievements & Badges
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profileData?.achievements?.map((ach: any) => (
            <div key={ach.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-start gap-3">
              <div className="text-3xl p-2 bg-white rounded-xl border border-slate-200 shrink-0 shadow-sm">
                {ach.icon}
              </div>
              <div className="space-y-0.5">
                <div className="font-extrabold text-slate-900 text-sm">{ach.title}</div>
                <div className="text-[11px] text-slate-500 leading-relaxed font-medium">{ach.description}</div>
                <div className="text-[10px] text-emerald-600 font-bold pt-1">Unlocked {new Date(ach.unlocked_at).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Profile Settings Form */}
      <Card className="bg-white border-slate-200 p-6 shadow-sm space-y-5">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-sky-500" /> Account & Privacy Settings
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 block mb-1 font-semibold">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-1 font-semibold">Bio / Travel Motto</label>
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 block mb-1 font-semibold">Home City</label>
              <input
                type="text"
                value={homeCity}
                onChange={(e) => setHomeCity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1 font-semibold">Default Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 outline-none font-semibold"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <div className="text-xs font-bold text-slate-800">Public Profile & Public Trips</div>
              <div className="text-[11px] text-slate-500">Allow other travelers to discover your public itineraries</div>
            </div>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
            />
          </div>

          <Button type="submit" disabled={saving} variant="default" size="default" className="gap-1 font-bold">
            <Check className="w-4 h-4" /> Save Profile Settings
          </Button>
        </form>
      </Card>

    </div>
  );
}
