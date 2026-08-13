'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useInspections, InspectionReport } from '@/hooks/useInspections';
import { useClients, Client } from '@/hooks/useClients';
import { DocumentHeader } from '@/components/DocumentHeader';
import { ActionButton } from '@/components/ui/action-button';
import { SendDocumentBar } from '@/components/SendDocumentBar';
import { isElectron, saveDocumentBackup } from '@/lib/electronBridge';

export default function InspectionDocumentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getReport, sendReport } = useInspections();
  const { getClient } = useClients();
  const [report, setReport] = useState<InspectionReport | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [backupStatus, setBackupStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');

  useEffect(() => {
    const clientId = localStorage.getItem('selectedClientId');
    if (!clientId || !id) return;
    Promise.all([getReport(clientId, id), getClient(clientId)]).then(([r, c]) => {
      setReport(r);
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

  if (loading) {
    return <div className="p-8 text-sm text-slate-500">Loading...</div>;
  }

  if (!report) {
    return (
      <div className="p-8">
        <p className="text-sm text-slate-500">Inspection report not found.</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-950 min-h-screen print:bg-white print:p-0">
      <div className="max-w-3xl mx-auto">
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
            <SendDocumentBar
              documentLabel={`Inspection Report ${report.report_number}`}
              customerName={report.customer_name}
              customerPhone={report.customer_phone}
              customerEmail={report.customer_email}
              businessPhone={client?.phone}
              businessEmail={client?.email}
              onSend={() => sendReport(localStorage.getItem('selectedClientId') || '', report.id)}
            />
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
          <DocumentHeader client={client} title="Inspection Report" />

          <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Report No</p>
              <p className="text-white font-medium">{report.report_number}</p>
              <p className="text-xs text-slate-500 mt-2">
                {report.inspected_at ? new Date(report.inspected_at).toLocaleDateString() : '—'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Client</p>
              <p className="text-white font-medium">{report.customer_name || '—'}</p>
              {report.customer_address && <p className="text-xs text-slate-500">{report.customer_address}</p>}
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
              {(report.findings || []).map((f, idx) => (
                <tr key={f.id || idx}>
                  <td className="px-3 py-2 text-slate-500">{idx + 1}</td>
                  <td className="px-3 py-2 text-white">{f.description}</td>
                </tr>
              ))}
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
                  <td className="px-3 py-2 text-slate-400">Standard Rate ({report.tax_rate}%)</td>
                  <td className="px-3 py-2 text-right text-slate-400">AED {Number(report.taxable_amount).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right text-white font-medium">AED {Number(report.tax_amount).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {report.notes && (
            <div className="mb-8 text-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Notes</p>
              <p className="text-slate-400">{report.notes}</p>
            </div>
          )}

          <div className="flex justify-between items-end text-sm">
            <div>
              <p className="text-xs text-slate-500 mb-1">Authorized Signature</p>
              <div className="w-40 border-b border-slate-700 h-8" />
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 mb-1">Inspected By</p>
              <p className="font-medium text-white">{report.inspected_by || '—'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
