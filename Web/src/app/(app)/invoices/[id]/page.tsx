'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useInvoices, Invoice } from '@/hooks/useInvoices';
import { useClients, Client } from '@/hooks/useClients';
import type { DocumentSignatures } from '@/hooks/useQuotations';
import { DocumentHeader } from '@/components/DocumentHeader';
import { MetaBox } from '@/components/documents/MetaBox';
import { ActionButton } from '@/components/ui/action-button';
import { SendDocumentBar } from '@/components/SendDocumentBar';
import { DocSection } from '@/components/documents/DocSection';
import { SignatureBlock } from '@/components/documents/SignatureBlock';
import { isElectron, saveDocumentBackup } from '@/lib/electronBridge';

const SIGNATURE_ROLES = [
  { key: 'received_by', label: 'Received By (Customer)', placeholder: 'Customer name' },
  { key: 'technician', label: 'Technician', placeholder: 'Technician name' },
];

const money = (n: number | string) => `AED ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-GB') : '—');

export default function InvoiceDocumentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getInvoice, sendInvoice, updateInvoice } = useInvoices();
  const { getClient } = useClients();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [backupStatus, setBackupStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [signatures, setSignatures] = useState<DocumentSignatures>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const clientId = localStorage.getItem('selectedClientId');
    if (!clientId || !id) return;
    Promise.all([getInvoice(clientId, id), getClient(clientId)]).then(([inv, c]) => {
      setInvoice(inv);
      setSignatures(inv?.signatures || {});
      setClient(c);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const runBackup = () => {
    if (!invoice || !client || !isElectron()) return;
    setBackupStatus('saving');
    setTimeout(async () => {
      const result = await saveDocumentBackup({
        clientName: client.name,
        customerName: invoice.customer_name || 'Unknown Customer',
        jobNumber: invoice.jobs?.[0]?.job_number || invoice.invoice_number,
        applianceType: invoice.jobs?.[0]?.appliance_type || 'appliance',
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

  const saveSignatures = async () => {
    const clientId = localStorage.getItem('selectedClientId');
    if (!clientId || !invoice) return;
    setSaving(true);
    try {
      await updateInvoice(clientId, invoice.id, { signatures });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-sm text-slate-500">Loading…</div>;
  if (!invoice) return <div className="p-8"><p className="text-sm text-slate-500">Invoice not found.</p></div>;

  const balance = Math.max(0, Number(invoice.total_amount) - Number(invoice.paid_amount));

  return (
    <div className="doc-theme px-4 py-4 bg-slate-950 min-h-screen print:bg-white print:p-0">
      <div className="doc-sheet max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4 print:hidden flex-wrap gap-3">
          <button onClick={() => router.push('/invoices')} className="text-sm text-slate-500 hover:text-slate-300">
            ← Back to Invoices
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            {isElectron() && (
              <span className="text-xs text-slate-400">
                {backupStatus === 'saving' && 'Saving local backup…'}
                {backupStatus === 'saved' && '✓ Backed up locally'}
                {backupStatus === 'failed' && 'Local backup failed'}
              </span>
            )}
            <ActionButton text="Print" variant="ghost" showArrow={false}
              onClick={() => { window.print(); if (isElectron()) runBackup(); }} />
          </div>
        </div>

        <div className="mb-4 print:hidden">
          <SendDocumentBar
            documentLabel={`Invoice ${invoice.invoice_number}`}
            customerName={invoice.customer_name}
            customerPhone={invoice.customer_phone}
            customerEmail={invoice.customer_email}
            businessPhone={client?.phone}
            businessEmail={client?.email}
            onSend={() => sendInvoice(localStorage.getItem('selectedClientId') || '', invoice.id)}
            onSent={() => getInvoice(localStorage.getItem('selectedClientId') || '', invoice.id).then((i) => i && setInvoice(i))}
          />
        </div>

        <div className="doc-header-row flex gap-4 items-stretch mb-6">
          <DocumentHeader client={client} title="Tax Invoice" />
          <MetaBox
            fields={[
              { label: 'Invoice No.', value: invoice.invoice_number, highlight: true },
              { label: 'Invoice Date', value: fmtDate(invoice.issue_date) },
              { label: 'Due Date', value: fmtDate(invoice.due_date) },
              { label: 'Status', value: <span className="capitalize">{invoice.status}</span> },
            ]}
          />
        </div>

        <DocSection title="Bill To — Customer Details" icon="🏢" accent="blue">
          <div className="fg c2">
            <div>
              <div className="meta-label">Customer</div>
              <div className="text-sm text-white">{invoice.customer_name || '—'}</div>
            </div>
            <div>
              <div className="meta-label">Phone</div>
              <div className="text-sm text-slate-300">{invoice.customer_phone || '—'}</div>
            </div>
            <div>
              <div className="meta-label">Email</div>
              <div className="text-sm text-slate-300">{invoice.customer_email || '—'}</div>
            </div>
          </div>
        </DocSection>

        <DocSection title="Invoice Items" icon="💰" accent="green" flush>
          <div className="tbl-wrap">
            <table className="items-table">
              <thead>
                <tr>
                  <th style={{ width: '28px' }}>#</th>
                  <th>Description</th>
                  <th style={{ width: '22%', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.jobs || []).map((j, idx) => (
                  <tr key={j.job_id || idx}>
                    <td className="row-num">{idx + 1}</td>
                    <td className="px-2 text-sm text-white">
                      {j.appliance_type || 'Appliance'}{j.reported_fault ? ` — ${j.reported_fault}` : ''}
                    </td>
                    <td className="amt-cell">{money(j.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="totals-wrap">
            <div className="totals-box">
              <div className="tot-row"><span className="tot-lbl">Subtotal</span><span className="tot-val">{money(invoice.subtotal)}</span></div>
              <div className="tot-row"><span className="tot-lbl">VAT</span><span className="tot-val">{money(invoice.vat_amount)}</span></div>
              <div className="tot-divider" />
              <div className="tot-row grand"><span className="tot-lbl">TOTAL DUE</span><span className="tot-val">{money(invoice.total_amount)}</span></div>
              <div className="tot-divider" />
              <div className="tot-row received"><span className="tot-lbl">Amount Received</span><span className="tot-val">{money(invoice.paid_amount)}</span></div>
              <div className="tot-row pending"><span className="tot-lbl">Balance Due</span><span className="tot-val">{money(balance)}</span></div>
            </div>
          </div>
        </DocSection>

        {invoice.notes && (
          <DocSection title="Notes" icon="📝" accent="gray">
            <p className="text-sm text-slate-400 whitespace-pre-line">{invoice.notes}</p>
          </DocSection>
        )}

        <DocSection title="Signatures" icon="✍️" accent="gold">
          <SignatureBlock roles={SIGNATURE_ROLES} value={signatures} onChange={setSignatures} />
          <div className="mt-4 print:hidden">
            <ActionButton text={saving ? 'Saving…' : 'Save Signatures'} variant="ghost" showArrow={false}
              disabled={saving} onClick={saveSignatures} />
          </div>
        </DocSection>
      </div>
    </div>
  );
}
