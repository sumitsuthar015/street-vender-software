import React, { useState } from 'react';
import { X, Store, ArrowRight } from 'lucide-react';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export const LoginModal = ({ isOpen, onClose, onLoginSuccess, standalone = false }) => {
  const { loginWithToken } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [demoOtp, setDemoOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const reset = () => { setEmail(''); setOtp(''); setSent(false); setError(''); };

  const requestOtp = async (event) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address.');
    try {
      setLoading(true);
      setError('');
      const res = await authService.requestEmailOTP(email, undefined);
      if (res.success) {
        setSent(true);
        setDemoOtp(res.data?.demoOtp || '');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError('');
      const res = await authService.verifyEmailOTP(email, otp);
      if (res.success) {
        loginWithToken(res.data.token, res.data.user, res.data.vendor);
        onLoginSuccess?.();
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={standalone ? undefined : onClose} className="fixed inset-0 bg-slate-900/60" />
      <div className="relative z-10 w-full max-w-md space-y-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
        {!standalone && (
          <button onClick={onClose} className="absolute right-5 top-5 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Vendor Login</h3>
            <p className="text-xs text-slate-500">Sign in with your registered email &amp; OTP</p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        {!sent ? (
          <form onSubmit={requestOtp} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Registered vendor email address"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs"
            />
            <button
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 py-3 text-xs font-extrabold text-white shadow-md hover:from-orange-700 hover:to-amber-700 transition"
            >
              {loading ? 'Sending OTP...' : 'Send OTP Code'}
              <ArrowRight className="inline ml-1 w-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              OTP sent to {email}
              {demoOtp && <div>Demo OTP: <strong>{demoOtp}</strong></div>}
            </div>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-center text-lg font-bold"
            />
            <button
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 py-3 text-xs font-extrabold text-white"
            >
              {loading ? 'Verifying...' : 'Verify OTP & Login'}
            </button>
            <button
              type="button"
              onClick={reset}
              className="w-full text-xs font-bold text-slate-400"
            >
              Change Email Address
            </button>
          </form>
        )}

        <div className="border-t pt-3 text-center text-xs text-slate-500">
          No vendor account?{' '}
          <Link to="/vendor/register" onClick={onClose} className="font-bold text-orange-600 hover:underline">
            Register your stall
          </Link>
        </div>
      </div>
    </div>
  );
};
