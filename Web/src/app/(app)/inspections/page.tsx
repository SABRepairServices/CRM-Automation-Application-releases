'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInspections, InspectionFinding, InspectionStatus, DiagnosisResult } from '@/hooks/useInspections';
import { useTechnicians } from '@/hooks/useTechnicians';
import { useSelectedClientId } from '@/hooks/useSelectedClientId';
import type { DocumentJobContext, DocumentSignatures } from '@/hooks/useQuotations';
import { ActionButton } from '@/components/ui/action-button';
import { DocSection } from '@/components/documents/DocSection';
import { JobContextFields } from '@/components/documents/JobContextFields';
import { LineItemsTable, LineColumn } from '@/components/documents/LineItemsTable';
import { SignatureBlock } from '@/components/documents/SignatureBlock';
import { DiagnosisPicker } from '@/components/documents/DiagnosisPicker';

const SIGNATURE_ROLES = [
  { key: 'technician', label: 'Technician', placeholder: 'Technician name' },
  { key: 'customer', label: 'Customer / Owner', placeholder: 'Customer name' },
];

const STATUS_LABELS: Record<InspectionStatus, string> = {
  draft: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  cannot_repair: 'Cannot Repair',
};

/** One row of the repair-actions grid. Strings because they're bound
 *  directly to inputs; parsed only when totalling. */
interface ActionRow extends Record<string, unknown> {
  description: string;
  quantity: string;
  cost: string;
  status: string;
  note: string;
}

const emptyRow = (): ActionRow => ({ description: '', quantity: '1', cost: '', status: '', note: '' });
const num = (v: unknown) => Number(v) || 0;
const money = (n: number) => `AED ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const today = () => new Date().toISOString().slice(0, 10);

const COLUMNS: LineColumn<ActionRow>[] = [
  { key: 'description', label: 'Action / Part Description', width: '34%', placeholder: 'Action or part…' },
  { key: 'quantity', label: 'Qty', width: '9%', type: 'number', placeholder: '1' },
  { key: 'cost', label: 'Est. Cost (AED)', width: '15%', type: 'number', step: '0.01', placeholder: '0.00' },
  { key: 'status', label: 'Status', width: '16%', type: 'select', options: ['Required', 'Done', 'Pending Part', 'Not Applicable'] },
  { key: 'note', label: 'Notes', width: '18%', placeholder: 'Notes' },
];

export default function InspectionsPage() {
  const router = useRouter();
  const { reports, loading, error, listReports, createReport, updateReport, deleteReport } = useInspections();
  const { technicians, listTechnicians } = useTechnicians();
  const clientId = useSelectedClientId();

  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [jobContext, setJobContext] = useState<DocumentJobContext>({ urgency: 'normal' });
  const [rows, setRows] = useState<ActionRow[]>([emptyRow(), emptyRow(), emptyRow()]);
  const [inspectedBy, setInspectedBy] = useState('');
  const [inspectedAt, setInspectedAt] = useState(today());
  const [visitType, setVisitType] = useState('On-Site Visit');
  const [customerFault, setCustomerFault] = useState('');
  const [findingsText, setFindingsText] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | undefined>();
  const [taxRate, setTaxRate] = useState('5');
  const [signatures, setSignatures] = useState<DocumentSignatures>({});

  useEffect(() => {
    if (!clientId) return;
    listReports(clientId);
    listTechnicians(clientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const taxableAmount = useMemo(
    () => rows.reduce((sum, r) => sum + num(r.quantity) * num(r.cost), 0),
    [rows]
  );
  const taxAmount = taxableAmount * (num(taxRate) / 100);

  const resetForm = () => {
    setJobContext({ urgency: 'normal' });
    setRows([emptyRow(), emptyRow(), emptyRow()]);
    setInspectedBy(''); setInspectedAt(today()); setVisitType('On-Site Visit');
    setCustomerFault(''); setFindingsText(''); setRootCause(''); setTechnicianNotes('');
    setDiagnosis(undefined); setTaxRate('5'); setSignatures({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    setFormError('');
    setMessage('');

    if (!jobContext.customer_name || !jobContext.customer_phone) {
      setFormError('Customer name and phone are required — the phone number is how a repeat customer is matched.');
      return;
    }

    // Findings on the printed report are the technician's own list; the
    // repair-actions grid rows are appended so nothing typed is lost.
    const findings: InspectionFinding[] = [
      ...findingsText.split('\n').map((l) => l.trim()).filter(Boolean).map((description) => ({ description })),
      ...rows.filter((r) => r.description.trim()).map((r) => ({
        description: [r.description, r.status && `[${r.status}]`, r.note].filter(Boolean).join(' '),
      })),
    ];

    if (findings.length === 0) {
      setFormError('Record at least one finding or repair action before saving.');
      return;
    }

    try {
      const created = await createReport(clientId, {
        ...jobContext,
        reported_fault: customerFault || jobContext.reported_fault,
        inspected_by: inspectedBy,
        inspected_at: inspectedAt,
        findings,
        taxable_amount: taxableAmount,
        tax_rate: num(taxRate),
        notes: visitType ? `Visit type: ${visitType}` : undefined,
        root_cause: rootCause,
        technician_notes: technicianNotes,
        diagnosis_result: diagnosis,
        signatures,
      });
      resetForm();
      // Straight to the printable/sendable document instead of leaving the
      // office on this list — fill in details, land immediately on the
      // finished document.
      router.push(`/inspections/${created.id}`);
    } catch {
      // createReport already surfaced the message via `error`
    }
  };

  const handleStatusChange = async (reportId: string, status: InspectionStatus) => {
    if (!clientId) return;
    if (status === 'completed' && !confirm('Mark this inspection completed? This automatically generates its quotation.')) return;
    setMessage('');
    try {
      const updated = await updateReport(clientId, reportId, { status });
      if (status === 'completed') {
        setMessage(updated.generated_quotation
          ? `Completed — quotation ${updated.generated_quotation.quotation_number} was created automatically.`
          : 'Completed — a quotation already existed for this job.');
      }
    } catch (err) {
      console.error('Error updating inspection status:', err);
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!clientId) return;
    if (!confirm('Delete this inspection report? This cannot be undone.')) return;
    try {
      await deleteReport(clientId, reportId);
    } catch (err) {
      console.error('Error deleting inspection report:', err);
    }
  };

  const statusColor = (status: InspectionStatus) => ({
    draft: 'bg-amber-500/10 text-amber-400',
    in_progress: 'bg-blue-500/10 text-blue-400',
    completed: 'bg-emerald-500/10 text-emerald-400',
    cannot_repair: 'bg-red-500/10 text-red-400',
  }[status] || 'bg-slate-800 text-slate-400');

  return (
    <div className="doc-theme px-4 py-4 bg-slate-950 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold text-white mb-4">Inspection Reports</h1>

        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm px-4 py-3 rounded-md mb-4">{message}</div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-md mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="meta-row">
            <div className="meta-card hi">
              <div className="meta-label">Inspection No.</div>
              <input className="meta-input" value="" placeholder="—" readOnly />
            </div>
            <div className="meta-card">
              <div className="meta-label">Date</div>
              <input className="meta-input" type="date" value={inspectedAt} onChange={(e) => setInspectedAt(e.target.value)} />
            </div>
            <div className="meta-card">
              <div className="meta-label">Visit Type</div>
              <select className="meta-input" value={visitType} onChange={(e) => setVisitType(e.target.value)}>
                <option>On-Site Visit</option>
                <option>Customer Drop-Off</option>
                <option>Workshop Inspection</option>
              </select>
            </div>
            <div className="meta-card">
              <div className="meta-label">Inspected By</div>
              <input className="meta-input" value={inspectedBy} placeholder="Technician name" onChange={(e) => setInspectedBy(e.target.value)} />
            </div>
          </div>

          <JobContextFields value={jobContext} onChange={setJobContext} technicians={technicians} />

          <DocSection title="Technician Findings &amp; Diagnosis" icon="🔎" accent="red">
            <div className="fg c2">
              <div className="field full">
                <label htmlFor="i-custfault">Fault Reported by Customer</label>
                <textarea id="i-custfault" value={customerFault} onChange={(e) => setCustomerFault(e.target.value)}
                  placeholder="What the customer said is wrong — in their words…" />
              </div>
              <div className="field full">
                <label htmlFor="i-findings">Faults Found (one per line)</label>
                <textarea id="i-findings" value={findingsText} onChange={(e) => setFindingsText(e.target.value)}
                  style={{ minHeight: 80 }} placeholder={'Each line becomes a numbered finding on the report.\ne.g. Heating element burnt out\ne.g. Door seal perished'} />
              </div>
              <div className="field full">
                <label htmlFor="i-rootcause">Root Cause Analysis</label>
                <textarea id="i-rootcause" value={rootCause} onChange={(e) => setRootCause(e.target.value)}
                  placeholder="Identified root cause of the problem…" />
              </div>
            </div>
          </DocSection>

          <DocSection title="Repair Actions &amp; Parts Required" icon="🛠️" accent="blue" flush>
            <LineItemsTable
              columns={COLUMNS}
              rows={rows}
              onChange={setRows}
              onAdd={() => setRows([...rows, emptyRow()])}
              addLabel="＋ Add Action"
              computed={(r) => (r.quantity || r.cost ? money(num(r.quantity) * num(r.cost)) : '—')}
              computedLabel="Line Total"
            />
            <div className="totals-wrap">
              <div className="totals-box">
                <div className="tot-row"><span className="tot-lbl">Taxable Amount</span><span className="tot-val">{money(taxableAmount)}</span></div>
                <div className="tot-row">
                  <span className="tot-lbl">Tax Rate %</span>
                  <span className="tot-val">
                    <input className="tot-input" type="number" min={0} max={100} value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)} aria-label="Tax rate" />
                  </span>
                </div>
                <div className="tot-row"><span className="tot-lbl">Tax Amount</span><span className="tot-val">{money(taxAmount)}</span></div>
                <div className="tot-divider" />
                <div className="tot-row grand"><span className="tot-lbl">TOTAL</span><span className="tot-val">{money(taxableAmount + taxAmount)}</span></div>
              </div>
            </div>
          </DocSection>

          <DocSection title="Diagnosis Result" icon="✅" accent="gold">
            <DiagnosisPicker value={diagnosis} onChange={setDiagnosis} />
            <div className="field mt-4">
              <label htmlFor="i-technotes">Technician Notes / Recommendation</label>
              <textarea id="i-technotes" value={technicianNotes} onChange={(e) => setTechnicianNotes(e.target.value)}
                placeholder="Any additional notes, observations, or recommendations…" />
            </div>
          </DocSection>

          <DocSection title="Signatures" icon="✍️" accent="gold">
            <SignatureBlock roles={SIGNATURE_ROLES} value={signatures} onChange={setSignatures} />
          </DocSection>

          {formError && <p className="text-xs text-red-400 mb-3">{formError}</p>}
          <ActionButton type="submit" disabled={loading} text={loading ? 'Creating…' : 'Create Inspection Report'} />
        </form>

        <div className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden mt-8">
          <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">All Inspection Reports</h2>
            <span className="text-xs text-slate-400">{reports.length} total</span>
          </div>

          {reports.length === 0 ? (
            <div className="px-5 py-12 text-center"><p className="text-sm text-slate-500">No inspection reports yet.</p></div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-5 py-2 font-medium">Report No</th>
                  <th className="px-5 py-2 font-medium">Customer</th>
                  <th className="px-5 py-2 font-medium">Appliance</th>
                  <th className="px-5 py-2 font-medium text-right">Total</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                  <th className="px-5 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} onClick={() => router.push(`/inspections/${r.id}`)}
                    className="border-b border-slate-800 last:border-0 cursor-pointer hover:bg-slate-950 transition-colors">
                    <td className="px-5 py-3 font-medium text-white">{r.report_number}</td>
                    <td className="px-5 py-3 text-slate-400">{r.customer_name || 'Unassigned'}</td>
                    <td className="px-5 py-3 text-slate-400">{r.appliance_type || '—'}</td>
                    <td className="px-5 py-3 text-right text-white font-medium">
                      AED {(Number(r.taxable_amount) + Number(r.tax_amount)).toFixed(2)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`status-pill px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(r.status)}`}>
                        {STATUS_LABELS[r.status] || r.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2 justify-end items-center">
                        {r.status !== 'completed' && r.status !== 'cannot_repair' && (
                          <ActionButton text="Complete" variant="success" showArrow={false}
                            className="!px-3 !py-1 !text-xs" onClick={() => handleStatusChange(r.id, 'completed')} />
                        )}
                        {r.status === 'draft' && (
                          <button onClick={() => handleStatusChange(r.id, 'cannot_repair')}
                            className="px-3 py-1 text-xs font-medium text-red-400 hover:text-red-300 border border-red-900/50 rounded-md">
                            Cannot Repair
                          </button>
                        )}
                        {r.status === 'draft' && (
                          <button onClick={() => handleDelete(r.id)} className="text-xs font-medium text-red-400 hover:text-red-300">
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
