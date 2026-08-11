'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInvoices } from '@/hooks/useInvoices';
import { useCustomers } from '@/hooks/useCustomers';
import { useClients, Client } from '@/hooks/useClients';
import { ActionButton } from '@/components/ui/action-button';
import { InvoicePreview } from '@/components/documents/InvoicePreview';

export default function InvoicesPage() {
  const router = useRouter();
  const { invoices, loading, error, listInvoices, createInvoice, updateInvoice } = useInvoices();
  const { customers, listCustomers } = useCustomers();
  const { getClient } = useClients();
  const [previewClient, setPreviewClient] = useState<Client | null>(null);
  const [clientId, setClientId] = useState('');
  const [formData, setFormData] = useState({
    customer_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    const stored = localStorage.getItem('selectedClientId');
    if (stored) {
      setClientId(stored);
      listInvoices(stored);
      listCustomers({ clientId: stored });
      getClient(stored).then(setPreviewClient);
    }
  }, [listInvoices, listCustomers, getClient]);

  const selectedCustomer = customers.find((c) => c.id === formData.customer_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    try {
      await createInvoice(clientId, formData);
      setFormData({ customer_id: '', issue_date: new Date().toISOString().split('T')[0], due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], notes: '' });
    } catch (err) {
      console.error('Error creating invoice:', err);
    }
  };

  const handleMarkPaid = async (invoiceId: string, totalAmount: number) => {
    if (!clientId) return;
    try {
      await updateInvoice(clientId, invoiceId, { status: 'paid', paid_amount: totalAmount });
    } catch (err) {
      console.error('Error marking invoice paid:', err);
    }
  };

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-slate-800 text-slate-400',
      sent: 'bg-blue-500/10 text-blue-700',
      partial: 'bg-amber-500/10 text-amber-400',
      paid: 'bg-emerald-500/10 text-emerald-400',
      overdue: 'bg-red-500/10 text-red-400',
      cancelled: 'bg-slate-800 text-slate-500',
    };
    return colors[status] || 'bg-slate-800 text-slate-400';
  };

  return (
    <div className="p-8 bg-slate-950 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-white">Invoices</h1>
            <p className="text-sm text-slate-500 mt-1">
              Most invoices generate automatically when a quotation is approved. Use this form only for one-off invoices.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-start">
        <div className="bg-slate-900 border border-slate-800 rounded-md">
            <div className="px-5 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-300">New Manual Invoice</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Customer</label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="" disabled>Select a customer…</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.phone ? ` — ${c.phone}` : ''}
                    </option>
                  ))}
                </select>
                {customers.length === 0 && (
                  <p className="text-xs text-slate-600 mt-1">No customers yet. Add one in the Customers section first.</p>
                )}
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
              <ActionButton type="submit" disabled={loading} text={loading ? 'Creating...' : 'Create Invoice'} />
            </form>
          </div>

          <div className="lg:sticky lg:top-6">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Live Preview</p>
            <InvoicePreview
              client={previewClient}
              customerName={selectedCustomer?.name}
              dueDate={formData.due_date}
              notes={formData.notes}
            />
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

          {invoices.length === 0 ? (
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
                {invoices.map((inv) => (
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
                      {(inv.status === 'draft' || inv.status === 'sent' || inv.status === 'overdue') && (
                        <ActionButton
                          text="Mark Paid"
                          variant="success"
                          showArrow={false}
                          className="!px-3 !py-1 !text-xs"
                          onClick={() => handleMarkPaid(inv.id, inv.total_amount)}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
