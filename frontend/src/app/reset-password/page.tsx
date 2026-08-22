'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Compass, Mail, Lock, KeyRound, CheckCircle2, AlertTriangle, ArrowLeft, X } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { PasswordRequirementsChecklist, checkPasswordComplexity } from '../../components/PasswordRequirementsChecklist';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const otpParam = searchParams.get('otp') || searchParams.get('code');
    if (emailParam) setEmail(emailParam);
    if (otpParam) setOtpCode(otpParam);
  }, [searchParams]);

  const passwordStatus = checkPasswordComplexity(newPassword);
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otpCode || !newPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (!passwordStatus.isValid) {
      setError('Password does not meet industry security requirements');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiRequest<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email,
          otp_code: otpCode,
          new_password: newPassword
        })
      });

      setSuccess(true);
      toast.success('Password reset successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please check your OTP code.');
      toast.error(err.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center space-y-5">
        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Password Reset Successful!</h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Your password has been updated. You can now sign in with your new password.
          </p>
        </div>
        <Button onClick={() => router.push('/login')} variant="gradient" size="lg" className="w-full font-bold shadow-md">
          Go to Sign In
        </Button>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-8 shadow-xl space-y-6 relative">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 p-0.5 mx-auto shadow-md">
          <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
            <Compass className="w-7 h-7 text-sky-500" />
          </div>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">Reset Your Password</h2>
        <p className="text-xs text-slate-500">Enter your email, 6-digit OTP, and new password</p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-900 outline-none transition"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">6-Digit OTP Code</label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              maxLength={6}
              required
              placeholder="123456"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono font-bold text-slate-900 outline-none transition"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">New Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              placeholder="e.g. Secret123!"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-900 outline-none transition"
            />
          </div>

          {/* Industry Standard Password Requirements Checklist */}
          <PasswordRequirementsChecklist password={newPassword} />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Confirm New Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-900 outline-none transition"
            />
          </div>
          {confirmPassword.length > 0 && !isMatch && (
            <p className="text-[11px] text-rose-500 mt-1 font-medium flex items-center gap-1">
              <X className="w-3 h-3" /> Passwords do not match
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={loading || !passwordStatus.isValid || !isMatch || otpCode.length < 6}
          variant="gradient"
          size="lg"
          className="w-full gap-2 font-bold shadow-md disabled:opacity-50"
        >
          <KeyRound className="w-4 h-4" />
          <span>{loading ? 'Resetting Password...' : 'Reset Password'}</span>
        </Button>
      </form>

      <div className="text-center text-xs text-slate-500 font-medium pt-2">
        <Link href="/login" className="text-sky-600 font-bold hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>
      </div>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-xs text-slate-400">Loading reset form...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
