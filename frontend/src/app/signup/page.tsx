'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Compass, User, Mail, Lock, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signup(fullName, email, password);
      toast.success('Account created successfully! Welcome to GlobeTrotter ✈️');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl space-y-6 relative">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 p-0.5 mx-auto shadow-md">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
              <Compass className="w-7 h-7 text-sky-500" />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Create Account</h2>
          <p className="text-xs text-slate-500">Join GlobeTrotter to build intelligent travel itineraries</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Manan Patel"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="manan@globetrotter.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Confirm Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            variant="gradient"
            size="lg"
            className="w-full gap-2 font-bold shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
          </Button>
        </form>

        <div className="text-center text-xs text-slate-500 font-medium">
          Already have an account?{' '}
          <Link href="/login" className="text-sky-600 font-bold hover:underline">
            Sign In
          </Link>
        </div>

      </Card>
    </div>
  );
}
