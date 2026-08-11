'use client';

import { Client } from '@/hooks/useClients';
import { DocumentHeader } from '@/components/DocumentHeader';

export function InvoicePreview({
  client,
  customerName,
  dueDate,
  notes,
}: {
  client: Client | null;
  customerName?: string;
  dueDate?: string;
  notes?: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-md p-8 text-slate-200">
      <DocumentHeader client={client} title="Tax Invoice" />

      <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Invoice No</p>
          <p className="text-white font-medium">Draft</p>
          <p className="text-xs text-slate-500 mt-2">Due {dueDate ? new Date(dueDate).toLocaleDateString() : '—'}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Bill To</p>
          <p className="text-white font-medium">{customerName || '—'}</p>
        </div>
      </div>

      <div className="border border-dashed border-slate-800 rounded-md px-4 py-6 text-center text-sm text-slate-600 mb-6">
        Line items are pulled from the linked job once this invoice is created.
      </div>

      {notes && (
        <div className="mb-6 text-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Notes</p>
          <p className="text-slate-400">{notes}</p>
        </div>
      )}

      <div className="text-center text-xs text-slate-400 border-t border-slate-800 pt-4">
        Status: <span className="font-semibold uppercase text-slate-400">draft</span>
      </div>
    </div>
  );
}
