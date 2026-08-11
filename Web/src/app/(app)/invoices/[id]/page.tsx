'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useInvoices, Invoice } from '@/hooks/useInvoices';
import { useClients, Client } from '@/hooks/useClients';
import { DocumentHeader } from '@/components/DocumentHeader';
import { ActionButton } from '@/components/ui/action-button';
import { isElectron, saveDocumentBackup } from '@/lib/electronBridge';

export default function InvoiceDocumentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getInvoice } = useInvoices();
  const { getClient } = useClients();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [backupStatus, setBackupStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');

  useEffect(() => {
    const clientId = localStorage.getItem('selectedClientId');
    if (!clientId || !id) return;
    Promise.all([getInvoice(clientId, id), getClient(clientId)]).then(([i, c]) => {
      setInvoice(i);
      setClient(c);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const runBackup = () => {
    if (!invoice || !client || !isElectron()) return;
    setBackupStatus('saving');
    const firstJob = invoice.jobs?.[0];
    setTimeout(async () => {
      const result = await saveDocumentBackup({
        clientName: client.name,
        customerName: invoice.customer_name || 'Unknown Customer',
        jobNumber: firstJob?.job_number || firstJob?.job_id || invoice.invoice_number,
        applianceType: firstJob?.appliance_type || 'appliance',
        docType: 'Invoice',
        docNumber: invoice.invoice_number,
      });
      setBackupStatus(result?.success ? 'saved' : 'failed');
    }, 300);
  };

  useEffect(() => {
    if (invoice && client) runBackup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice, client]);

  if (loading) {
    return <div className="p-8 text-sm text-slate-500">Loading...</div>;
  }

  if (!invoice) {
    return (
      <div className="p-8">
        <p className="text-sm text-slate-500">Invoice not found.</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-950 min-h-screen print:bg-white print:p-0">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4 print:hidden">
          <button onClick={() => router.push('/invoices')} className="text-sm text-slate-500 hover:text-slate-300">
            ← Back to Invoices
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

        <div className="doc-paper print-document bg-slate-900 border border-slate-800 rounded-md p-8 text-slate-200 print:border-0 print:shadow-none">
          <DocumentHeader client={client} title="Tax Invoice" />

          <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Invoice No</p>
              <p className="text-white font-medium">{invoice.invoice_number}</p>
              <p className="text-xs text-slate-500 mt-2">Due {new Date(invoice.due_date).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Bill To</p>
              <p className="text-white font-medium">{invoice.customer_name || '—'}</p>
            </div>
          </div>

          <table className="doc-table text-sm mb-6">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                <th className="px-3 py-2 font-semibold w-12">Sr No</th>
                <th className="px-3 py-2 font-semibold">Description</th>
                <th className="px-3 py-2 font-semibold text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.jobs || []).map((job, idx) => (
                <tr key={job.job_id || idx}>
                  <td className="px-3 py-2 text-slate-500">{idx + 1}</td>
                  <td className="px-3 py-2 text-white">{(job as any).appliance_type || 'Repair service'} — {(job as any).reported_fault || ''}</td>
                  <td className="px-3 py-2 text-right text-white">AED {Number(job.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mb-8">
            <div className="w-64 text-sm space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>AED {Number(invoice.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>VAT</span>
                <span>AED {Number(invoice.vat_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-white pt-2 border-t border-slate-800">
                <span>Total</span>
                <span>AED {Number(invoice.total_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-400 text-xs pt-1">
                <span>Paid</span>
                <span>AED {Number(invoice.paid_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="mb-6 text-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Notes</p>
              <p className="text-slate-400">{invoice.notes}</p>
            </div>
          )}

          <div className="text-center text-xs text-slate-400 border-t border-slate-800 pt-4">
            Status:{' '}
            <span className="font-semibold uppercase text-slate-400">{invoice.status}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
