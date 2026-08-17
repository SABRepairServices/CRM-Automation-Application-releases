'use client';

import { ReactNode } from 'react';

/**
 * The document-identity box (number, date, validity/due-date, status)
 * that sits beside DocumentHeader as its own rounded card — the two
 * together form the document's upper section: identity/branding on the
 * left, this document's specifics on the right.
 */
export function MetaBox({
  fields,
}: {
  fields: { label: string; value: ReactNode; highlight?: boolean }[];
}) {
  return (
    <div className="meta-box rounded-lg border border-slate-800 bg-slate-900 flex-1 min-w-0 p-4">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 h-full content-center">
        {fields.map((f, i) => (
          <div key={i}>
            <div className={`meta-label ${f.highlight ? 'text-amber-400' : ''}`}>{f.label}</div>
            <div className={`text-sm mt-0.5 ${f.highlight ? 'text-white font-medium' : 'text-slate-300'}`}>{f.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
