'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInvoices, Invoice } from '@/hooks/useInvoices';
import { useSelectedClientId } from '@/hooks/useSelectedClientId';
import { ActionButton } from '@/components/ui/action-button';
import { DocSection } from '@/components/documents/DocSection';
import { LineItemsTable, LineColumn } from '@/components/documents/LineItemsTable';

/** One editable invoice line. Strings because they're bound directly to
 *  inputs; parsed only when totalling. */
interface InvoiceRow extends Record<string, unknown> {
  description: string;
  quantity: string;
  unit_price: string;
}

const emptyRow = (): InvoiceRow => ({ description: '', quantity: '1', unit_price: '' });
const num = (v: unknown) => Number(v) || 0;
const money = (n: number) => `AED ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (d: number) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);

const COLUMNS: LineColumn<InvoiceRow>[] = [
  { key: 'description', label: 'Description', width: '48%', placeholder: 'Description of work or part…' },
  { key: 'quantity', label: 'Qty', width: '12%', type: 'number', placeholder: '1' },
  { key: 'unit_price', label: 'Unit Price (AED)', width: '20%', type: 'number', step: '0.01', placeholder: '0.00' },
];

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Cheque', 'Credit Card', 'Online Payment'];

export default function InvoicesPage() {
  const router = useRouter();
  const { invoices, loading, error, listInvoices, createInvoice, updateInvoice, deleteInvoice } = useInvoices();
  const clientId = useSelectedClientId();

  const [formError, setFormError] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [issueDate, setIssueDate] = useState(today());
  const [dueDate, setDueDate] = useState(plusDays(30));
  const [preparedBy, setPreparedBy] = useState('');
  const [rows, setRows] = useState<InvoiceRow[]>([emptyRow(), emptyRow(), emptyRow()]);
  const [labour, setLabour] = useState('');
  const [notes, setNotes] = useState('');

  const [payingId, setPayingId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');

  useEffect(() => {
    if (!clientId) return;
    listInvoices(clientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const totals = useMemo(() => {
    const itemsSubtotal = rows.reduce((sum, r) => sum + num(r.quantity) * num(r.unit_price), 0);
    const subtotal = itemsSubtotal + num(labour);
    const vat = subtotal * 0.05;
    return { subtotal, vat, total: subtotal + vat };
  }, [rows, labour]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    setFormError('');

    const lines = rows
      .filter((r) => r.description.trim() && num(r.unit_price) > 0)
      .map((r) => ({
        description: num(r.quantity) > 1 ? `${r.description} × ${num(r.quantity)}` : r.description,
        amount: num(r.quantity) * num(r.unit_price),
      }));

    if (num(labour) > 0) {
      lines.push({ description: 'Labour / Call-Out Charge', amount: num(labour) });
    }

    if (lines.length === 0) {
      setFormError('Add at least one item with an amount, or a labour charge.');
      return;
    }

    try {
      await createInvoice(clientId, {
        customer_name: customerName,
        issue_date: issueDate,
        due_date: dueDate,
        notes: preparedBy ? `${notes}${notes ? '\n' : ''}Prepared by: ${preparedBy}` : notes,
        line_items: lines,
      });
      setCustomerName(''); setRows([emptyRow(), emptyRow(), emptyRow()]);
      setLabour(''); setNotes(''); setPreparedBy('');
      setIssueDate(today()); setDueDate(plusDays(30));
    } catch (err) {
      console.error('Error creating invoice:', err);
    }
  };

  const startMarkPaid = (invoiceId: string, remaining: number) => {
    setPayingId(invoiceId);
    setPayAmount(remaining.toFixed(2));
    setPayMethod('Cash');
  };

  const confirmMarkPaid = async (invoice: Invoice) => {
    if (!clientId) return;
    const amount = parseFloat(payAmount) || 0;
    const remaining = Number(invoice.total_amount) - Number(invoice.paid_amount);
    try {
      await updateInvoice(clientId, invoice.id, {
        status: amount >= remaining ? 'paid' : 'partial',
        paid_amount: Number(invoice.paid_amount) + amount,
        notes: `${invoice.notes || ''}${invoice.notes ? '\n' : ''}Payment ${money(amount)} via ${payMethod} on ${today()}`,
      });
      setPayingId(null);
    } catch (err) {
      console.error('Error marking invoice paid:', err);
    }
  };

  const handleDelete = async (invoiceId: string) => {
    if (!clientId) return;
    if (!confirm('Delete this draft invoice? This cannot be undone.')) return;
    try {
      await deleteInvoice(clientId, invoiceId);
    } catch (err) {
      console.error('Error deleting invoice:', err);
    }
  };

  const statusColor = (status: string) => ({
    draft: 'bg-slate-800 text-slate-400',
    sent: 'bg-blue-500/10 text-blue-400',
    partial: 'bg-amber-500/10 text-amber-400',
    paid: 'bg-emerald-500/10 text-emerald-400',
    overdue: 'bg-red-500/10 text-red-400',
    cancelled: 'bg-slate-800 text-slate-500',
  }[status] || 'bg-slate-800 text-slate-400');

  return (
    <div className="doc-theme px-4 py-4 bg-slate-950 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold text-white mb-4">Invoices</h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-md mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="meta-row">
            <div className="meta-card hi">
              <div className="meta-label">Invoice No.</div>
              <input className="meta-input" value="Auto-generated on save" readOnly />
            </div>
            <div className="meta-card">
              <div className="meta-label">Invoice Date</div>
              <input className="meta-input" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
            </div>
            <div className="meta-card">
              <div className="meta-label">Due Date</div>
              <input className="meta-input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="meta-card">
              <div className="meta-label">Prepared By</div>
              <input className="meta-input" value={preparedBy} placeholder="Your name" onChange={(e) => setPreparedBy(e.target.value)} />
            </div>
          </div>

          <DocSection title="Bill To — Customer Details" icon="🏢" accent="blue">
            <div className="fg c2">
              <div className="field full">
                <label htmlFor="inv-customer">Customer / Company Name</label>
                <input id="inv-customer" value={customerName} placeholder="e.g. Ahmed Al Rashidi"
                  onChange={(e) => setCustomerName(e.target.value)} />
              </div>
            </div>
          </DocSection>

          <DocSection title="Invoice Items" icon="💰" accent="green" flush>
            <LineItemsTable
              columns={COLUMNS}
              rows={rows}
              onChange={setRows}
              onAdd={() => setRows([...rows, emptyRow()])}
              addLabel="＋ Add Item"
              computed={(r) => (r.quantity || r.unit_price ? money(num(r.quantity) * num(r.unit_price)) : '—')}
              footer={
                <tfoot>
                  {/* 6 columns total: #, description, qty, unit, amount, delete */}
                  <tr className="labour-row">
                    <td className="row-num">★</td>
                    <td colSpan={2}><span className="labour-label">Labour / Call-Out Charge</span></td>
                    <td>
                      <input type="number" min={0} step="0.01" placeholder="0.00" value={labour}
                        onChange={(e) => setLabour(e.target.value)} aria-label="Labour charge" />
                    </td>
                    <td className="amt-cell">{num(labour) ? money(num(labour)) : '—'}</td>
                    <td />
                  </tr>
                </tfoot>
              }
            />
            <div className="totals-wrap">
              <div className="totals-box">
                <div className="tot-row"><span className="tot-lbl">Subtotal</span><span className="tot-val">{money(totals.subtotal)}</span></div>
                <div className="tot-row"><span className="tot-lbl">VAT 5%</span><span className="tot-val">{money(totals.vat)}</span></div>
                <div className="tot-divider" />
                <div className="tot-row grand"><span className="tot-lbl">TOTAL DUE</span><span className="tot-val">{money(totals.total)}</span></div>
              </div>
            </div>
          </DocSection>

          <DocSection title="Notes" icon="📝" accent="gray">
            <div className="field">
              <label htmlFor="inv-notes">Work Completed / Notes</label>
              <textarea id="inv-notes" value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Brief description of all work done and parts replaced…" />
            </div>
          </DocSection>

          {formError && <p className="text-xs text-red-400 mb-3">{formError}</p>}
          <ActionButton type="submit" disabled={loading} text={loading ? 'Creating…' : 'Create Invoice'} />
        </form>

        <div className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden mt-8">
          <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">All Invoices</h2>
            <span className="text-xs text-slate-400">{invoices.length} total</span>
          </div>

          {invoices.length === 0 ? (
            <div className="px-5 py-12 text-center"><p className="text-sm text-slate-500">No invoices yet.</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-5 py-2 font-medium">Invoice No</th>
                  <th className="px-5 py-2 font-medium">Customer</th>
                  <th className="px-5 py-2 font-medium">Due</th>
                  <th className="px-5 py-2 font-medium text-right">Total</th>
                  <th className="px-5 py-2 font-medium text-right">Balance</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                  <th className="px-5 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const remaining = Number(inv.total_amount) - Number(inv.paid_amount);
                  return (
                    <tr key={inv.id} onClick={() => router.push(`/invoices/${inv.id}`)}
                      className="border-b border-slate-800 last:border-0 cursor-pointer hover:bg-slate-950">
                      <td className="px-5 py-3 font-medium text-white">{inv.invoice_number}</td>
                      <td className="px-5 py-3 text-slate-400">{inv.customer_name || 'Unassigned'}</td>
                      <td className="px-5 py-3 text-slate-400">
                        {inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-GB') : '—'}
                      </td>
                      <td className="px-5 py-3 text-right text-white font-medium">AED {Number(inv.total_amount).toFixed(2)}</td>
                      <td className={`px-5 py-3 text-right font-medium ${remaining > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        AED {remaining.toFixed(2)}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(inv.status)}`}>{inv.status}</span>
                      </td>
                      <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {payingId === inv.id ? (
                          <div className="flex gap-2 justify-end items-center">
                            <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}
                              className="px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-white">
                              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <input type="number" min={0} step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                              className="w-24 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-white text-right"
                              aria-label="Payment amount" />
                            <ActionButton text="Confirm" variant="success" showArrow={false}
                              className="!px-3 !py-1 !text-xs" onClick={() => confirmMarkPaid(inv)} />
                            <button onClick={() => setPayingId(null)} className="text-xs text-slate-500 hover:text-slate-300">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-end">
                            {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                              <ActionButton text="Mark Paid" variant="success" showArrow={false}
                                className="!px-3 !py-1 !text-xs" onClick={() => startMarkPaid(inv.id, remaining)} />
                            )}
                            {inv.status === 'draft' && (
                              <button onClick={() => handleDelete(inv.id)} className="text-xs font-medium text-red-400 hover:text-red-300">
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
