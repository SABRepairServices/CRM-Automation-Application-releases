'use client';

import { Client } from '@/hooks/useClients';
import { DocumentHeader } from '@/components/DocumentHeader';

const STANDARD_TERMS = [
  'The work shall commence after approval of this estimate/quotation.',
  'This estimate is valid only for the job/service listed. Anything extra will be charged separately.',
  'The date of completion of job is subject to our final confirmation.',
];

export interface QuotationPreviewItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export function QuotationPreview({
  client,
  customerName,
  items,
  discountAmount,
  vatPercent,
  notes,
}: {
  client: Client | null;
  customerName?: string;
  items: QuotationPreviewItem[];
  discountAmount: number;
  vatPercent: number;
  notes?: string;
}) {
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const vat = afterDiscount * (vatPercent / 100);
  const total = afterDiscount + vat;
  const visibleItems = items.filter((i) => i.description);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-md p-8 text-slate-200">
      <DocumentHeader client={client} title="Quotation" />

      <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Quote No</p>
          <p className="text-white font-medium">Draft</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Client</p>
          <p className="text-white font-medium">{customerName || '—'}</p>
        </div>
      </div>

      <table className="doc-table text-sm mb-6">
        <thead>
          <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
            <th className="px-3 py-2 font-semibold w-12">Sr No</th>
            <th className="px-3 py-2 font-semibold">Description</th>
            <th className="px-3 py-2 font-semibold text-right w-16">Qty</th>
            <th className="px-3 py-2 font-semibold text-right w-24">Rate</th>
            <th className="px-3 py-2 font-semibold text-right w-24">Total</th>
          </tr>
        </thead>
        <tbody>
          {visibleItems.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-3 py-4 text-center text-slate-600">Add a line item to see it here</td>
            </tr>
          ) : (
            visibleItems.map((item, idx) => (
              <tr key={idx}>
                <td className="px-3 py-2 text-slate-500">{idx + 1}</td>
                <td className="px-3 py-2 text-white">{item.description}</td>
                <td className="px-3 py-2 text-right text-slate-400">{item.quantity}</td>
                <td className="px-3 py-2 text-right text-slate-400">{Number(item.unit_price).toFixed(2)}</td>
                <td className="px-3 py-2 text-right text-white">{(item.quantity * item.unit_price).toFixed(2)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="flex justify-end mb-6">
        <div className="w-64 text-sm space-y-1">
          <div className="flex justify-between text-slate-400">
            <span>Subtotal</span>
            <span>AED {subtotal.toFixed(2)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-slate-400">
              <span>Discount</span>
              <span>- AED {discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-400">
            <span>VAT ({vatPercent}%)</span>
            <span>AED {vat.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold text-white pt-2 border-t border-slate-800">
            <span>Total</span>
            <span>AED {total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {notes && (
        <div className="mb-6 text-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Notes</p>
          <p className="text-slate-400">{notes}</p>
        </div>
      )}

      <div className="bg-slate-950 border border-slate-800 rounded-md px-4 py-3 mb-8">
        <p className="text-xs font-semibold text-slate-400 mb-2">Terms &amp; Conditions</p>
        <ol className="text-xs text-slate-500 list-decimal list-inside space-y-1">
          {STANDARD_TERMS.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ol>
      </div>

      <div className="flex justify-between items-end text-sm">
        <div>
          <p className="text-xs text-slate-500 mb-1">Authorized Signature</p>
          <div className="w-40 border-b border-slate-700 h-8" />
        </div>
      </div>
    </div>
  );
}
