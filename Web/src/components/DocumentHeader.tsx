'use client';

import { useState } from 'react';
import { Client } from '@/hooks/useClients';

export function DocumentHeader({ client, title }: { client: Client | null; title: string }) {
  const [logoFailed, setLogoFailed] = useState(false);
  // The document logo is a separate field from the small app-badge logo
  // (Header.tsx sidebar/header avatar) — businesses often want a compact
  // square mark for the app UI but a wider letterhead-style logo on
  // printed documents. Falls back to the app logo for anyone who set that
  // before this field existed, rather than showing a blank box.
  const documentLogoUrl = client?.document_logo_url || client?.logo_url;
  const showLogo = documentLogoUrl && !logoFailed;
  const contactLines = [
    client?.address,
    [client?.city, client?.country].filter(Boolean).join(', '),
    client?.phone,
    client?.email,
  ].filter(Boolean);
  const trnLine = client?.vat_number ? `TRN: ${client.vat_number}` : null;

  return (
    <div className="doc-header mb-6 border border-slate-800 rounded-md overflow-hidden">
      <div className="grid grid-cols-[1fr_2fr_1fr] items-start gap-3 px-5 py-4 bg-slate-900">
        <div className="flex justify-start">
          {showLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={documentLogoUrl}
              alt={client?.name}
              className="max-h-9 max-w-[100px] object-contain"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            // A thin outline, not a heavy filled box — this is an empty-state
            // hint for the office, not a real logo placeholder, so it should
            // read as a quiet line, not a competing shape on the page.
            <div className="h-7 w-[88px] border border-slate-700 flex items-center justify-center text-[8px] font-medium text-slate-600 uppercase tracking-widest">
              Logo
            </div>
          )}
        </div>

        <div className="text-center">
          <div className="text-base font-bold text-white tracking-tight">{client?.name || 'Your Company'}</div>
          <div className="text-[10px] font-semibold tracking-[0.16em] uppercase text-amber-400 mt-1.5">{title}</div>
        </div>

        <div className="text-right text-[10px] text-amber-400 leading-relaxed">
          {contactLines.map((line, i) => <div key={i}>{line}</div>)}
        </div>
      </div>

      {trnLine && (
        <div className="px-5 py-1.5 text-[10px] text-slate-500 text-right border-t border-slate-800 bg-slate-950/40">
          {trnLine}
        </div>
      )}
    </div>
  );
}
