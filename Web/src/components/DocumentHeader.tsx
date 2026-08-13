'use client';

import { useState } from 'react';
import { Client } from '@/hooks/useClients';

export function DocumentHeader({ client, title }: { client: Client | null; title: string }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = client?.logo_url && !logoFailed;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center min-h-[4.5rem]">
          {showLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={client.logo_url}
              alt={client.name}
              className="max-h-[4.5rem] max-w-[240px] object-contain"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <div className="h-16 w-16 rounded-md border border-dashed border-slate-700 bg-slate-950 flex items-center justify-center text-[10px] font-medium text-slate-500 uppercase tracking-wide">
              Logo
            </div>
          )}
        </div>
        <div className="text-right text-xs text-slate-400 leading-relaxed">
          <div className="text-base font-bold text-white tracking-tight">{client?.name || 'Your Company'}</div>
          {client?.address && <div>{client.address}</div>}
          {(client?.city || client?.country) && <div>{[client?.city, client?.country].filter(Boolean).join(', ')}</div>}
          {client?.phone && <div>{client.phone}</div>}
          {client?.email && <div>{client.email}</div>}
        </div>
      </div>
      <div className="bg-slate-900 text-white text-center py-2.5 rounded-md text-sm font-semibold tracking-[0.15em] uppercase border-b-2 border-amber-400">
        {title}
      </div>
    </div>
  );
}
