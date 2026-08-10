'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { PinInput } from '@/components/ui/pin-input';
import { OWNER_EMAIL, OWNER_NAME } from '@/lib/authConstants';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function LoginPage() {
  const { login, register, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'checking' | 'create' | 'confirm' | 'enter'>('checking');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    axios
      .get(`${API_URL}/auth/pin-status`, { params: { email: OWNER_EMAIL } })
      .then((res) => setMode(res.data.exists ? 'enter' : 'create'))
      .catch(() => setMode('enter'));
  }, []);

  const submitEnter = async (fullPin: string) => {
    setError('');
    setSubmitting(true);
    try {
      await login(OWNER_EMAIL, fullPin);
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Incorrect PIN');
      setPin('');
    } finally {
      setSubmitting(false);
    }
  };

  const submitConfirm = async (fullConfirmPin: string) => {
    setError('');
    if (fullConfirmPin !== pin) {
      setError('PINs do not match — try again');
      setPin('');
      setConfirmPin('');
      setMode('create');
      return;
    }
    setSubmitting(true);
    try {
      await register(OWNER_EMAIL, pin, OWNER_NAME);
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not set PIN');
      setPin('');
      setConfirmPin('');
      setMode('create');
    } finally {
      setSubmitting(false);
    }
  };

  const title = {
    checking: '',
    create: 'Choose a 4-digit PIN',
    confirm: 'Confirm your PIN',
    enter: 'Enter your PIN',
  }[mode];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4">
      <div className="w-full max-w-md form-glass rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-1">Shams Al Barakat Repair Services</h1>
        <p className="text-slate-400 mb-8">{title}</p>

        {error && <div className="bg-red-500/10 border border-red-900 text-red-400 text-sm p-3 rounded-lg mb-4">{error}</div>}

        {mode === 'checking' && (
          <div className="flex justify-center py-4">
            <div className="w-8 h-8 border-2 border-slate-700 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-5">
            <PinInput length={4} value={pin} onChange={setPin} onComplete={() => setMode('confirm')} autoFocus />
          </div>
        )}

        {mode === 'confirm' && (
          <div className="space-y-5">
            <PinInput length={4} value={confirmPin} onChange={setConfirmPin} onComplete={submitConfirm} autoFocus />
            <button
              type="button"
              disabled={submitting || confirmPin.length !== 4}
              onClick={() => submitConfirm(confirmPin)}
              className="w-full btn-premium text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Setting PIN...' : 'Set PIN'}
            </button>
          </div>
        )}

        {mode === 'enter' && (
          <div className="space-y-5">
            <PinInput length={4} value={pin} onChange={setPin} onComplete={submitEnter} autoFocus />
            <button
              type="button"
              disabled={submitting || pin.length !== 4}
              onClick={() => submitEnter(pin)}
              className="w-full btn-premium text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
