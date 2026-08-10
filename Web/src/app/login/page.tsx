'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PinInput } from '@/components/ui/pin-input';
import { OWNER_EMAIL } from '@/lib/authConstants';

export default function LoginPage() {
  const { login, isAuthenticated, loading, pinConfigured } = useAuth();
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (isAuthenticated) {
      router.replace('/dashboard');
      return;
    }
    // No PIN has ever been set — there's nothing to enter here, this page
    // only handles unlocking an existing PIN. Setup happens in Settings.
    if (pinConfigured === false) {
      router.replace('/dashboard');
    }
  }, [loading, isAuthenticated, pinConfigured, router]);

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

  if (pinConfigured !== true) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-slate-700 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4">
      <div className="w-full max-w-md form-glass rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-1">Shams Al Barakat Repair Services</h1>
        <p className="text-slate-400 mb-8">{submitting ? 'Signing in...' : 'Enter your PIN'}</p>

        {error && <div className="bg-red-500/10 border border-red-900 text-red-400 text-sm p-3 rounded-lg mb-4">{error}</div>}

        <div className="space-y-5">
          <PinInput length={4} value={pin} onChange={setPin} onComplete={submitEnter} autoFocus />
        </div>
      </div>
    </div>
  );
}
