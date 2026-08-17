'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuotations, QuotationItem, DocumentJobContext, DocumentSignatures, RepairType } from '@/hooks/useQuotations';
import { useTechnicians } from '@/hooks/useTechnicians';
import { useSelectedClientId } from '@/hooks/useSelectedClientId';
import { ActionButton } from '@/components/ui/action-button';
import { DocSection } from '@/components/documents/DocSection';
import { JobContextFields } from '@/components/documents/JobContextFields';
import { LineItemsTable, LineColumn } from '@/components/documents/LineItemsTable';
import { SignatureBlock } from '@/components/documents/SignatureBlock';

const STANDARD_TERMS = [
  'This quotation is valid for 7 days from the date of issue.',
  'Work will commence only upon written or WhatsApp approval of this quotation.',
  'Payment is due upon completion of work unless a contract arrangement is in place.',
  'Any additional parts or work identified during repair will require a revised quotation.',
  'A 30-day warranty applies to all completed repair work.',
];

const REPAIR_TYPES: { value: RepairType; label: string }[] = [
  { value: 'on_site', label: 'On-Site Repair' },
  { value: 'workshop', label: 'Workshop Repair' },
  { value: 'inspection_only', label: 'Inspection Only' },
  { value: 'part_replacement', label: 'Part Replacement' },
  { value: 'service', label: 'Service / Maintenance' },
];

const SIGNATURE_ROLES = [
  { key: 'prepared_by', label: 'Prepared By (Office)' },
  { key: 'approved_by', label: 'Approved By (Customer)', placeholder: 'Customer full name' },
  { key: 'technician', label: 'Technician', placeholder: 'Technician name' },
];

/** One editable row in the scope-of-work grid. Kept as strings because
 *  they're bound straight to text inputs; parsed only when totalling. */
interface WorkRow extends Record<string, unknown> {
  description: string;
  item_type: string;
  quantity: string;
  unit_price: string;
  discount: string;
  note: string;
}

const emptyRow = (): WorkRow => ({ description: '', item_type: 'Part', quantity: '1', unit_price: '', discount: '', note: '' });
const num = (v: unknown) => Number(v) || 0;
const money = (n: number) => `AED ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (d: number) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);

const COLUMNS: LineColumn<WorkRow>[] = [
  { key: 'description', label: 'Description of Work / Parts', width: '34%', placeholder: 'Description of work or part…' },
  { key: 'item_type', label: 'Type', width: '11%', type: 'select', options: ['Part', 'Labour', 'Service'] },
  { key: 'quantity', label: 'Qty', width: '8%', type: 'number', placeholder: '1' },
  { key: 'unit_price', label: 'Unit Price', width: '13%', type: 'number', step: '0.01', placeholder: '0.00' },
  { key: 'discount', label: 'Discount', width: '12%', type: 'number', step: '0.01', placeholder: '0.00' },
  { key: 'note', label: 'Notes', width: '13%', placeholder: 'Note' },
];

export default function QuotesPage() {
  const router = useRouter();
  const { quotations, loading, error, listQuotations, createQuotation, updateQuotation, deleteQuotation } = useQuotations();
  const { technicians, listTechnicians } = useTechnicians();
  const clientId = useSelectedClientId();

  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [jobContext, setJobContext] = useState<DocumentJobContext>({ urgency: 'normal' });
  const [rows, setRows] = useState<WorkRow[]>([emptyRow(), emptyRow(), emptyRow()]);
  const [labour, setLabour] = useState('');
  const [discount, setDiscount] = useState('');
  const [vatPercent, setVatPercent] = useState('5');
  const [repairType, setRepairType] = useState<RepairType | ''>('');
  const [validUntil, setValidUntil] = useState(plusDays(7));
  const [quoteDate, setQuoteDate] = useState(today());
  const [preparedBy, setPreparedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [signatures, setSignatures] = useState<DocumentSignatures>({});

  useEffect(() => {
    if (!clientId) return;
    listQuotations(clientId);
    listTechnicians(clientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const totals = useMemo(() => {
    const itemsSubtotal = rows.reduce((sum, r) => sum + Math.max(0, num(r.quantity) * num(r.unit_price) - num(r.discount)), 0);
    const subtotal = itemsSubtotal + num(labour);
    const afterDiscount = Math.max(0, subtotal - num(discount));
    const vat = afterDiscount * (num(vatPercent) / 100);
    return { subtotal, vat, total: afterDiscount + vat };
  }, [rows, labour, discount, vatPercent]);

  const lineAmount = (r: WorkRow) => {
    const amt = Math.max(0, num(r.quantity) * num(r.unit_price) - num(r.discount));
    return r.quantity || r.unit_price ? money(amt) : '—';
  };

  const resetForm = () => {
    setJobContext({ urgency: 'normal' });
    setRows([emptyRow(), emptyRow(), emptyRow()]);
    setLabour(''); setDiscount(''); setVatPercent('5'); setRepairType('');
    setValidUntil(plusDays(7)); setQuoteDate(today()); setPreparedBy(''); setNotes('');
    setSignatures({});
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

    const items: QuotationItem[] = rows
      .filter((r) => r.description.trim())
      .map((r) => ({
        description: r.note ? `${r.description} (${r.note})` : r.description,
        item_type: (r.item_type.toLowerCase() as QuotationItem['item_type']) || 'part',
        quantity: num(r.quantity) || 1,
        unit_price: Math.max(0, num(r.unit_price) - num(r.discount) / (num(r.quantity) || 1)),
      }));

    if (num(labour) > 0) {
      items.push({ description: 'Labour / Call-Out Charge', item_type: 'labour', quantity: 1, unit_price: num(labour) });
    }

    if (items.length === 0) {
      setFormError('Add at least one line item, or a labour charge, before saving.');
      return;
    }

    try {
      const created = await createQuotation(clientId, {
        ...jobContext,
        items,
        discount_amount: num(discount),
        vat_percent: num(vatPercent),
        notes,
        valid_until: validUntil,
        repair_type: repairType || undefined,
        signatures: preparedBy ? { ...signatures, prepared_by: { name: preparedBy, date: quoteDate } } : signatures,
      });
      resetForm();
      // Straight to the printable/sendable document instead of leaving the
      // office on this list — this IS the "one page" the create flow was
      // missing: fill in details, land immediately on the finished document.
      router.push(`/quotes/${created.id}`);
    } catch {
      // createQuotation already surfaced the message via `error`
    }
  };

  const handleApprove = async (quotationId: string) => {
    if (!clientId) return;
    if (!confirm('Approve this quotation? This automatically creates its invoice.')) return;
    setMessage('');
    try {
      const updated = await updateQuotation(clientId, quotationId, { status: 'approved', approval_channel: 'app' });
      setMessage(updated.generated_invoice
        ? `Approved — invoice ${updated.generated_invoice.invoice_number} was created automatically.`
        : 'Approved — an invoice already existed for this job.');
    } catch (err) {
      console.error('Error approving quotation:', err);
    }
  };

  const handleReject = async (quotationId: string) => {
    if (!clientId) return;
    if (!confirm('Mark this quotation as rejected?')) return;
    try {
      await updateQuotation(clientId, quotationId, { status: 'rejected' });
    } catch (err) {
      console.error('Error rejecting quotation:', err);
    }
  };

  const handleDelete = async (quotationId: string) => {
    if (!clientId) return;
    if (!confirm('Delete this draft quotation? This cannot be undone.')) return;
    try {
      await deleteQuotation(clientId, quotationId);
    } catch (err) {
      console.error('Error deleting quotation:', err);
    }
  };

  const statusColor = (status: string) => ({
    draft: 'bg-slate-800 text-slate-400',
    sent: 'bg-amber-500/10 text-amber-400',
    approved: 'bg-emerald-500/10 text-emerald-400',
    rejected: 'bg-red-500/10 text-red-400',
    expired: 'bg-slate-800 text-slate-500',
  }[status] || 'bg-slate-800 text-slate-400');

  return (
    <div className="doc-theme px-4 py-4 bg-slate-950 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold text-white mb-4">Quotations</h1>

        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm px-4 py-3 rounded-md mb-4">{message}</div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-md mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="meta-row">
            <div className="meta-card hi">
              <div className="meta-label">Quotation No.</div>
              <input className="meta-input" value="Auto-generated on save" readOnly />
            </div>
            <div className="meta-card">
              <div className="meta-label">Date</div>
              <input className="meta-input" type="date" value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} />
            </div>
            <div className="meta-card">
              <div className="meta-label">Valid Until</div>
              <input className="meta-input" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </div>
            <div className="meta-card">
              <div className="meta-label">Prepared By</div>
              <input className="meta-input" value={preparedBy} placeholder="Your name" onChange={(e) => setPreparedBy(e.target.value)} />
            </div>
          </div>

          <JobContextFields value={jobContext} onChange={setJobContext} technicians={technicians} />

          <DocSection title="Repair Type" icon="🛠️" accent="blue">
            <div className="fg c2">
              <div className="field">
                <label htmlFor="q-repair-type">Repair Type</label>
                <select id="q-repair-type" value={repairType} onChange={(e) => setRepairType(e.target.value as RepairType)}>
                  <option value="">— Select —</option>
                  {REPAIR_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="q-vat">VAT %</label>
                <input id="q-vat" type="number" min={0} max={100} value={vatPercent} onChange={(e) => setVatPercent(e.target.value)} />
              </div>
            </div>
          </DocSection>

          <DocSection title="Scope of Work &amp; Cost Breakdown" icon="📋" accent="blue" flush>
            <LineItemsTable
              columns={COLUMNS}
              rows={rows}
              onChange={setRows}
              onAdd={() => setRows([...rows, emptyRow()])}
              computed={lineAmount}
              footer={
                <tfoot>
                  {/* 9 columns total: #, description, type, qty, unit, discount, note, amount, delete */}
                  <tr className="labour-row">
                    <td className="row-num">★</td>
                    <td colSpan={3}><span className="labour-label">Labour / Call-Out Charge</span></td>
                    <td>
                      <input type="number" min={0} step="0.01" placeholder="0.00" value={labour}
                        onChange={(e) => setLabour(e.target.value)} aria-label="Labour charge" />
                    </td>
                    <td /><td />
                    <td className="amt-cell">{num(labour) ? money(num(labour)) : '—'}</td>
                    <td />
                  </tr>
                </tfoot>
              }
            />
            <div className="totals-wrap">
              <div className="totals-box">
                <div className="tot-row"><span className="tot-lbl">Subtotal</span><span className="tot-val">{money(totals.subtotal)}</span></div>
                <div className="tot-row">
                  <span className="tot-lbl">Overall Discount</span>
                  <span className="tot-val">
                    <input className="tot-input" type="number" min={0} step="0.01" placeholder="0.00" value={discount}
                      onChange={(e) => setDiscount(e.target.value)} aria-label="Overall discount" />
                  </span>
                </div>
                <div className="tot-row"><span className="tot-lbl">VAT {num(vatPercent)}%</span><span className="tot-val">{money(totals.vat)}</span></div>
                <div className="tot-divider" />
                <div className="tot-row grand"><span className="tot-lbl">TOTAL DUE</span><span className="tot-val">{money(totals.total)}</span></div>
              </div>
            </div>
          </DocSection>

          <DocSection title="Notes" icon="📝" accent="gray">
            <div className="field">
              <label htmlFor="q-notes">Additional Notes</label>
              <textarea id="q-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything the customer should know…" />
            </div>
          </DocSection>

          <DocSection title="Payment Terms &amp; Conditions" icon="📃" accent="gray">
            <div className="terms-box">
              <ul>{STANDARD_TERMS.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </div>
          </DocSection>

          <DocSection title="Signatures &amp; Acknowledgement" icon="✍️" accent="gold">
            <SignatureBlock roles={SIGNATURE_ROLES} value={signatures} onChange={setSignatures} />
          </DocSection>

          {formError && <p className="text-xs text-red-400 mb-3">{formError}</p>}
          <ActionButton type="submit" disabled={loading} text={loading ? 'Creating…' : 'Create Quotation'} />
        </form>

        <div className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden mt-8">
          <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">All Quotations</h2>
            <span className="text-xs text-slate-400">{quotations.length} total</span>
          </div>

          {quotations.length === 0 ? (
            <div className="px-5 py-12 text-center"><p className="text-sm text-slate-500">No quotations yet.</p></div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-5 py-2 font-medium">Quote No</th>
                  <th className="px-5 py-2 font-medium">Customer</th>
                  <th className="px-5 py-2 font-medium text-right">Total</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                  <th className="px-5 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {quotations.map((q) => (
                  <tr key={q.id} onClick={() => router.push(`/quotes/${q.id}`)}
                    className="border-b border-slate-800 last:border-0 cursor-pointer hover:bg-slate-950">
                    <td className="px-5 py-3 font-medium text-white">{q.quotation_number}</td>
                    <td className="px-5 py-3 text-slate-400">{q.customer_name || 'Unassigned'}</td>
                    <td className="px-5 py-3 text-right text-white font-medium">AED {Number(q.total_amount).toFixed(2)}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(q.status)}`}>{q.status}</span>
                    </td>
                    <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2 justify-end">
                        {(q.status === 'draft' || q.status === 'sent') && (
                          <>
                            <ActionButton text="Approve" variant="success" showArrow={false}
                              className="!px-3 !py-1 !text-xs" onClick={() => handleApprove(q.id)} />
                            <button onClick={() => handleReject(q.id)}
                              className="px-3 py-1 text-xs font-medium text-red-400 hover:text-red-300 border border-red-900/50 rounded-md">
                              Reject
                            </button>
                          </>
                        )}
                        {q.status === 'draft' && (
                          <button onClick={() => handleDelete(q.id)} className="text-xs font-medium text-red-400 hover:text-red-300">
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
