'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuotations } from '@/hooks/useQuotations';
import { useJobs } from '@/hooks/useJobs';
import { useClients, Client } from '@/hooks/useClients';
import { ActionButton } from '@/components/ui/action-button';
import { QuotationPreview } from '@/components/documents/QuotationPreview';

export default function QuotesPage() {
  const router = useRouter();
  const { quotations, loading, error, listQuotations, createQuotation, updateQuotation } = useQuotations();
  const { jobs, listJobs } = useJobs();
  const { getClient } = useClients();
  const [previewClient, setPreviewClient] = useState<Client | null>(null);
  const [clientId, setClientId] = useState('');
  const [approveMessage, setApproveMessage] = useState('');
  const [formData, setFormData] = useState({
    job_id: '',
    items: [{ description: '', item_type: 'part' as const, quantity: 1, unit_price: 0 }],
    discount_amount: 0,
    vat_percent: 5,
    notes: '',
  });

  useEffect(() => {
    const stored = localStorage.getItem('selectedClientId');
    if (stored) {
      setClientId(stored);
      listQuotations(stored);
      // Jobs without a quotation yet are the ones worth quoting — inspected
      // jobs are the common case (findings already known), but "new"/
      // "scheduled" jobs can be quoted directly too.
      listJobs(stored);
      getClient(stored).then(setPreviewClient);
    }
  }, [listQuotations, listJobs, getClient]);

  const quotableJobs = jobs.filter((j) => !['quoted', 'approved', 'completed', 'cancelled'].includes(j.status));
  const selectedJob = jobs.find((j) => j.id === formData.job_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    try {
      await createQuotation(clientId, {
        job_id: formData.job_id,
        items: formData.items.filter((i) => i.description),
        discount_amount: formData.discount_amount,
        vat_percent: formData.vat_percent,
        notes: formData.notes,
      });
      setFormData({ job_id: '', items: [{ description: '', item_type: 'part', quantity: 1, unit_price: 0 }], discount_amount: 0, vat_percent: 5, notes: '' });
    } catch (err) {
      console.error('Error creating quotation:', err);
    }
  };

  const handleApprove = async (quotationId: string) => {
    if (!clientId) return;
    setApproveMessage('');
    try {
      const updated = await updateQuotation(clientId, quotationId, { status: 'approved', approval_channel: 'app' });
      if (updated.generated_invoice) {
        setApproveMessage(`Approved — invoice ${updated.generated_invoice.invoice_number} was created automatically.`);
      } else {
        setApproveMessage('Approved — an invoice already existed for this job.');
      }
    } catch (err) {
      console.error('Error approving quotation:', err);
    }
  };

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-slate-800 text-slate-400',
      sent: 'bg-amber-500/10 text-amber-400',
      approved: 'bg-emerald-500/10 text-emerald-400',
      rejected: 'bg-red-500/10 text-red-400',
      expired: 'bg-slate-800 text-slate-500',
    };
    return colors[status] || 'bg-slate-800 text-slate-400';
  };

  return (
    <div className="p-8 bg-slate-950 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-white">Quotations</h1>
          </div>
        </div>

        {approveMessage && (
          <div className="bg-emerald-500/10 border border-emerald-200 text-emerald-300 text-sm px-4 py-3 rounded-md mb-6">
            {approveMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
        <div className="bg-slate-900 border border-slate-800 rounded-md">
            <div className="px-5 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-300">New Quotation</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Job</label>
                <select
                  value={formData.job_id}
                  onChange={(e) => setFormData({ ...formData, job_id: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="" disabled>Select a job to quote…</option>
                  {quotableJobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.customer_name || 'Unassigned'} — {j.appliance_type}{j.reported_fault ? ` (${j.reported_fault})` : ''}
                    </option>
                  ))}
                </select>
                {quotableJobs.length === 0 && (
                  <p className="text-xs text-slate-600 mt-1">No open jobs waiting on a quotation. Create a job or complete an inspection first.</p>
                )}
                {selectedJob?.diagnosis && (
                  <p className="text-xs text-slate-500 mt-2 bg-slate-950 border border-slate-800 rounded px-3 py-2">
                    <span className="text-slate-400 font-medium">Inspection notes: </span>{selectedJob.diagnosis}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">Line Items</label>
                <div className="border border-slate-800 rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800 text-left text-xs text-slate-500 uppercase tracking-wide">
                        <th className="px-3 py-2 font-medium">Description</th>
                        <th className="px-3 py-2 font-medium w-28">Type</th>
                        <th className="px-3 py-2 font-medium w-20">Qty</th>
                        <th className="px-3 py-2 font-medium w-28">Unit Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-800 last:border-0">
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => { const next = [...formData.items]; next[idx] = { ...next[idx], description: e.target.value }; setFormData({ ...formData, items: next }); }}
                              className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-sm text-white placeholder:text-slate-600"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={item.item_type}
                              onChange={(e) => { const next = [...formData.items]; next[idx] = { ...next[idx], item_type: e.target.value as any }; setFormData({ ...formData, items: next }); }}
                              className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-sm text-white placeholder:text-slate-600"
                            >
                              <option value="part">Part</option>
                              <option value="labour">Labour</option>
                              <option value="service">Service</option>
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => { const next = [...formData.items]; next[idx] = { ...next[idx], quantity: parseInt(e.target.value) || 1 }; setFormData({ ...formData, items: next }); }}
                              className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-sm text-white placeholder:text-slate-600"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) => { const next = [...formData.items]; next[idx] = { ...next[idx], unit_price: parseFloat(e.target.value) || 0 }; setFormData({ ...formData, items: next }); }}
                              className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-sm text-white placeholder:text-slate-600"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, items: [...formData.items, { description: '', item_type: 'part', quantity: 1, unit_price: 0 }] })}
                  className="text-xs text-blue-400 font-medium mt-2"
                >
                  + Add line item
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Discount (AED)</label>
                  <input type="number" value={formData.discount_amount} onChange={(e) => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">VAT %</label>
                  <input type="number" value={formData.vat_percent} onChange={(e) => setFormData({ ...formData, vat_percent: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600" />
              </div>

              <p className="text-xs text-slate-600">Standard terms &amp; conditions are shown on the preview and applied automatically.</p>

              <ActionButton type="submit" disabled={loading} text={loading ? 'Creating...' : 'Create Quotation'} />
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-md">
            <div className="px-5 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-300">Live Preview</h2>
            </div>
            <div className="p-5 lg:sticky lg:top-6">
              <QuotationPreview
                client={previewClient}
                customerName={selectedJob?.customer_name}
                items={formData.items}
                discountAmount={formData.discount_amount}
                vatPercent={formData.vat_percent}
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
            <h2 className="text-sm font-semibold text-slate-300">All Quotations</h2>
            <span className="text-xs text-slate-400">{quotations.length} total</span>
          </div>

          {quotations.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-slate-500">No quotations yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-5 py-2 font-medium">Quote No</th>
                  <th className="px-5 py-2 font-medium">Customer</th>
                  <th className="px-5 py-2 font-medium text-right">Total</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                  <th className="px-5 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((q) => (
                  <tr
                    key={q.id}
                    onClick={() => router.push(`/quotes/${q.id}`)}
                    className="border-b border-slate-800 last:border-0 cursor-pointer hover:bg-slate-950"
                  >
                    <td className="px-5 py-3 font-medium text-white">{q.quotation_number}</td>
                    <td className="px-5 py-3 text-slate-400">{q.customer_name || 'Unassigned'}</td>
                    <td className="px-5 py-3 text-right text-white font-medium">AED {Number(q.total_amount).toFixed(2)}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(q.status)}`}>{q.status}</span>
                    </td>
                    <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      {(q.status === 'draft' || q.status === 'sent') && (
                        <ActionButton
                          text="Approve"
                          variant="success"
                          showArrow={false}
                          className="!px-3 !py-1 !text-xs"
                          onClick={() => handleApprove(q.id)}
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
