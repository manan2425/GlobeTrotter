'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { Compass, Sparkles, MapPin, Shield, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  return (
    <div className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden bg-slate-50">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl space-y-6 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-sky-200 text-sky-600 text-xs font-extrabold shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          <span>Next-Gen AI Travel Planning Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Explore the World with <br />
          <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Personalized Intelligence
          </span>
        </h1>

        <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
          Create multi-city itineraries, estimate daily budgets, visualize routes on interactive maps, optimize travel schedules, and collaborate seamlessly.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link href="/signup">
            <Button variant="gradient" size="lg" className="gap-2 shadow-xl shadow-sky-500/20">
              <span>Start Planning For Free</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          <Link href="/login">
            <Button variant="outline" size="lg" className="font-bold">
              Log In (Demo Account)
            </Button>
          </Link>
        </div>

        {/* Quick Specs Cards */}
        <div className="pt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
          <Card className="p-4 rounded-2xl border-slate-200 bg-white shadow-sm">
            <MapPin className="w-5 h-5 text-sky-500 mb-1" />
            <div className="font-extrabold text-slate-900 text-base">Multi-City</div>
            <div className="text-xs text-slate-500">Drag & Drop Cities</div>
          </Card>
          <Card className="p-4 rounded-2xl border-slate-200 bg-white shadow-sm">
            <Compass className="w-5 h-5 text-amber-500 mb-1" />
            <div className="font-extrabold text-slate-900 text-base">Interactive Map</div>
            <div className="text-xs text-slate-500">Leaflet Route Trails</div>
          </Card>
          <Card className="p-4 rounded-2xl border-slate-200 bg-white shadow-sm">
            <Sparkles className="w-5 h-5 text-indigo-500 mb-1" />
            <div className="font-extrabold text-slate-900 text-base">AI Optimizer</div>
            <div className="text-xs text-slate-500">Route & Budget Savings</div>
          </Card>
          <Card className="p-4 rounded-2xl border-slate-200 bg-white shadow-sm">
            <Shield className="w-5 h-5 text-emerald-500 mb-1" />
            <div className="font-extrabold text-slate-900 text-base">Public Sharing</div>
            <div className="text-xs text-slate-500">Copy Trips Instantly</div>
          </Card>
        </div>

      </div>
    </div>
  );
}
