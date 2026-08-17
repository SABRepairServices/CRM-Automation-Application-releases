'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useInspections, InspectionReport, InspectionStatus, DiagnosisResult } from '@/hooks/useInspections';
import { useClients, Client } from '@/hooks/useClients';
import type { DocumentSignatures } from '@/hooks/useQuotations';
import { DocumentHeader } from '@/components/DocumentHeader';
import { ActionButton } from '@/components/ui/action-button';
import { SendDocumentBar } from '@/components/SendDocumentBar';
import { DocSection } from '@/components/documents/DocSection';
import { SignatureBlock } from '@/components/documents/SignatureBlock';
import { DiagnosisPicker } from '@/components/documents/DiagnosisPicker';
import { StatusBar, StatusOption } from '@/components/documents/StatusBar';
import { isElectron, saveDocumentBackup } from '@/lib/electronBridge';

const SIGNATURE_ROLES = [
  { key: 'technician', label: 'Technician', placeholder: 'Technician name' },
  { key: 'customer', label: 'Customer / Owner', placeholder: 'Customer name' },
];

const STATUS_OPTIONS: StatusOption<InspectionStatus>[] = [
  { value: 'draft', label: '⏳ Pending', tone: 'gold' },
  { value: 'in_progress', label: '🔧 In Progress', tone: 'blue' },
  { value: 'completed', label: '✅ Completed', tone: 'green' },
  { value: 'cannot_repair', label: '🚫 Cannot Repair', tone: 'red' },
];

const money = (n: number | string) => `AED ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-GB') : '—');

export default function InspectionDocumentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getReport, sendReport, updateReport } = useInspections();
  const { getClient } = useClients();
  const [report, setReport] = useState<InspectionReport | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [backupStatus, setBackupStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [signatures, setSignatures] = useState<DocumentSignatures>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const clientId = localStorage.getItem('selectedClientId');
    if (!clientId || !id) return;
    Promise.all([getReport(clientId, id), getClient(clientId)]).then(([r, c]) => {
      setReport(r);
      setSignatures(r?.signatures || {});
      setClient(c);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const runBackup = () => {
    if (!report || !client || !isElectron()) return;
    setBackupStatus('saving');
    setTimeout(async () => {
      const result = await saveDocumentBackup({
        clientName: client.name,
        customerName: report.customer_name || 'Unknown Customer',
        jobNumber: report.job_number || report.job_id,
        applianceType: report.appliance_type || 'appliance',
        docType: 'Inspection',
        docNumber: report.report_number,
      });
      setBackupStatus(result?.success ? 'saved' : 'failed');
    }, 300);
  };

  useEffect(() => {
    if (report && client) runBackup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report, client]);

  const patch = async (data: Partial<InspectionReport>, confirmMsg?: string) => {
    const clientId = localStorage.getItem('selectedClientId');
    if (!clientId || !report) return;
    if (confirmMsg && !confirm(confirmMsg)) return;
    setSaving(true);
    setMessage('');
    try {
      const updated = await updateReport(clientId, report.id, data);
      setReport({ ...report, ...updated });
      if (updated.generated_quotation) {
        setMessage(`Quotation ${updated.generated_quotation.quotation_number} was created automatically.`);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-sm text-slate-500">Loading…</div>;
  if (!report) return <div className="p-8"><p className="text-sm text-slate-500">Inspection report not found.</p></div>;

  return (
    <div className="doc-theme px-4 py-4 bg-slate-950 min-h-screen print:bg-white print:p-0">
      <div className="doc-sheet max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4 print:hidden flex-wrap gap-3">
          <button onClick={() => router.push('/inspections')} className="text-sm text-slate-500 hover:text-slate-300">
            ← Back to Inspection Reports
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

        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm px-4 py-3 rounded-md mb-4 print:hidden">{message}</div>
        )}

        <div className="mb-4 print:hidden">
          <SendDocumentBar
            documentLabel={`Inspection Report ${report.report_number}`}
            customerName={report.customer_name}
            customerPhone={report.customer_phone}
            customerEmail={report.customer_email}
            businessPhone={client?.phone}
            businessEmail={client?.email}
            onSend={() => sendReport(localStorage.getItem('selectedClientId') || '', report.id)}
            onSent={() => getReport(localStorage.getItem('selectedClientId') || '', report.id).then((r) => r && setReport(r))}
          />
        </div>

        <DocumentHeader
          client={client}
          title="Inspection Report"
          metaFields={[
            { label: 'Inspection No.', value: report.report_number, highlight: true },
            { label: 'Date', value: fmtDate(report.inspected_at) },
            { label: 'Inspected By', value: report.inspected_by || '—' },
            { label: 'Appliance', value: report.appliance_type || '—' },
          ]}
        />

        <DocSection title="Customer Details" icon="🏢" accent="blue">
          <div className="fg c2 fg-lines">
            <div>
              <div className="meta-label">Customer</div>
              <div className="text-sm text-white">{report.customer_name || '—'}</div>
            </div>
            <div>
              <div className="meta-label">Phone</div>
              <div className="text-sm text-slate-300">{report.customer_phone || '—'}</div>
            </div>
            <div className="full fg-lines-full">
              <div className="meta-label">Address</div>
              <div className="text-sm text-slate-300">{report.customer_address || '—'}</div>
            </div>
          </div>
        </DocSection>

        <DocSection title="Findings" icon="🔎" accent="red" flush>
          <div className="tbl-wrap">
            <table className="items-table">
              <thead>
                <tr>
                  <th style={{ width: '28px' }}>#</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {(report.findings || []).map((f, idx) => (
                  <tr key={f.id || idx}>
                    <td className="row-num">{idx + 1}</td>
                    <td className="px-2 text-sm text-white">{f.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DocSection>

        {(report.root_cause || report.technician_notes) && (
          <DocSection title="Analysis" icon="📝" accent="gray">
            {report.root_cause && (
              <div className={`pb-3 ${report.technician_notes ? 'mb-3 border-b border-slate-800' : ''}`}>
                <div className="meta-label">Root Cause</div>
                <p className="text-sm text-slate-300">{report.root_cause}</p>
              </div>
            )}
            {report.technician_notes && (
              <div>
                <div className="meta-label">Technician Notes</div>
                <p className="text-sm text-slate-300">{report.technician_notes}</p>
              </div>
            )}
          </DocSection>
        )}

        <DocSection title="Tax Summary" icon="💰" accent="gold">
          <div className="totals-wrap" style={{ padding: 0 }}>
            <div className="totals-box">
              <div className="tot-row"><span className="tot-lbl">Taxable Amount</span><span className="tot-val">{money(report.taxable_amount)}</span></div>
              <div className="tot-row"><span className="tot-lbl">Standard Rate {report.tax_rate}%</span><span className="tot-val">{money(report.tax_amount)}</span></div>
              <div className="tot-divider" />
              <div className="tot-row grand">
                <span className="tot-lbl">TOTAL</span>
                <span className="tot-val">{money(Number(report.taxable_amount) + Number(report.tax_amount))}</span>
              </div>
            </div>
          </div>
        </DocSection>

        <DocSection title="Diagnosis Result" icon="✅" accent="gold">
          <DiagnosisPicker
            value={report.diagnosis_result}
            disabled={saving}
            onChange={(next: DiagnosisResult) => patch({ diagnosis_result: next })}
          />
        </DocSection>

        <div className="print:hidden">
          <DocSection title="Inspection Status" icon="📌" accent="green">
            <StatusBar
              options={STATUS_OPTIONS}
              value={report.status}
              disabled={saving}
              onChange={(next) => patch(
                { status: next },
                next === 'completed' ? 'Mark this inspection completed? This automatically generates its quotation.' : undefined
              )}
            />
          </DocSection>
        </div>

        <DocSection title="Signatures" icon="✍️" accent="gold">
          <SignatureBlock roles={SIGNATURE_ROLES} value={signatures} onChange={setSignatures} />
          <div className="mt-4 print:hidden">
            <ActionButton text={saving ? 'Saving…' : 'Save Signatures'} variant="ghost" showArrow={false}
              disabled={saving} onClick={() => patch({ signatures })} />
          </div>
        </DocSection>
      </div>
    </div>
  );
}
