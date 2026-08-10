'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { PinInput } from '@/components/ui/pin-input';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ForgotPinPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp' | 'newPin' | 'confirmPin'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/auth/forgot-pin`, { email });
      setMessage('If that email has an account, a reset code has been sent — check your inbox.');
      setStep('otp');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not send reset code');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpComplete = () => {
    setError('');
    setStep('newPin');
  };

  const handleConfirmComplete = async (fullConfirmPin: string) => {
    setError('');
    if (fullConfirmPin !== newPin) {
      setError('PINs do not match — try again');
      setConfirmPin('');
      setNewPin('');
      setStep('newPin');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/auth/reset-pin`, { email, otp, newPin });
      router.replace('/login');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not reset PIN');
      setStep('otp');
      setOtp('');
      setNewPin('');
      setConfirmPin('');
    } finally {
      setSubmitting(false);
    }
  };

  const stepSubtitle = {
    email: "We'll email you a reset code",
    otp: 'Enter the code from your email',
    newPin: 'Choose a new 6-digit PIN',
    confirmPin: 'Confirm your new PIN',
  }[step];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4">
      <div className="w-full max-w-md form-glass rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-1">Reset your PIN</h1>
        <p className="text-slate-400 mb-8">{stepSubtitle}</p>

        {error && <div className="bg-red-500/10 border border-red-900 text-red-400 text-sm p-3 rounded-lg mb-4">{error}</div>}
        {message && step === 'otp' && (
          <div className="bg-emerald-500/10 border border-emerald-900 text-emerald-300 text-sm p-3 rounded-lg mb-4">{message}</div>
        )}

        {step === 'email' && (
          <form onSubmit={handleRequest} className="space-y-4">
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
              disabled={submitting}
              className="w-full btn-premium text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <div className="space-y-5">
            <PinInput length={6} value={otp} onChange={setOtp} onComplete={handleOtpComplete} autoFocus />
            <button
              type="button"
              onClick={() => setStep('email')}
              className="w-full text-sm text-slate-400 hover:text-slate-300"
            >
              &larr; Back
            </button>
          </div>
        )}

        {step === 'newPin' && (
          <div className="space-y-5">
            <PinInput length={6} value={newPin} onChange={setNewPin} onComplete={() => setStep('confirmPin')} autoFocus />
          </div>
        )}

        {step === 'confirmPin' && (
          <div className="space-y-5">
            <PinInput length={6} value={confirmPin} onChange={setConfirmPin} onComplete={handleConfirmComplete} autoFocus />
            <button
              type="button"
              disabled={submitting || confirmPin.length !== 6}
              onClick={() => handleConfirmComplete(confirmPin)}
              className="w-full btn-premium text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Resetting...' : 'Reset PIN'}
            </button>
          </div>
        )}

        <p className="text-sm text-slate-400 mt-6 text-center">
          <Link href="/login" className="text-blue-400 font-medium">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
