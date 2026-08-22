'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Compass, Mail, Lock, LogIn, KeyRound, Sparkles, ArrowRight, RefreshCw, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { PasswordRequirementsChecklist, checkPasswordComplexity } from '../../components/PasswordRequirementsChecklist';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password OTP Modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [otpStep, setOtpStep] = useState<'request' | 'verify' | 'reset' | 'success'>('request');
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const resetPasswordStatus = checkPasswordComplexity(newPassword);

  // Resend cooldown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

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

  // Step 1: Request OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!forgotEmail) {
      setModalError('Please enter your email address');
      return;
    }

    setModalLoading(true);
    setModalError('');
    try {
      const res = await apiRequest<{ message: string; simulated_otp?: string; retryAfterSeconds?: number }>('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email: forgotEmail })
      });

      if (res.simulated_otp) {
        setSimulatedOtp(res.simulated_otp);
      }
      setOtpStep('verify');
      setResendCooldown(60);
      toast.success('6-digit OTP code sent to your email');
    } catch (err: any) {
      setModalError(err.message || 'Failed to send OTP');
      if (err.retryAfterSeconds) {
        setResendCooldown(err.retryAfterSeconds);
      }
    } finally {
      setModalLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setModalError('Please enter valid 6-digit OTP code');
      return;
    }

    setModalLoading(true);
    setModalError('');
    try {
      const res = await apiRequest<{ verified: boolean; reset_token: string; message: string }>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email: forgotEmail, otp_code: otpCode })
      });

      setResetToken(res.reset_token);
      setOtpStep('reset');
      toast.success('OTP verified successfully!');
    } catch (err: any) {
      setModalError(err.message || 'Invalid or expired OTP code');
    } finally {
      setModalLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordStatus.isValid) {
      setModalError('Password does not meet industry security requirements');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setModalError('Passwords do not match');
      return;
    }

    setModalLoading(true);
    setModalError('');
    try {
      await apiRequest<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email: forgotEmail,
          otp_code: otpCode,
          reset_token: resetToken,
          new_password: newPassword
        })
      });

      setOtpStep('success');
      toast.success('Password reset successfully!');
      setEmail(forgotEmail);
    } catch (err: any) {
      setModalError(err.message || 'Failed to reset password');
    } finally {
      setModalLoading(false);
    }
  };

  const resetModalState = () => {
    setShowForgotModal(false);
    setOtpStep('request');
    setModalError('');
    setOtpCode('');
    setSimulatedOtp(null);
    setNewPassword('');
    setConfirmNewPassword('');
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
              onClick={() => handleDemoFill('manan@globetrotter.com', 'Demo12345!')}
              className="bg-white hover:bg-slate-100 text-slate-800 py-2 px-2.5 rounded-xl text-[11px] font-bold border border-slate-200 transition text-left shadow-sm"
            >
              👤 Manan (User)
            </button>
            <button
              onClick={() => handleDemoFill('admin@globetrotter.com', 'Admin12345!')}
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
                onClick={() => {
                  setForgotEmail(email);
                  setShowForgotModal(true);
                }}
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
      </Card>

      {/* Multi-Step OTP Reset Password Modal - Full Viewport Backdrop */}
      {showForgotModal && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-5 my-auto max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-extrabold text-slate-900 text-base">
                <KeyRound className="w-5 h-5 text-sky-500" /> Reset Password with OTP
              </div>
              <button
                onClick={resetModalState}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Steps Indicator */}
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-2">
              <span className={otpStep === 'request' ? 'text-sky-600 underline underline-offset-4' : 'text-emerald-600'}>1. Email</span>
              <span>→</span>
              <span className={otpStep === 'verify' ? 'text-sky-600 underline underline-offset-4' : otpStep === 'reset' || otpStep === 'success' ? 'text-emerald-600' : ''}>2. 6-Digit OTP</span>
              <span>→</span>
              <span className={otpStep === 'reset' ? 'text-sky-600 underline underline-offset-4' : otpStep === 'success' ? 'text-emerald-600' : ''}>3. New Password</span>
            </div>

            {/* Error Alert */}
            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Step 1: Request OTP */}
            {otpStep === 'request' && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Enter your registered email address. We will generate and send a rate-limited 6-digit OTP code valid for 15 minutes.
                </p>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="name@globetrotter.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-900 outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" onClick={resetModalState} variant="ghost" size="sm">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={modalLoading} variant="default" size="sm" className="gap-1.5 font-bold">
                    <span>{modalLoading ? 'Sending OTP...' : 'Send 6-Digit OTP'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            )}

            {/* Step 2: Verify OTP Code */}
            {otpStep === 'verify' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <p className="text-xs text-slate-500">
                  A 6-digit OTP was sent to <strong className="text-slate-800">{forgotEmail}</strong>. Enter the code below to verify your identity.
                </p>

                {/* Local Dev Simulated OTP Banner (Only shown when SMTP is unconfigured) */}
                {simulatedOtp && (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl font-medium space-y-1">
                    <div className="flex items-center justify-between font-bold text-amber-700">
                      <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> Dev Mode OTP Preview:</span>
                      <span className="text-[10px] bg-amber-200/60 text-amber-800 px-2 py-0.5 rounded-full">Local Testing</span>
                    </div>
                    <p className="text-[11px] text-amber-800/80">
                      To send real emails to inboxes, add <code>SMTP_HOST</code> & <code>SMTP_PASS</code> in <code>backend/.env</code>.
                    </p>
                    <div className="text-lg font-mono font-extrabold tracking-widest text-amber-900 bg-white/90 py-1 px-3 rounded-lg border border-amber-300 inline-block mt-1">
                      {simulatedOtp}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">6-Digit Verification Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-[0.5em] text-lg font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || modalLoading}
                    onClick={() => handleSendOtp()}
                    className="text-sky-600 hover:underline font-bold flex items-center gap-1 disabled:opacity-50 disabled:no-underline"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${modalLoading ? 'animate-spin' : ''}`} />
                    {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend Code'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setOtpStep('request')}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    Change Email
                  </button>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" onClick={resetModalState} variant="ghost" size="sm">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={modalLoading || otpCode.length < 6} variant="default" size="sm" className="font-bold">
                    {modalLoading ? 'Verifying...' : 'Verify OTP'}
                  </Button>
                </div>
              </form>
            )}

            {/* Step 3: Reset Password */}
            {otpStep === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-xs text-slate-500">
                  OTP code verified! Set your new account password following industry security standards.
                </p>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="e.g. Secret123!"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-900 outline-none focus:border-sky-500"
                  />
                </div>

                {/* Industry Standard Password Requirements Checklist */}
                <PasswordRequirementsChecklist password={newPassword} />

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Re-enter new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-900 outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" onClick={resetModalState} variant="ghost" size="sm">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={modalLoading || !resetPasswordStatus.isValid || newPassword !== confirmNewPassword}
                    variant="gradient"
                    size="sm"
                    className="font-bold disabled:opacity-50"
                  >
                    {modalLoading ? 'Updating...' : 'Reset Password'}
                  </Button>
                </div>
              </form>
            )}

            {/* Step 4: Success */}
            {otpStep === 'success' && (
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Password Reset Complete!</h3>
                  <p className="text-xs text-slate-500 mt-1">Your password has been successfully updated. You can now log in with your new credentials.</p>
                </div>
                <Button onClick={resetModalState} variant="gradient" className="w-full font-bold">
                  Back to Sign In
                </Button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
