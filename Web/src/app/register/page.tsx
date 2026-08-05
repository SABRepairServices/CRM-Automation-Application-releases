'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const { register, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [loading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setSubmitting(true);
    try {
      await register(email, password, fullName);
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not create account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4">
      <div className="w-full max-w-md form-glass rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
        <p className="text-slate-400 mb-8">Imran Pro Services CRM</p>

        {error && <div className="bg-red-500/10 border border-red-900 text-red-400 text-sm p-3 rounded-lg mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full px-4 py-2 bg-slate-950/60 border border-slate-700 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 bg-slate-950/60 border border-slate-700 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Password (min. 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 bg-slate-950/60 border border-slate-700 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-premium text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-sm text-slate-400 mt-6 text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
