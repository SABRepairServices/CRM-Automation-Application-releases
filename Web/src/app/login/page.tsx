'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { PinInput } from '@/components/ui/pin-input';

export default function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'pin'>('email');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [loading, isAuthenticated, router]);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStep('pin');
  };

  const submitPin = async (fullPin: string) => {
    setError('');
    setSubmitting(true);
    try {
      await login(email, fullPin);
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid email or PIN');
      setPin('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4">
      <div className="w-full max-w-md form-glass rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-1">Shams Al Barakat Repair Services</h1>
        <p className="text-slate-400 mb-8">{step === 'email' ? 'Sign in to your CRM' : `Enter PIN for ${email}`}</p>

        {error && <div className="bg-red-500/10 border border-red-900 text-red-400 text-sm p-3 rounded-lg mb-4">{error}</div>}

        {step === 'email' ? (
          <form onSubmit={handleContinue} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full px-4 py-2 bg-slate-950/60 border border-slate-700 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="w-full btn-premium text-white px-4 py-2 rounded-lg"
            >
              Continue
            </button>
          </form>
        ) : (
          <div className="space-y-5">
            <PinInput length={6} value={pin} onChange={setPin} onComplete={submitPin} autoFocus />
            <button
              type="button"
              disabled={submitting || pin.length !== 6}
              onClick={() => submitPin(pin)}
              className="w-full btn-premium text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('email');
                setPin('');
                setError('');
              }}
              className="w-full text-sm text-slate-400 hover:text-slate-300"
            >
              &larr; Not you? Change email
            </button>
          </div>
        )}

        <p className="text-sm text-slate-400 mt-4 text-center">
          <Link href="/forgot-pin" className="text-blue-400 font-medium">
            Forgot PIN?
          </Link>
        </p>

        <p className="text-sm text-slate-400 mt-2 text-center">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-blue-400 font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
