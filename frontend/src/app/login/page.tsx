'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Compass, Mail, Lock, LogIn, KeyRound, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back to GlobeTrotter! ✈️');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;

    try {
      const res = await apiRequest<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: forgotEmail })
      });
      setForgotMessage(res.message);
      toast.success('Password reset email sent');
    } catch (err: any) {
      toast.error(err.message || 'Failed to request reset');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl space-y-6 relative overflow-hidden">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 p-0.5 mx-auto shadow-md">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
              <Compass className="w-7 h-7 text-sky-500" />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Welcome Back</h2>
          <p className="text-xs text-slate-500">Sign in to manage your trips & intelligent itineraries</p>
        </div>

        {/* Quick Demo Login Credentials Buttons */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-2">
          <div className="font-bold text-sky-600 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quick Demo Accounts
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDemoFill('manan@globetrotter.com', 'demo123')}
              className="bg-white hover:bg-slate-100 text-slate-800 py-2 px-2.5 rounded-xl text-[11px] font-bold border border-slate-200 transition text-left shadow-sm"
            >
              👤 Manan (User)
            </button>
            <button
              onClick={() => handleDemoFill('admin@globetrotter.com', 'admin123')}
              className="bg-amber-50 hover:bg-amber-100 text-amber-800 py-2 px-2.5 rounded-xl text-[11px] font-bold border border-amber-200 transition text-left shadow-sm"
            >
              🛡️ Admin
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="name@globetrotter.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">Password</label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-[11px] text-sky-600 hover:underline font-bold"
              >
                Forgot password?
              </button>
            </div>
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

          <Button
            type="submit"
            disabled={loading}
            variant="gradient"
            size="lg"
            className="w-full gap-2 font-bold shadow-md"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </Button>
        </form>

        <div className="text-center text-xs text-slate-500 font-medium">
          Don't have an account?{' '}
          <Link href="/signup" className="text-sky-600 font-bold hover:underline">
            Create Account
          </Link>
        </div>

        {/* Forgot Password Modal */}
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <KeyRound className="w-5 h-5 text-sky-500" /> Reset Password
              </div>
              <p className="text-xs text-slate-500">Enter your registered email address to receive reset instructions.</p>

              {forgotMessage ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium">
                  {forgotMessage}
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-3">
                  <input
                    type="email"
                    required
                    placeholder="name@globetrotter.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <Button type="button" onClick={() => setShowForgotModal(false)} variant="ghost" size="sm">
                      Cancel
                    </Button>
                    <Button type="submit" variant="default" size="sm">
                      Send Instructions
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </Card>
    </div>
  );
}
