import React, { useState } from 'react';
import { X, Smartphone, ArrowRight } from 'lucide-react';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const CustomerLoginModal = ({ isOpen, onClose }) => {
  const { loginWithToken } = useAuth();
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [demoOtp, setDemoOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const reset = () => {
    setMobile('');
    setOtp('');
    setSent(false);
    setDemoOtp('');
    setError('');
  };

  const requestOtp = async (event) => {
    event.preventDefault();
    if (!/^\d{10}$/.test(mobile)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await authService.requestMobileOTP(mobile);
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
      const res = await authService.verifyMobileOTP(mobile, otp);
      if (res.success) {
        loginWithToken(res.data.token, res.data.user, res.data.vendor);
        reset();
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
      <div onClick={onClose} className="fixed inset-0 bg-slate-900/60" />
      <div className="relative z-10 w-full max-w-md space-y-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
        <button onClick={onClose} className="absolute right-5 top-5 text-slate-400">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center shadow">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Customer Login</h3>
            <p className="text-xs text-slate-500">Sign in with your mobile number</p>
          </div>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div>}

        {!sent ? (
          <form onSubmit={requestOtp} className="space-y-3">
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile number"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs"
            />
            <button disabled={loading} className="w-full rounded-xl bg-orange-600 py-3 text-xs font-extrabold text-white shadow-md">
              {loading ? 'Sending OTP...' : 'Send OTP Code'} <ArrowRight className="inline ml-1 w-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              OTP sent to {mobile}
              {demoOtp && <div>Demo OTP: <strong>{demoOtp}</strong></div>}
            </div>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-center text-lg font-bold"
            />
            <button disabled={loading} className="w-full rounded-xl bg-slate-900 py-3 text-xs font-extrabold text-white">
              {loading ? 'Verifying...' : 'Verify OTP & Continue'}
            </button>
            <button type="button" onClick={reset} className="w-full text-xs font-bold text-slate-400">
              Change Mobile Number
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
