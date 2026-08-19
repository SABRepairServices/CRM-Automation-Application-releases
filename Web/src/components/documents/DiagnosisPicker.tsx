'use client';

import type { CSSProperties } from 'react';
import type { DiagnosisResult } from '@/hooks/useInspections';

const OPTIONS: { value: DiagnosisResult; icon: string; label: string }[] = [
  { value: 'onsite', icon: '🏠', label: 'Can Fix On-Site' },
  { value: 'workshop', icon: '🏭', label: 'Send to Workshop' },
  { value: 'cannot', icon: '🚫', label: 'Cannot Repair' },
];

/**
 * Where the appliance can actually be repaired, chosen by the technician
 * after inspecting it. Drives what the customer is told next, so it's a
 * deliberate three-way choice rather than a free-text note.
 */
export function DiagnosisPicker({
  value,
  onChange,
  disabled = false,
}: {
  value?: DiagnosisResult;
  onChange: (next: DiagnosisResult) => void;
  disabled?: boolean;
}) {
  return (
    <div className="diag-grid">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          style={{ '--ring-clr': '251 191 36' } as CSSProperties}
          className={`diag-opt ring-hover ring-hover-row ${value === opt.value ? `sel-${opt.value} ring-hover-selected` : ''}`}
        >
          <div className="diag-opt-icon" aria-hidden="true">{opt.icon}</div>
          <div className="diag-opt-label">{opt.label}</div>
        </button>
      ))}
    </div>
  );
}
