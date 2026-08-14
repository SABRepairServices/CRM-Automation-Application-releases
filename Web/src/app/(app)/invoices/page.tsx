'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInvoices } from '@/hooks/useInvoices';
import { useClients, Client } from '@/hooks/useClients';
import { useSelectedClientId } from '@/hooks/useSelectedClientId';
import { ActionButton } from '@/components/ui/action-button';
import { InvoicePreview } from '@/components/documents/InvoicePreview';

const EMPTY_FORM = {
  customer_name: '',
  issue_date: new Date().toISOString().split('T')[0],
  due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  notes: '',
};

export default function InvoicesPage() {
  const router = useRouter();
  const { invoices, loading, error, listInvoices, createInvoice, updateInvoice, deleteInvoice } = useInvoices();
  const { getClient } = useClients();
  const [previewClient, setPreviewClient] = useState<Client | null>(null);
  const clientId = useSelectedClientId();
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [lineItems, setLineItems] = useState<Array<{ description: string; amount: number }>>([{ description: '', amount: 0 }]);
  const [formError, setFormError] = useState('');
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');

  useEffect(() => {
    if (!clientId) return;
    listInvoices(clientId);
    getClient(clientId).then(setPreviewClient);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const addLine = () => setLineItems([...lineItems, { description: '', amount: 0 }]);
  const removeLine = (idx: number) => setLineItems(lineItems.filter((_, i) => i !== idx));
  const updateLine = (idx: number, patch: Partial<{ description: string; amount: number }>) => {
    setLineItems(lineItems.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const validLines = lineItems.filter((l) => l.description && l.amount > 0);
    if (validLines.length === 0) {
      setFormError('Add at least one item with an amount.');
      return;
    }
    if (!clientId) return;
    try {
      await createInvoice(clientId, { ...formData, line_items: validLines });
      setFormData(EMPTY_FORM);
      setLineItems([{ description: '', amount: 0 }]);
    } catch (err) {
      console.error('Error creating invoice:', err);
    }
  };

  const startMarkPaid = (invoiceId: string, remaining: number) => {
    setPayingId(invoiceId);
    setPayAmount(remaining.toFixed(2));
  };

  const confirmMarkPaid = async (invoice: (typeof invoices)[number]) => {
    if (!clientId) return;
    const amount = parseFloat(payAmount) || 0;
    const remaining = Number(invoice.total_amount) - Number(invoice.paid_amount);
    try {
      await updateInvoice(clientId, invoice.id, {
        status: amount >= remaining ? 'paid' : 'partial',
        paid_amount: Number(invoice.paid_amount) + amount,
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

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-slate-800 text-slate-400',
      sent: 'bg-blue-500/10 text-blue-400',
      partial: 'bg-amber-500/10 text-amber-400',
      paid: 'bg-emerald-500/10 text-emerald-400',
      overdue: 'bg-red-500/10 text-red-400',
      cancelled: 'bg-slate-800 text-slate-500',
    };
    return colors[status] || 'bg-slate-800 text-slate-400';
  };

  return (
    <div className="px-4 py-4 bg-slate-950 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-white">Invoices</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
        <div className="bg-slate-900 border border-slate-800 rounded-md">
            <div className="px-5 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-300">New Manual Invoice</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  placeholder="e.g. Ahmed Al Rashidi"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">Line Items</label>
                <div className="space-y-2">
                  {lineItems.map((line, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Description"
                        value={line.description}
                        onChange={(e) => updateLine(idx, { description: e.target.value })}
                        className="flex-1 px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-sm text-white placeholder:text-slate-600"
                      />
                      <input
                        type="number"
                        placeholder="AED"
                        value={line.amount || ''}
                        onChange={(e) => updateLine(idx, { amount: parseFloat(e.target.value) || 0 })}
                        min={0}
                        className="w-28 px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-sm text-white"
                      />
                      <button type="button" onClick={() => removeLine(idx)} className="text-xs text-red-400 hover:text-red-300 px-2">✕</button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addLine} className="text-xs text-blue-400 font-medium mt-2">
                  + Add item
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Issue Date</label>
                  <input type="date" value={formData.issue_date} onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })} required className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Due Date</label>
                  <input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} required className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600" />
              </div>
              {formError && <p className="text-xs text-red-400">{formError}</p>}
              <ActionButton type="submit" disabled={loading} text={loading ? 'Creating...' : 'Create Invoice'} />
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-md">
            <div className="px-5 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-300">Live Preview</h2>
            </div>
            <div className="p-5 lg:sticky lg:top-6">
              <InvoicePreview
                client={previewClient}
                customerName={formData.customer_name}
                dueDate={formData.due_date}
                notes={formData.notes}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-200 text-red-400 text-sm px-4 py-3 rounded-md mb-6">{error}</div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">All Invoices</h2>
            <span className="text-xs text-slate-400">{invoices.length} total</span>
          </div>

          {!clientId ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-slate-500">Select a client from the dropdown in the header to see invoices.</p>
            </div>
          ) : loading ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-slate-500">Loading...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-slate-500">No invoices yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-5 py-2 font-medium">Invoice No</th>
                  <th className="px-5 py-2 font-medium">Customer</th>
                  <th className="px-5 py-2 font-medium">Due</th>
                  <th className="px-5 py-2 font-medium text-right">Total</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                  <th className="px-5 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const remaining = Number(inv.total_amount) - Number(inv.paid_amount);
                  return (
                    <tr
                      key={inv.id}
                      onClick={() => router.push(`/invoices/${inv.id}`)}
                      className="border-b border-slate-800 last:border-0 cursor-pointer hover:bg-slate-950"
                    >
                      <td className="px-5 py-3 font-medium text-white">{inv.invoice_number}</td>
                      <td className="px-5 py-3 text-slate-400">{inv.customer_name || 'Unassigned'}</td>
                      <td className="px-5 py-3 text-slate-400">{new Date(inv.due_date).toLocaleDateString()}</td>
                      <td className="px-5 py-3 text-right text-white font-medium">AED {Number(inv.total_amount).toFixed(2)}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(inv.status)}`}>{inv.status}</span>
                      </td>
                      <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {payingId === inv.id ? (
                          <div className="flex items-center gap-2 justify-end">
                            <input
                              type="number"
                              value={payAmount}
                              onChange={(e) => setPayAmount(e.target.value)}
                              max={remaining}
                              min={0}
                              className="w-20 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                            />
                            <button onClick={() => confirmMarkPaid(inv)} className="text-xs font-medium text-emerald-400 hover:text-emerald-300">Confirm</button>
                            <button onClick={() => setPayingId(null)} className="text-xs font-medium text-slate-400 hover:text-slate-300">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-end">
                            {(inv.status === 'draft' || inv.status === 'sent' || inv.status === 'partial' || inv.status === 'overdue') && (
                              <ActionButton
                                text="Mark Paid"
                                variant="success"
                                showArrow={false}
                                className="!px-3 !py-1 !text-xs"
                                onClick={() => startMarkPaid(inv.id, remaining)}
                              />
                            )}
                            {inv.status === 'draft' && (
                              <button onClick={() => handleDelete(inv.id)} className="text-xs font-medium text-red-400 hover:text-red-300">Delete</button>
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

