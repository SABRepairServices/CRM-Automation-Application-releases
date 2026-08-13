'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ClientSelector } from '@/components/ClientSelector';
import { useClients, Client } from '@/hooks/useClients';
import { getAppVersion, isElectron, openInBrowser } from '@/lib/electronBridge';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { getClient } = useClients();
  const [menuOpen, setMenuOpen] = useState(false);
  const [version, setVersion] = useState<string | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [badgeLogoFailed, setBadgeLogoFailed] = useState(false);

  useEffect(() => {
    if (!isElectron()) return;
    getAppVersion().then(setVersion);
  }, []);

  useEffect(() => {
    const clientId = localStorage.getItem('selectedClientId');
    if (!clientId) return;
    getClient(clientId).then(setClient);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const brandName = client?.name || 'Shams Al Barakat';
  const brandWords = brandName.split(' ').filter(Boolean);
  // First + last word (not first two) — "Shams Al Barakat" should read "SB",
  // not "SA" from the middle "Al".
  const brandInitials = (brandWords.length > 1
    ? [brandWords[0], brandWords[brandWords.length - 1]]
    : [brandWords[0], brandWords[0]?.[1]]
  )
    .map((w) => w?.[0])
    .filter(Boolean)
    .join('')
    .toUpperCase();

  const initials = user?.fullName
    ? user.fullName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : user?.email?.[0]?.toUpperCase() || '?';

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-800 z-40 flex items-center justify-between px-5">
      <div className="flex items-center gap-2.5 w-56 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-blue-900/40 overflow-hidden shrink-0">
          {client?.logo_url && !badgeLogoFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={client.logo_url}
              alt={brandName}
              className="w-full h-full object-contain bg-white"
              onError={() => setBadgeLogoFailed(true)}
            />
          ) : (
            brandInitials || 'SB'
          )}
        </div>
        <div>
          <h1 className="text-sm font-semibold text-white leading-tight truncate max-w-[150px]">{brandName}</h1>
          <div className="flex items-center gap-1.5 leading-tight">
            <p className="text-[10px] text-slate-500">Repair Services CRM</p>
            {version && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-1.5 py-px">
                <span className="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.9)]" />
                v{version}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ClientSelector />
        {isElectron() && (
          <button
            onClick={() => openInBrowser()}
            aria-label="Open in Browser"
            title="Open in Browser"
            className="w-10 h-10 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-800 hover:text-slate-300 hover:shadow-[0_0_12px_rgba(148,163,184,0.35)] transition-all duration-200"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15 3h6v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 14 21 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <Link
          href="/settings"
          aria-label="Settings"
          title="Settings"
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 ${
            pathname === '/settings'
              ? 'bg-blue-500/10 text-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.5)]'
              : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300 hover:shadow-[0_0_12px_rgba(148,163,184,0.35)]'
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M19.4 13.5a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V19.5a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H4.5a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H10a1.65 1.65 0 0 0 1-1.51V4.5a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V10a1.65 1.65 0 0 0 1.51 1h.09a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold transition-shadow duration-200 hover:shadow-[0_0_14px_rgba(168,85,247,0.55)]"
          >
            {initials}
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-lg shadow-lg py-2 z-40">
              <div className="px-4 py-2 text-sm text-slate-500 border-b truncate">{user?.fullName || 'Signed in'}</div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
