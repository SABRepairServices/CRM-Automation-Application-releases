'use client';

import { ReactNode } from 'react';

type Accent = 'blue' | 'green' | 'gold' | 'red' | 'gray';

/**
 * One titled panel of a document form — the repeating unit the whole
 * office template is built from (Bill To, Appliance Details, Scope of
 * Work, Signatures, …). `flush` drops the body padding for sections whose
 * content is a full-bleed table.
 */
export function DocSection({
  title,
  icon,
  accent = 'blue',
  flush = false,
  children,
}: {
  title: string;
  icon?: string;
  accent?: Accent;
  flush?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="doc-section">
      <div className={`doc-section-hdr ${accent}`}>
        {icon && <span aria-hidden="true">{icon}</span>}
        <span className="doc-section-title">{title}</span>
      </div>
      {flush ? children : <div className="doc-section-body">{children}</div>}
    </div>
  );
}
