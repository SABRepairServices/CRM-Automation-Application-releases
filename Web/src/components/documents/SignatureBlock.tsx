'use client';

import type { DocumentSignatures } from '@/hooks/useQuotations';

export interface SignatureRole {
  key: string;
  label: string;
  placeholder?: string;
}

/**
 * The three signature boxes at the foot of every printed document. Which
 * roles appear differs per document type (a quotation is approved by the
 * customer, an invoice is received by them), so the roles are passed in
 * and the values live in one `signatures` JSONB column rather than six
 * separate columns per table.
 */
export function SignatureBlock({
  roles,
  value,
  onChange,
  readOnly = false,
}: {
  roles: SignatureRole[];
  value: DocumentSignatures;
  onChange?: (next: DocumentSignatures) => void;
  readOnly?: boolean;
}) {
  const setField = (key: string, field: 'name' | 'date', fieldValue: string) => {
    onChange?.({ ...value, [key]: { ...(value[key] || {}), [field]: fieldValue } });
  };

  return (
    <div className="sig-grid">
      {roles.map((role) => {
        const sig = value[role.key] || {};
        return (
          <div className="sig-box" key={role.key}>
            <div className="sig-title">{role.label}</div>
            <div className="sig-line" />
            <input
              type="text"
              value={sig.name || ''}
              placeholder={role.placeholder || 'Full name'}
              readOnly={readOnly}
              onChange={(e) => setField(role.key, 'name', e.target.value)}
            />
            <input
              type="date"
              value={sig.date || ''}
              readOnly={readOnly}
              onChange={(e) => setField(role.key, 'date', e.target.value)}
            />
          </div>
        );
      })}
    </div>
  );
}
