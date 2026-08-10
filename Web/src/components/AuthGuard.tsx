'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading, pinConfigured } = useAuth();
  const router = useRouter();

  // No PIN has ever been set — the app doesn't gate access at all until
  // one is created (from Settings, not at launch). Only once a PIN exists
  // does this behave like a real lock: redirect to /login when there's no
  // valid session, recovering there instead of a blank dead-end if the
  // API is briefly unreachable or a token expires.
  const gateActive = pinConfigured === true;

  useEffect(() => {
    if (!loading && gateActive && !isAuthenticated) {
      router.replace('/login');
    }
  }, [loading, gateActive, isAuthenticated, router]);

  if (loading || pinConfigured === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-slate-700 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (gateActive && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-slate-700 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
