'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Compass, Plus, Bell, User as UserIcon, LogOut, ShieldCheck, MapPin, Bookmark, Sparkles, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { Button } from './ui/button';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await apiRequest<{ notifications: any[]; unread_count: number }>('/notifications');
      setNotifications(res.notifications);
      setUnreadCount(res.unread_count);
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await apiRequest('/notifications/all/read', { method: 'PATCH' });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-40 glass-nav border-b border-slate-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-blue-600 to-amber-500 p-0.5 shadow-md group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <Compass className="w-6 h-6 text-sky-500 group-hover:rotate-45 transition-transform duration-500" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                Globe<span className="text-sky-500">Trotter</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-sky-600 font-bold -mt-1">
                Intelligent Travel
              </span>
            </div>
          </Link>



          {/* Main Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link href="/dashboard" className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition">
              Dashboard
            </Link>
            <Link href="/trips" className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition">
              My Trips
            </Link>
            <Link href="/explore" className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition">
              Explore
            </Link>
            <Link href="/templates" className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition">
              Templates
            </Link>
            {user?.role === 'admin' && (
              <Link href="/admin" className="px-3 py-2 text-xs font-bold text-amber-600 hover:text-amber-700 rounded-xl hover:bg-amber-50 transition flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Admin
              </Link>
            )}
          </nav>

          {/* Right Action CTA & User Menu */}
          <div className="flex items-center gap-3">
            {/* Primary "+ Plan New Trip" CTA (Shadcn UI Button) */}
            <Link href="/trips/new" className="hidden sm:inline-flex">
              <Button variant="gradient" size="default" className="gap-1.5 shadow-sky-500/20">
                <Plus className="w-4 h-4" />
                <span>Plan New Trip</span>
              </Button>
            </Link>

            {user ? (
              <>
                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifs(!showNotifs)}
                    className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full relative transition"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse ring-2 ring-white" />
                    )}
                  </button>

                  {/* Notifications Popover */}
                  {showNotifs && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <span className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                          <Bell className="w-4 h-4 text-sky-500" /> Notifications
                        </span>
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="text-xs text-sky-600 font-semibold hover:underline flex items-center gap-1">
                            <Check className="w-3 h-3" /> Mark all read
                          </button>
                        )}
                      </div>

                      <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto mt-2">
                        {notifications.length === 0 ? (
                          <div className="text-center py-6 text-slate-400 text-xs">
                            No recent notifications ✈️
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => {
                                setShowNotifs(false);
                                if (n.link_url) router.push(n.link_url);
                              }}
                              className={`p-3 text-xs cursor-pointer rounded-xl hover:bg-slate-50 transition ${!n.is_read ? 'bg-sky-50/80 border-l-2 border-sky-500' : ''}`}
                            >
                              <div className="font-semibold text-slate-800 mb-0.5">{n.title}</div>
                              <div className="text-slate-600 leading-relaxed">{n.message}</div>
                              <div className="text-[10px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Menu Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 border border-slate-200 transition"
                  >
                    <img
                      src={user.profile_photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                      alt={user.full_name}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-sky-500/30"
                    />
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50">
                      <div className="px-3 py-2 border-b border-slate-100 mb-1">
                        <div className="font-bold text-slate-900 text-sm truncate">{user.full_name}</div>
                        <div className="text-xs text-slate-500 truncate">{user.email}</div>
                      </div>

                      <Link
                        href="/profile"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition"
                      >
                        <UserIcon className="w-4 h-4 text-sky-500" /> My Profile & Badges
                      </Link>

                      <Link
                        href="/trips"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition"
                      >
                        <MapPin className="w-4 h-4 text-amber-500" /> My Trips
                      </Link>

                      <Link
                        href="/explore"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition"
                      >
                        <Bookmark className="w-4 h-4 text-indigo-500" /> Saved Destinations
                      </Link>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          logout();
                          router.push('/login');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition mt-1"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button variant="default" size="sm">Create Account</Button>
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
