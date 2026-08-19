'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMonthlyInvoices, MonthlyInvoice, MONTH_NAMES, PAYMENT_TERMS_LABELS } from '@/hooks/useMonthlyInvoices';
import { useClients, Client } from '@/hooks/useClients';
import type { DocumentSignatures } from '@/hooks/useQuotations';
import { DocumentHeader } from '@/components/DocumentHeader';
import { ActionButton } from '@/components/ui/action-button';
import { SendDocumentBar } from '@/components/SendDocumentBar';
import { DocSection } from '@/components/documents/DocSection';
import { SignatureBlock } from '@/components/documents/SignatureBlock';
import { isElectron, saveDocumentBackup } from '@/lib/electronBridge';

const SIGNATURE_ROLES = [
  { key: 'verified_by', label: 'Verified By (Manager)', placeholder: 'Manager name' },
  { key: 'acknowledged_by', label: 'Acknowledged By (Client)', placeholder: 'Client representative' },
];

const money = (n: number | string) => `AED ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-GB') : '—');

export default function MonthlyInvoiceDocumentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getMonthlyInvoice, sendMonthlyInvoice, updateMonthlyInvoice } = useMonthlyInvoices();
  const { getClient } = useClients();
  const [invoice, setInvoice] = useState<MonthlyInvoice | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [backupStatus, setBackupStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [signatures, setSignatures] = useState<DocumentSignatures>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const clientId = localStorage.getItem('selectedClientId');
    if (!clientId || !id) return;
    Promise.all([getMonthlyInvoice(clientId, id), getClient(clientId)]).then(([mi, c]) => {
      setInvoice(mi);
      setSignatures(mi?.signatures || {});
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
        customerName: invoice.customer_name || invoice.contract_name || 'Unknown Client',
        jobNumber: invoice.invoice_number,
        applianceType: 'monthly-statement',
        docType: 'MonthlyInvoice',
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
      await updateMonthlyInvoice(clientId, invoice.id, { signatures });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-sm text-slate-500">Loading…</div>;
  if (!invoice) return <div className="p-8"><p className="text-sm text-slate-500">Monthly invoice not found.</p></div>;

  const period = `${MONTH_NAMES[invoice.month - 1] || ''} ${invoice.year}`;

  return (
    <div className="doc-theme px-4 py-4 bg-slate-950 min-h-screen print:bg-white print:p-0">
      <div className="doc-sheet max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4 print:hidden flex-wrap gap-3">
          <button onClick={() => router.push('/monthly-invoices')} className="text-sm text-slate-500 hover:text-slate-300">
            ← Back to Monthly Invoices
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
            documentLabel={`Monthly Invoice ${invoice.invoice_number}`}
            customerName={invoice.customer_name}
            customerPhone={invoice.customer_phone}
            customerEmail={invoice.to_email || invoice.customer_email}
            businessPhone={client?.phone}
            businessEmail={client?.email}
            onSend={() => sendMonthlyInvoice(localStorage.getItem('selectedClientId') || '', invoice.id)}
            onSent={() => getMonthlyInvoice(localStorage.getItem('selectedClientId') || '', invoice.id).then((mi) => mi && setInvoice(mi))}
          />
        </div>

        <DocumentHeader
          client={client}
          title="Monthly Invoice"
          metaFields={[
            { label: 'Invoice No.', value: invoice.invoice_number, highlight: true },
            { label: 'Period', value: period, highlight: true },
            { label: 'Payment Terms', value: PAYMENT_TERMS_LABELS[invoice.payment_terms] || invoice.payment_terms },
            { label: 'Status', value: <span className="capitalize">{invoice.status}</span> },
          ]}
        />

        <div className="summary-badge">
          <div className="sum-card gold-card">
            <div className="sum-lbl">Total Amount</div>
            <div className="sum-val">{money(invoice.subtotal)}</div>
          </div>
          <div className="sum-card green-card">
            <div className="sum-lbl">Total Received</div>
            <div className="sum-val">{money(invoice.total_received)}</div>
          </div>
          <div className="sum-card red-card">
            <div className="sum-lbl">Total Pending</div>
            <div className="sum-val">{money(invoice.total_pending)}</div>
          </div>
        </div>

        <DocSection title="Client / Company Details" icon="🏢" accent="blue">
          <div className="fg c2">
            <div>
              <div className="meta-label">Company</div>
              <div className="text-sm text-white">{invoice.customer_name || invoice.contract_name || '—'}</div>
            </div>
            <div>
              <div className="meta-label">Contact Person</div>
              <div className="text-sm text-slate-300">{invoice.contact_person || '—'}</div>
            </div>
            <div>
              <div className="meta-label">Phone</div>
              <div className="text-sm text-slate-300">{invoice.customer_phone || '—'}</div>
            </div>
            <div>
              <div className="meta-label">Email</div>
              <div className="text-sm text-slate-300">{invoice.to_email || invoice.customer_email || '—'}</div>
            </div>
            <div>
              <div className="meta-label">Account / Panel #</div>
              <div className="text-sm text-slate-300">{invoice.panel_account_number || '—'}</div>
            </div>
            <div>
              <div className="meta-label">Prepared By</div>
              <div className="text-sm text-slate-300">{invoice.prepared_by || '—'}</div>
            </div>
          </div>
        </DocSection>

        <DocSection title="Monthly Job Log" icon="📊" accent="green" flush>
          <div className="tbl-wrap">
            <table className="items-table">
              <thead>
                <tr>
                  <th style={{ width: '28px' }}>#</th>
                  <th style={{ width: '12%' }}>Date</th>
                  <th style={{ width: '14%' }}>Job No.</th>
                  <th style={{ width: '15%' }}>Appliance</th>
                  <th>Work Done</th>
                  <th style={{ width: '13%', textAlign: 'right' }}>Amount</th>
                  <th style={{ width: '13%', textAlign: 'right' }}>Received</th>
                  <th style={{ width: '13%', textAlign: 'right' }}>Pending</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.jobs || []).map((j, idx) => (
                  <tr key={j.job_id || idx}>
                    <td className="row-num">{idx + 1}</td>
                    <td className="px-2 text-xs text-slate-400">{fmtDate(j.completed_at)}</td>
                    <td className="px-2 text-xs text-slate-300">{j.job_number || '—'}</td>
                    <td className="px-2 text-xs text-slate-300">{j.appliance_type || '—'}</td>
                    <td className="px-2 text-xs text-slate-400">{j.reported_fault || '—'}</td>
                    <td className="amt-cell">{money(j.amount)}</td>
                    <td className="amt-cell" style={{ color: 'var(--doc-green-light)' }}>{money(j.received_amount)}</td>
                    <td className="amt-cell" style={{ color: 'var(--doc-red-light)' }}>
                      {money(Math.max(0, Number(j.amount) - Number(j.received_amount)))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="totals-wrap">
            <div className="totals-box">
              <div className="tot-row">
                <span className="tot-lbl">Total Jobs</span>
                <span className="tot-val">{(invoice.jobs || []).length}</span>
              </div>
              <div className="tot-row grand"><span className="tot-lbl">TOTAL AMOUNT</span><span className="tot-val">{money(invoice.subtotal)}</span></div>
              <div className="tot-divider" />
              <div className="tot-row received"><span className="tot-lbl">Total Received</span><span className="tot-val">{money(invoice.total_received)}</span></div>
              <div className="tot-row pending"><span className="tot-lbl">Total Pending</span><span className="tot-val">{money(invoice.total_pending)}</span></div>
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
              disabled={saving} isLoading={saving} onClick={saveSignatures} />
          </div>
        </DocSection>
      </div>
    </div>
  );
}
