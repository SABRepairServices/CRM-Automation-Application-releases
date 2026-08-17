'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useMonthlyInvoices, AvailableJob, PaymentTerms,
  PAYMENT_TERMS_LABELS, MONTH_NAMES,
} from '@/hooks/useMonthlyInvoices';
import { useCustomers } from '@/hooks/useCustomers';
import { useSelectedClientId } from '@/hooks/useSelectedClientId';
import { ActionButton } from '@/components/ui/action-button';
import { DocSection } from '@/components/documents/DocSection';

const money = (n: number) => `AED ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const num = (v: unknown) => Number(v) || 0;
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-GB') : '—');

/** Per-job amounts the office can adjust before issuing the statement.
 *  Keyed by job_id; kept as strings since they're bound to inputs. */
type JobEdits = Record<string, { amount: string; received: string }>;

export default function MonthlyInvoicesPage() {
  const router = useRouter();
  const {
    invoices, loading, error,
    listMonthlyInvoices, listAvailableJobs, createMonthlyInvoice, deleteMonthlyInvoice,
  } = useMonthlyInvoices();
  const { customers, listCustomers } = useCustomers();
  const clientId = useSelectedClientId();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [customerId, setCustomerId] = useState('');
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>('due_on_receipt');
  const [preparedBy, setPreparedBy] = useState('');
  const [toEmail, setToEmail] = useState('');
  const [ccEmail, setCcEmail] = useState('');
  const [notes, setNotes] = useState('');

  const [available, setAvailable] = useState<AvailableJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [edits, setEdits] = useState<JobEdits>({});
  const [formError, setFormError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!clientId) return;
    listMonthlyInvoices(clientId);
    listCustomers({ clientId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const loadJobs = useCallback(async () => {
    if (!clientId) return;
    setLoadingJobs(true);
    setFormError('');
    try {
      const jobs = await listAvailableJobs(clientId, { month, year, customer_id: customerId || undefined });
      setAvailable(jobs);
      setSelected(new Set());
      setEdits(Object.fromEntries(jobs.map((j) => [j.job_id, { amount: String(j.suggested_amount || ''), received: '' }])));
    } catch (err) {
      console.error('Error loading available jobs:', err);
      setFormError('Could not load completed jobs for that period.');
    } finally {
      setLoadingJobs(false);
    }
  }, [clientId, month, year, customerId, listAvailableJobs]);

  // Re-query whenever the period or customer changes — the job list is
  // entirely derived from those three inputs.
  useEffect(() => {
    if (clientId) loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, month, year, customerId]);

  const toggle = (jobId: string) => {
    const next = new Set(selected);
    if (next.has(jobId)) next.delete(jobId); else next.add(jobId);
    setSelected(next);
  };

  const setEdit = (jobId: string, field: 'amount' | 'received', value: string) => {
    setEdits((prev) => ({ ...prev, [jobId]: { ...prev[jobId], [field]: value } }));
  };

  const totals = useMemo(() => {
    let amount = 0, received = 0;
    selected.forEach((jobId) => {
      amount += num(edits[jobId]?.amount);
      received += num(edits[jobId]?.received);
    });
    return { amount, received, pending: Math.max(0, amount - received), count: selected.size };
  }, [selected, edits]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    setFormError('');
    setMessage('');

    if (!customerId) {
      setFormError('Choose which company this statement is for.');
      return;
    }
    if (selected.size === 0) {
      setFormError('Select at least one completed job to include.');
      return;
    }

    try {
      const created = await createMonthlyInvoice(clientId, {
        customer_id: customerId,
        month, year,
        payment_terms: paymentTerms,
        prepared_by: preparedBy,
        to_email: toEmail,
        cc_email: ccEmail,
        notes,
        job_amounts: Array.from(selected).map((jobId) => ({
          job_id: jobId,
          amount: num(edits[jobId]?.amount),
          received_amount: num(edits[jobId]?.received),
        })),
      });
      setMessage(`Monthly invoice ${created.invoice_number} created.`);
      setPreparedBy(''); setToEmail(''); setCcEmail(''); setNotes('');
      loadJobs();
    } catch {
      // createMonthlyInvoice already surfaced the message via `error`
    }
  };

  const handleDelete = async (invoiceId: string) => {
    if (!clientId) return;
    if (!confirm('Delete this draft monthly invoice? Its jobs become available again.')) return;
    try {
      await deleteMonthlyInvoice(clientId, invoiceId);
      loadJobs();
    } catch (err) {
      console.error('Error deleting monthly invoice:', err);
    }
  };

  const statusColor = (status: string) => ({
    draft: 'bg-slate-800 text-slate-400',
    sent: 'bg-blue-500/10 text-blue-400',
    paid: 'bg-emerald-500/10 text-emerald-400',
  }[status] || 'bg-slate-800 text-slate-400');

  return (
    <div className="doc-theme px-4 py-4 bg-slate-950 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold text-white mb-1">Monthly Invoices</h1>
        <p className="text-sm text-slate-500 mb-4">
          One consolidated statement covering every completed job for a company in a given month.
        </p>

        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm px-4 py-3 rounded-md mb-4">{message}</div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-md mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="meta-row">
            <div className="meta-card hi">
              <div className="meta-label">Month</div>
              <select className="meta-input" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div className="meta-card hi">
              <div className="meta-label">Year</div>
              <input className="meta-input" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
            </div>
            <div className="meta-card">
              <div className="meta-label">Company / Client</div>
              <select className="meta-input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">— Select —</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="meta-card">
              <div className="meta-label">Prepared By</div>
              <input className="meta-input" value={preparedBy} placeholder="Your name" onChange={(e) => setPreparedBy(e.target.value)} />
            </div>
          </div>

          <div className="summary-badge">
            <div className="sum-card gold-card">
              <div className="sum-lbl">Total Amount</div>
              <div className="sum-val">{money(totals.amount)}</div>
            </div>
            <div className="sum-card green-card">
              <div className="sum-lbl">Total Received</div>
              <div className="sum-val">{money(totals.received)}</div>
            </div>
            <div className="sum-card red-card">
              <div className="sum-lbl">Total Pending</div>
              <div className="sum-val">{money(totals.pending)}</div>
            </div>
          </div>

          <DocSection title="Monthly Job Log" icon="📊" accent="green" flush>
            <div className="tbl-wrap">
              <div className="overflow-x-auto">
              <table className="items-table">
                <thead>
                  <tr>
                    <th style={{ width: '36px' }}>Add</th>
                    <th style={{ width: '12%' }}>Date</th>
                    <th style={{ width: '14%' }}>Job No.</th>
                    <th style={{ width: '16%' }}>Appliance</th>
                    <th>Work Done</th>
                    <th style={{ width: '14%' }}>Amount</th>
                    <th style={{ width: '14%' }}>Received</th>
                    <th style={{ width: '13%', textAlign: 'right' }}>Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingJobs ? (
                    <tr><td colSpan={8} className="px-3 py-6 text-center text-sm text-slate-500">Loading completed jobs…</td></tr>
                  ) : available.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-6 text-center text-sm text-slate-500">
                        No un-billed completed jobs for {MONTH_NAMES[month - 1]} {year}
                        {customerId ? ' for this company' : ''}.
                      </td>
                    </tr>
                  ) : (
                    available.map((j) => {
                      const isOn = selected.has(j.job_id);
                      const amount = num(edits[j.job_id]?.amount);
                      const received = num(edits[j.job_id]?.received);
                      return (
                        <tr key={j.job_id} className={isOn ? '' : 'opacity-60'}>
                          <td className="text-center">
                            <input type="checkbox" checked={isOn} onChange={() => toggle(j.job_id)}
                              aria-label={`Include job ${j.job_number || ''}`} style={{ width: 'auto' }} />
                          </td>
                          <td className="px-2 text-xs text-slate-400">{fmtDate(j.completed_at)}</td>
                          <td className="px-2 text-xs text-slate-300">{j.job_number || '—'}</td>
                          <td className="px-2 text-xs text-slate-300">{j.appliance_type || '—'}</td>
                          <td className="px-2 text-xs text-slate-400">{j.reported_fault || '—'}</td>
                          <td>
                            <input type="number" min={0} step="0.01" value={edits[j.job_id]?.amount ?? ''}
                              onChange={(e) => setEdit(j.job_id, 'amount', e.target.value)}
                              disabled={!isOn} aria-label="Amount" style={{ textAlign: 'right' }} />
                          </td>
                          <td>
                            <input type="number" min={0} step="0.01" value={edits[j.job_id]?.received ?? ''}
                              onChange={(e) => setEdit(j.job_id, 'received', e.target.value)}
                              disabled={!isOn} aria-label="Received" style={{ textAlign: 'right' }} />
                          </td>
                          <td className="amt-cell">{isOn ? money(Math.max(0, amount - received)) : '—'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              </div>
            </div>
            <div className="totals-wrap">
              <div className="totals-box">
                <div className="tot-row"><span className="tot-lbl">Selected Jobs</span><span className="tot-val">{totals.count}</span></div>
                <div className="tot-row grand"><span className="tot-lbl">TOTAL AMOUNT</span><span className="tot-val">{money(totals.amount)}</span></div>
                <div className="tot-divider" />
                <div className="tot-row received"><span className="tot-lbl">Total Received</span><span className="tot-val">{money(totals.received)}</span></div>
                <div className="tot-row pending"><span className="tot-lbl">Total Pending</span><span className="tot-val">{money(totals.pending)}</span></div>
              </div>
            </div>
          </DocSection>

          <DocSection title="Billing Details" icon="🏢" accent="blue">
            <div className="fg c2">
              <div className="field">
                <label htmlFor="mi-terms">Payment Terms</label>
                <select id="mi-terms" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value as PaymentTerms)}>
                  {(Object.keys(PAYMENT_TERMS_LABELS) as PaymentTerms[]).map((t) => (
                    <option key={t} value={t}>{PAYMENT_TERMS_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="mi-to">To: Email</label>
                <input id="mi-to" type="email" value={toEmail} placeholder="billing@company.com"
                  onChange={(e) => setToEmail(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="mi-cc">CC: (optional)</label>
                <input id="mi-cc" type="email" value={ccEmail} placeholder="manager@company.com"
                  onChange={(e) => setCcEmail(e.target.value)} />
              </div>
              <div className="field full">
                <label htmlFor="mi-notes">Notes</label>
                <textarea id="mi-notes" value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything the client should know about this statement…" />
              </div>
            </div>
          </DocSection>

          {formError && <p className="text-xs text-red-400 mb-3">{formError}</p>}
          <ActionButton type="submit" disabled={loading} text={loading ? 'Creating…' : 'Create Monthly Invoice'} />
        </form>

        <div className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden mt-8">
          <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">All Monthly Invoices</h2>
            <span className="text-xs text-slate-400">{invoices.length} total</span>
          </div>

          {invoices.length === 0 ? (
            <div className="px-5 py-12 text-center"><p className="text-sm text-slate-500">No monthly invoices yet.</p></div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-5 py-2 font-medium">Invoice No</th>
                  <th className="px-5 py-2 font-medium">Period</th>
                  <th className="px-5 py-2 font-medium">Company</th>
                  <th className="px-5 py-2 font-medium text-right">Total</th>
                  <th className="px-5 py-2 font-medium text-right">Pending</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                  <th className="px-5 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {invoices.map((mi) => (
                  <tr key={mi.id} onClick={() => router.push(`/monthly-invoices/${mi.id}`)}
                    className="border-b border-slate-800 last:border-0 cursor-pointer hover:bg-slate-950">
                    <td className="px-5 py-3 font-medium text-white">{mi.invoice_number}</td>
                    <td className="px-5 py-3 text-slate-400">{MONTH_NAMES[mi.month - 1]} {mi.year}</td>
                    <td className="px-5 py-3 text-slate-400">{mi.customer_name || mi.contract_name || '—'}</td>
                    <td className="px-5 py-3 text-right text-white font-medium">AED {Number(mi.subtotal).toFixed(2)}</td>
                    <td className={`px-5 py-3 text-right font-medium ${Number(mi.total_pending) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      AED {Number(mi.total_pending).toFixed(2)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(mi.status)}`}>{mi.status}</span>
                    </td>
                    <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      {mi.status === 'draft' && (
                        <button onClick={() => handleDelete(mi.id)} className="text-xs font-medium text-red-400 hover:text-red-300">
                          Delete
                        </button>
                      )}
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
