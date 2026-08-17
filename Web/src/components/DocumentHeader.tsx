'use client';

import { useState, ReactNode } from 'react';
import { Client } from '@/hooks/useClients';

export function DocumentHeader({
  client,
  title,
  metaFields,
}: {
  client: Client | null;
  title: string;
  metaFields: { label: string; value: ReactNode; highlight?: boolean }[];
}) {
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
    client?.vat_number ? `TRN: ${client.vat_number}` : null,
  ].filter(Boolean);

  const metaRows = [metaFields.slice(0, 2), metaFields.slice(2, 4)].filter((r) => r.length);

  return (
    <div className="doc-header-row mb-6 rounded-lg border border-slate-800 bg-slate-900 overflow-hidden flex items-stretch">
      <div className="doc-header-identity px-5 py-4 flex items-start gap-4 flex-1 min-w-0">
        <div className="shrink-0">
          {showLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={documentLogoUrl}
              alt={client?.name}
              className="h-14 w-14 rounded-full object-cover border-2 border-amber-400"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            // A thin circular outline, not a heavy filled box — this is an
            // empty-state hint for the office, not a real logo placeholder,
            // so it should read as a quiet ring, not a competing shape.
            <div className="h-14 w-14 rounded-full border border-slate-700 flex items-center justify-center text-[7px] font-medium text-slate-600 uppercase tracking-widest">
              Logo
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="text-base font-bold text-white tracking-tight truncate">{client?.name || 'Your Company'}</div>
          <div className="text-[10px] font-semibold tracking-[0.16em] uppercase text-amber-400 mt-1">{title}</div>
          <div className="text-[10px] text-slate-400 leading-relaxed mt-2">
            {contactLines.map((line, i) => <div key={i}>{line}</div>)}
          </div>
        </div>
      </div>

      <div className="doc-header-divider w-px bg-slate-800 shrink-0" />

      <div className="meta-box px-4 py-4 flex-1 min-w-0 flex flex-col justify-center">
        {metaRows.map((row, ri) => (
          <div
            key={ri}
            className={`grid grid-cols-2 gap-x-4 py-2 ${ri < metaRows.length - 1 ? 'meta-row-divider border-b border-slate-800' : ''}`}
          >
            {row.map((f, i) => (
              <div key={i}>
                <div className={`meta-label ${f.highlight ? 'text-amber-400' : ''}`}>{f.label}</div>
                <div className={`text-sm mt-0.5 ${f.highlight ? 'text-white font-medium' : 'text-slate-300'}`}>{f.value}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
