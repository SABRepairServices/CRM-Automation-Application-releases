'use client';

import { Client } from '@/hooks/useClients';
import { DocumentHeader } from '@/components/DocumentHeader';

export function InspectionPreview({
  client,
  customerName,
  inspectedBy,
  inspectedAt,
  findings,
  taxableAmount,
  taxRate,
  notes,
}: {
  client: Client | null;
  customerName?: string;
  inspectedBy?: string;
  inspectedAt?: string;
  findings: { description: string }[];
  taxableAmount: number;
  taxRate: number;
  notes?: string;
}) {
  const taxAmount = taxableAmount * (taxRate / 100);
  const visibleFindings = findings.filter((f) => f.description);

  return (
    <div className="doc-paper bg-slate-900 border border-slate-800 rounded-md p-8 text-slate-200">
      <DocumentHeader client={client} title="Inspection Report" />

      <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Report No</p>
          <p className="text-white font-medium">Draft</p>
          <p className="text-xs font-semibold text-slate-500 uppercase mt-2 mb-1">Date</p>
          <p className="text-white font-medium">{inspectedAt ? new Date(inspectedAt).toLocaleDateString() : '—'}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Client</p>
          <p className="text-white font-medium">{customerName || '—'}</p>
        </div>
      </div>

      <table className="doc-table text-sm mb-6">
        <thead>
          <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
            <th className="px-3 py-2 font-semibold w-16">Sr No</th>
            <th className="px-3 py-2 font-semibold">Description</th>
          </tr>
        </thead>
        <tbody>
          {visibleFindings.length === 0 ? (
            <tr>
              <td colSpan={2} className="px-3 py-4 text-center text-slate-600">Add a finding to see it here</td>
            </tr>
          ) : (
            visibleFindings.map((f, idx) => (
              <tr key={idx}>
                <td className="px-3 py-2 text-slate-500">{idx + 1}</td>
                <td className="px-3 py-2 text-white">{f.description}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="mb-6">
        <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Tax Summary</p>
        <table className="doc-table text-sm">
          <thead>
            <tr className="text-xs text-slate-400 uppercase text-left">
              <th className="px-3 py-2 font-semibold">Tax Details</th>
              <th className="px-3 py-2 font-semibold text-right">Taxable Amount</th>
              <th className="px-3 py-2 font-semibold text-right">Tax Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-2 text-slate-400">Standard Rate ({taxRate}%)</td>
              <td className="px-3 py-2 text-right text-slate-400">AED {taxableAmount.toFixed(2)}</td>
              <td className="px-3 py-2 text-right text-white font-medium">AED {taxAmount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {notes && (
        <div className="mb-8 text-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Notes</p>
          <p className="text-slate-400">{notes}</p>
        </div>
      )}

      <div className="flex justify-between items-end text-sm">
        <div>
          <p className="text-xs text-slate-500 mb-1">Authorized Signature</p>
          <div className="w-40 border-b border-slate-700 h-8" />
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 mb-1">Inspected By</p>
          <p className="font-medium text-white">{inspectedBy || '—'}</p>
        </div>
      </div>
    </div>
  );
}
