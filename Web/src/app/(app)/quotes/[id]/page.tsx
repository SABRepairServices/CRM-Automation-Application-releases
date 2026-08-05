'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuotations, Quotation } from '@/hooks/useQuotations';
import { useClients, Client } from '@/hooks/useClients';
import { DocumentHeader } from '@/components/DocumentHeader';
import { ActionButton } from '@/components/ui/action-button';
import { isElectron, saveDocumentBackup } from '@/lib/electronBridge';

const STANDARD_TERMS = [
  'The work shall commence after approval of this estimate/quotation.',
  'This estimate is valid only for the job/service listed. Anything extra will be charged separately.',
  'The date of completion of job is subject to our final confirmation.',
];

export default function QuotationDocumentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getQuotation } = useQuotations();
  const { getClient } = useClients();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [backupStatus, setBackupStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');

  useEffect(() => {
    const clientId = localStorage.getItem('selectedClientId');
    if (!clientId || !id) return;
    Promise.all([getQuotation(clientId, id), getClient(clientId)]).then(([q, c]) => {
      setQuotation(q);
      setClient(c);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const runBackup = () => {
    if (!quotation || !client || !isElectron()) return;
    setBackupStatus('saving');
    // Give the DOM a moment to paint the freshly-loaded document before
    // Electron's printToPDF captures the current window contents.
    setTimeout(async () => {
      const result = await saveDocumentBackup({
        clientName: client.name,
        customerName: quotation.customer_name || 'Unknown Customer',
        jobNumber: quotation.job_number || quotation.job_id,
        applianceType: quotation.appliance_type || 'appliance',
        docType: 'Quotation',
        docNumber: quotation.quotation_number,
      });
      setBackupStatus(result?.success ? 'saved' : 'failed');
    }, 300);
  };

  useEffect(() => {
    if (quotation && client) runBackup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotation, client]);

  if (loading) {
    return <div className="p-8 text-sm text-slate-500">Loading...</div>;
  }

  if (!quotation) {
    return (
      <div className="p-8">
        <p className="text-sm text-slate-500">Quotation not found.</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-950 min-h-screen print:bg-white print:p-0">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4 print:hidden">
          <button onClick={() => router.push('/quotes')} className="text-sm text-slate-500 hover:text-slate-300">
            ← Back to Quotations
          </button>
          <div className="flex items-center gap-3">
            {isElectron() && (
              <span className="text-xs text-slate-400">
                {backupStatus === 'saving' && 'Saving local backup…'}
                {backupStatus === 'saved' && '✓ Backed up locally'}
                {backupStatus === 'failed' && 'Local backup failed'}
              </span>
            )}
            <ActionButton
              text="Print"
              variant="ghost"
              showArrow={false}
              onClick={() => {
                window.print();
                if (isElectron()) runBackup();
              }}
            />
          </div>
        </div>

        <div className="print-document bg-slate-900 border border-slate-800 rounded-md p-8 text-slate-200 print:border-0 print:shadow-none">
          <DocumentHeader client={client} title="Quotation" />

          <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Quote No</p>
              <p className="text-white font-medium">{quotation.quotation_number}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Client</p>
              <p className="text-white font-medium">{quotation.customer_name || '—'}</p>
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
              {(quotation.items || []).map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="px-3 py-2 text-slate-500">{idx + 1}</td>
                  <td className="px-3 py-2 text-white">{item.description}</td>
                  <td className="px-3 py-2 text-right text-slate-400">{item.quantity}</td>
                  <td className="px-3 py-2 text-right text-slate-400">{Number(item.unit_price).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right text-white">{(item.quantity * item.unit_price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mb-6">
            <div className="w-64 text-sm space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Labour</span>
                <span>AED {Number(quotation.labour_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Parts</span>
                <span>AED {Number(quotation.parts_amount).toFixed(2)}</span>
              </div>
              {Number(quotation.discount_amount) > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Discount</span>
                  <span>- AED {Number(quotation.discount_amount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500 text-xs">
                <span>VAT ({quotation.vat_percent}%)</span>
              </div>
              <div className="flex justify-between font-semibold text-white pt-2 border-t border-slate-800">
                <span>Total</span>
                <span>AED {Number(quotation.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {quotation.notes && (
            <div className="mb-6 text-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Notes</p>
              <p className="text-slate-400">{quotation.notes}</p>
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
            <div className="text-right">
              {quotation.status === 'approved' && (
                <>
                  <p className="text-xs text-slate-500 mb-1">Approved By</p>
                  <p className="font-medium text-white">{quotation.approved_by || '—'}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
