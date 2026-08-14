'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PinInput } from '@/components/ui/pin-input';
import { OWNER_EMAIL } from '@/lib/authConstants';
import { useClients } from '@/hooks/useClients';

export default function LoginPage() {
  const { login, isAuthenticated, loading, pinConfigured } = useAuth();
  const { getClient } = useClients();
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    const clientId = localStorage.getItem('selectedClientId');
    if (!clientId) return;
    getClient(clientId).then((c) => c?.name && setCompanyName(c.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-md p-8">
        <h1 className="text-2xl font-semibold text-white mb-1">{companyName || 'CRM & Automation'}</h1>
        <p className="text-sm text-slate-500 mb-8">{submitting ? 'Signing in...' : 'Enter your PIN'}</p>

        {error && <div className="bg-red-500/10 border border-red-200 text-red-400 text-sm p-3 rounded-md mb-4">{error}</div>}

        <div className="space-y-5">
          <PinInput length={4} value={pin} onChange={setPin} onComplete={submitEnter} autoFocus />
        </div>
      </div>
    </div>
  );
}
