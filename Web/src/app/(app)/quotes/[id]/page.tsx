'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuotations, Quotation, DocumentSignatures } from '@/hooks/useQuotations';
import { useClients, Client } from '@/hooks/useClients';
import { DocumentHeader } from '@/components/DocumentHeader';
import { ActionButton } from '@/components/ui/action-button';
import { SendDocumentBar } from '@/components/SendDocumentBar';
import { DocSection } from '@/components/documents/DocSection';
import { SignatureBlock } from '@/components/documents/SignatureBlock';
import { isElectron, saveDocumentBackup } from '@/lib/electronBridge';

const STANDARD_TERMS = [
  'This quotation is valid for 7 days from the date of issue.',
  'Work will commence only upon written or WhatsApp approval of this quotation.',
  'Payment is due upon completion of work unless a contract arrangement is in place.',
  'Any additional parts or work identified during repair will require a revised quotation.',
  'A 30-day warranty applies to all completed repair work.',
];

const SIGNATURE_ROLES = [
  { key: 'prepared_by', label: 'Prepared By (Office)' },
  { key: 'approved_by', label: 'Approved By (Customer)', placeholder: 'Customer full name' },
  { key: 'technician', label: 'Technician', placeholder: 'Technician name' },
];

const REPAIR_TYPE_LABELS: Record<string, string> = {
  on_site: 'On-Site Repair',
  workshop: 'Workshop Repair',
  inspection_only: 'Inspection Only',
  part_replacement: 'Part Replacement',
  service: 'Service / Maintenance',
};

const money = (n: number | string) => `AED ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-GB') : '—');

export default function QuotationDocumentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getQuotation, sendQuotation, updateQuotation } = useQuotations();
  const { getClient } = useClients();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [backupStatus, setBackupStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [signatures, setSignatures] = useState<DocumentSignatures>({});
  const [savingSignatures, setSavingSignatures] = useState(false);

  useEffect(() => {
    const clientId = localStorage.getItem('selectedClientId');
    if (!clientId || !id) return;
    Promise.all([getQuotation(clientId, id), getClient(clientId)]).then(([q, c]) => {
      setQuotation(q);
      setSignatures(q?.signatures || {});
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

  const saveSignatures = async () => {
    const clientId = localStorage.getItem('selectedClientId');
    if (!clientId || !quotation) return;
    setSavingSignatures(true);
    try {
      await updateQuotation(clientId, quotation.id, { signatures });
    } finally {
      setSavingSignatures(false);
    }
  };

  if (loading) return <div className="p-8 text-sm text-slate-500">Loading…</div>;
  if (!quotation) return <div className="p-8"><p className="text-sm text-slate-500">Quotation not found.</p></div>;

  const itemsTotal = (quotation.items || []).reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const vatAmount = Number(quotation.total_amount) - itemsTotal + Number(quotation.discount_amount);

  return (
    <div className="doc-theme px-4 py-4 bg-slate-950 min-h-screen print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4 print:hidden flex-wrap gap-3">
          <button onClick={() => router.push('/quotes')} className="text-sm text-slate-500 hover:text-slate-300">
            ← Back to Quotations
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
            documentLabel={`Quotation ${quotation.quotation_number}`}
            customerName={quotation.customer_name}
            customerPhone={quotation.customer_phone}
            customerEmail={quotation.customer_email}
            businessPhone={client?.phone}
            businessEmail={client?.email}
            onSend={() => sendQuotation(localStorage.getItem('selectedClientId') || '', quotation.id)}
            onSent={() => getQuotation(localStorage.getItem('selectedClientId') || '', quotation.id).then((q) => q && setQuotation(q))}
          />
        </div>

        <DocumentHeader client={client} title="Quotation" />

        <div className="meta-row">
          <div className="meta-card hi">
            <div className="meta-label">Quotation No.</div>
            <div className="text-sm text-white font-medium">{quotation.quotation_number}</div>
          </div>
          <div className="meta-card">
            <div className="meta-label">Date</div>
            <div className="text-sm text-slate-300">{fmtDate(quotation.created_at)}</div>
          </div>
          <div className="meta-card">
            <div className="meta-label">Valid Until</div>
            <div className="text-sm text-slate-300">{fmtDate(quotation.valid_until)}</div>
          </div>
          <div className="meta-card">
            <div className="meta-label">Status</div>
            <div className="text-sm text-slate-300 capitalize">{quotation.status}</div>
          </div>
        </div>

        <DocSection title="Bill To — Customer Details" icon="🏢" accent="blue">
          <div className="fg c2">
            <div>
              <div className="meta-label">Customer</div>
              <div className="text-sm text-white">{quotation.customer_name || '—'}</div>
            </div>
            <div>
              <div className="meta-label">Phone</div>
              <div className="text-sm text-slate-300">{quotation.customer_phone || '—'}</div>
            </div>
            <div>
              <div className="meta-label">Appliance</div>
              <div className="text-sm text-slate-300">{quotation.appliance_type || '—'}</div>
            </div>
            <div>
              <div className="meta-label">Repair Type</div>
              <div className="text-sm text-slate-300">
                {quotation.repair_type ? REPAIR_TYPE_LABELS[quotation.repair_type] || quotation.repair_type : '—'}
              </div>
            </div>
          </div>
        </DocSection>

        <DocSection title="Scope of Work &amp; Cost Breakdown" icon="📋" accent="blue" flush>
          <div className="tbl-wrap">
            <table className="items-table">
              <thead>
                <tr>
                  <th style={{ width: '28px' }}>#</th>
                  <th>Description</th>
                  <th style={{ width: '10%' }}>Qty</th>
                  <th style={{ width: '16%' }}>Unit Price</th>
                  <th style={{ width: '18%', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(quotation.items || []).map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="row-num">{idx + 1}</td>
                    <td className="px-2 text-sm text-white">{item.description}</td>
                    <td className="px-2 text-sm text-slate-400">{item.quantity}</td>
                    <td className="px-2 text-sm text-slate-400">{money(item.unit_price)}</td>
                    <td className="amt-cell">{money(item.quantity * item.unit_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="totals-wrap">
            <div className="totals-box">
              <div className="tot-row"><span className="tot-lbl">Labour</span><span className="tot-val">{money(quotation.labour_amount)}</span></div>
              <div className="tot-row"><span className="tot-lbl">Parts</span><span className="tot-val">{money(quotation.parts_amount)}</span></div>
              {Number(quotation.discount_amount) > 0 && (
                <div className="tot-row"><span className="tot-lbl">Discount</span><span className="tot-val">- {money(quotation.discount_amount)}</span></div>
              )}
              <div className="tot-row"><span className="tot-lbl">VAT {quotation.vat_percent}%</span><span className="tot-val">{money(vatAmount)}</span></div>
              <div className="tot-divider" />
              <div className="tot-row grand"><span className="tot-lbl">TOTAL DUE</span><span className="tot-val">{money(quotation.total_amount)}</span></div>
            </div>
          </div>
        </DocSection>

        {quotation.notes && (
          <DocSection title="Notes" icon="📝" accent="gray">
            <p className="text-sm text-slate-400">{quotation.notes}</p>
          </DocSection>
        )}

        <DocSection title="Payment Terms &amp; Conditions" icon="📃" accent="gray">
          <div className="terms-box">
            <ul>{STANDARD_TERMS.map((t, i) => <li key={i}>{t}</li>)}</ul>
          </div>
        </DocSection>

        <DocSection title="Signatures &amp; Acknowledgement" icon="✍️" accent="gold">
          <SignatureBlock roles={SIGNATURE_ROLES} value={signatures} onChange={setSignatures} />
          <div className="mt-4 print:hidden">
            <ActionButton text={savingSignatures ? 'Saving…' : 'Save Signatures'} variant="ghost" showArrow={false}
              disabled={savingSignatures} onClick={saveSignatures} />
          </div>
        </DocSection>
      </div>
    </div>
  );
}
