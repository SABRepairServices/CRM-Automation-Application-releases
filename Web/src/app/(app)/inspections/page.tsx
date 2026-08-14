'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInspections, InspectionFinding } from '@/hooks/useInspections';
import { useClients, Client } from '@/hooks/useClients';
import { useSelectedClientId } from '@/hooks/useSelectedClientId';
import { ActionButton } from '@/components/ui/action-button';
import { InspectionPreview } from '@/components/documents/InspectionPreview';

export default function InspectionsPage() {
  const router = useRouter();
  const { reports, loading, error, listReports, createReport, updateReport, deleteReport } = useInspections();
  const { getClient } = useClients();
  const [previewClient, setPreviewClient] = useState<Client | null>(null);
  const clientId = useSelectedClientId();
  const [finalizeMessage, setFinalizeMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    customer_name: '',
    inspected_by: '',
    inspected_at: new Date().toISOString().split('T')[0],
    findings: [{ description: '' }] as InspectionFinding[],
    taxable_amount: 0,
    tax_rate: 5,
    notes: '',
  });

  useEffect(() => {
    if (!clientId) return;
    listReports(clientId);
    getClient(clientId).then(setPreviewClient);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    setFormError('');
    const validFindings = formData.findings.filter((f) => f.description);
    if (validFindings.length === 0) {
      setFormError('Add at least one finding before saving.');
      return;
    }
    try {
      await createReport(clientId, {
        customer_name: formData.customer_name,
        inspected_by: formData.inspected_by,
        findings: validFindings,
        taxable_amount: formData.taxable_amount,
        tax_rate: formData.tax_rate,
        notes: formData.notes,
      });
      setFormData({
        customer_name: '',
        inspected_by: '',
        inspected_at: new Date().toISOString().split('T')[0],
        findings: [{ description: '' }],
        taxable_amount: 0,
        tax_rate: 5,
        notes: '',
      });
    } catch (err) {
      console.error('Error creating inspection report:', err);
    }
  };

  const handleFinalize = async (reportId: string) => {
    if (!clientId) return;
    if (!confirm('Finalize this report? This automatically generates its quotation.')) return;
    setFinalizeMessage('');
    try {
      const updated = await updateReport(clientId, reportId, { status: 'final' });
      if (updated.generated_quotation) {
        setFinalizeMessage(`Finalized â€" quotation ${updated.generated_quotation.quotation_number} was created automatically.`);
      } else {
        setFinalizeMessage('Finalized â€" a quotation already existed for this job.');
      }
    } catch (err) {
      console.error('Error finalizing inspection report:', err);
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!clientId) return;
    if (!confirm('Delete this draft inspection report? This cannot be undone.')) return;
    try {
      await deleteReport(clientId, reportId);
    } catch (err) {
      console.error('Error deleting inspection report:', err);
    }
  };

  return (
    <div className="px-4 py-4 bg-slate-950 min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-white">Inspection Reports</h1>
          </div>
        </div>

        {/* New report form â€" mirrors the original Excel Inspection Report layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
        <div className="bg-slate-900 border border-slate-800 rounded-md">
            <div className="px-5 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-300">New Inspection Report</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <label className="block text-xs font-medium text-slate-500 mb-1">Inspected By</label>
                  <input
                    type="text"
                    value={formData.inspected_by}
                    onChange={(e) => setFormData({ ...formData, inspected_by: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.inspected_at}
                    onChange={(e) => setFormData({ ...formData, inspected_at: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Sr No / Description findings table, same shape as the Excel template */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">Findings</label>
                <div className="border border-slate-800 rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800 text-left text-xs text-slate-500 uppercase tracking-wide">
                        <th className="px-4 py-2 font-medium w-16">Sr No</th>
                        <th className="px-4 py-2 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.findings.map((f, idx) => (
                        <tr key={idx} className="border-b border-slate-800 last:border-0">
                          <td className="px-4 py-2 text-slate-500">{idx + 1}</td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              placeholder="e.g. The oven door is damaged and should be replaced"
                              value={f.description}
                              onChange={(e) => {
                                const next = [...formData.findings];
                                next[idx] = { description: e.target.value };
                                setFormData({ ...formData, findings: next });
                              }}
                              className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, findings: [...formData.findings, { description: '' }] })}
                  className="text-xs text-blue-400 font-medium mt-2"
                >
                  + Add finding
                </button>
              </div>

              {/* Tax summary block â€" matches the Excel "Tax Summary / Standard Rate (5%)" section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Taxable Amount (AED)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.taxable_amount}
                    onChange={(e) => setFormData({ ...formData, taxable_amount: Math.max(0, parseFloat(e.target.value) || 0) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.tax_rate}
                    onChange={(e) => setFormData({ ...formData, tax_rate: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {formError && <p className="text-xs text-red-400">{formError}</p>}
              <ActionButton type="submit" disabled={loading} text={loading ? 'Saving...' : 'Save Inspection Report'} />
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-md">
            <div className="px-5 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-300">Live Preview</h2>
            </div>
            <div className="p-5 lg:sticky lg:top-6">
              <InspectionPreview
                client={previewClient}
                customerName={formData.customer_name}
                inspectedBy={formData.inspected_by}
                inspectedAt={formData.inspected_at}
                findings={formData.findings}
                taxableAmount={formData.taxable_amount}
                taxRate={formData.tax_rate}
                notes={formData.notes}
              />
            </div>
          </div>
        </div>

        {finalizeMessage && (
          <div className="bg-emerald-500/10 border border-emerald-200 text-emerald-300 text-sm px-4 py-3 rounded-md mb-6">
            {finalizeMessage}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-200 text-red-400 text-sm px-4 py-3 rounded-md mb-6">{error}</div>
        )}

        {/* List */}
        <div className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">All Inspection Reports</h2>
            <span className="text-xs text-slate-400">{reports.length} total</span>
          </div>

          {!clientId ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-slate-500">Select a client from the dropdown in the header to see inspection reports.</p>
            </div>
          ) : loading ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-slate-500">Loading...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-slate-500">No inspection reports yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-5 py-2 font-medium">Report No</th>
                  <th className="px-5 py-2 font-medium">Customer</th>
                  <th className="px-5 py-2 font-medium">Appliance</th>
                  <th className="px-5 py-2 font-medium">Date</th>
                  <th className="px-5 py-2 font-medium text-right">Tax Amount</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                  <th className="px-5 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => router.push(`/inspections/${r.id}`)}
                    className="border-b border-slate-800 last:border-0 cursor-pointer hover:bg-slate-950"
                  >
                    <td className="px-5 py-3 font-medium text-white">{r.report_number}</td>
                    <td className="px-5 py-3 text-slate-400">{r.customer_name || 'â€"'}</td>
                    <td className="px-5 py-3 text-slate-400">{r.appliance_type || 'â€"'}</td>
                    <td className="px-5 py-3 text-slate-400">
                      {r.inspected_at ? new Date(r.inspected_at).toLocaleDateString() : 'â€"'}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-400">AED {Number(r.tax_amount).toFixed(2)}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.status === 'final' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      {r.status === 'draft' && (
                        <div className="flex gap-2 justify-end">
                          <ActionButton
                            text="Finalize"
                            variant="success"
                            showArrow={false}
                            className="!px-3 !py-1 !text-xs"
                            onClick={() => handleFinalize(r.id)}
                          />
                          <button onClick={() => handleDelete(r.id)} className="text-xs font-medium text-red-400 hover:text-red-300">
                            Delete
                          </button>
                        </div>
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

