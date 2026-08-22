'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, MapPin, Search, Sparkles, User, Plus } from 'lucide-react';

export default function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Compass },
    { href: '/trips', label: 'My Trips', icon: MapPin },
    { href: '/explore', label: 'Explore', icon: Search },
    { href: '/templates', label: 'Templates', icon: Sparkles },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-nav border-t border-slate-200/80 px-4 py-2 flex items-center justify-around shadow-lg">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 text-[11px] font-bold transition ${
              isActive ? 'text-sky-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}
      
      {/* Floating Plus CTA on Mobile */}
      <Link
        href="/trips/new"
        className="fixed bottom-16 right-4 w-12 h-12 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/30 active:scale-95 transition"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  );
}
