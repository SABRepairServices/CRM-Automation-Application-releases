'use client';

import { useState } from 'react';
import { Client } from '@/hooks/useClients';

export function DocumentHeader({ client, title }: { client: Client | null; title: string }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = client?.logo_url && !logoFailed;
  const contactLine = [client?.address, [client?.city, client?.country].filter(Boolean).join(', '), client?.phone, client?.email]
    .filter(Boolean)
    .join('  •  ');
  const trnLine = client?.vat_number ? `TRN: ${client.vat_number}` : null;

  return (
    <div className="mb-6 border border-slate-800 rounded-md px-6 pt-5 pb-0 text-center">
      <div className="text-lg font-bold text-white tracking-tight">{client?.name || 'Your Company'}</div>
      {contactLine && <div className="text-[11px] text-slate-400 mt-1">{contactLine}</div>}
      {trnLine && <div className="text-[11px] text-slate-500 mt-0.5">{trnLine}</div>}

      <div className="bg-slate-900 text-white text-center py-2.5 rounded-md text-sm font-semibold tracking-[0.15em] uppercase border-b-2 border-amber-400 mt-4">
        {title}
      </div>

      <div className="flex items-center justify-center py-4">
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
    </div>
  );
}
