'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInspections, InspectionFinding } from '@/hooks/useInspections';
import { ActionButton } from '@/components/ui/action-button';

export default function InspectionsPage() {
  const router = useRouter();
  const { reports, loading, error, listReports, createReport, updateReport } = useInspections();
  const [showForm, setShowForm] = useState(false);
  const [clientId, setClientId] = useState('');
  const [finalizeMessage, setFinalizeMessage] = useState('');
  const [formData, setFormData] = useState({
    job_id: '',
    inspected_by: '',
    inspected_at: new Date().toISOString().split('T')[0],
    findings: [{ description: '' }] as InspectionFinding[],
    taxable_amount: 0,
    tax_rate: 5,
    notes: '',
  });

  useEffect(() => {
    const stored = localStorage.getItem('selectedClientId');
    if (stored) {
      setClientId(stored);
      listReports(stored);
    }
  }, [listReports]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    try {
      await createReport(clientId, {
        job_id: formData.job_id,
        inspected_by: formData.inspected_by,
        findings: formData.findings.filter((f) => f.description),
        taxable_amount: formData.taxable_amount,
        tax_rate: formData.tax_rate,
        notes: formData.notes,
      });
      setFormData({
        job_id: '',
        inspected_by: '',
        inspected_at: new Date().toISOString().split('T')[0],
        findings: [{ description: '' }],
        taxable_amount: 0,
        tax_rate: 5,
        notes: '',
      });
      setShowForm(false);
    } catch (err) {
      console.error('Error creating inspection report:', err);
    }
  };

  const handleFinalize = async (reportId: string) => {
    if (!clientId) return;
    setFinalizeMessage('');
    try {
      const updated = await updateReport(clientId, reportId, { status: 'final' });
      if (updated.generated_quotation) {
        setFinalizeMessage(`Finalized — quotation ${updated.generated_quotation.quotation_number} was created automatically.`);
      } else {
        setFinalizeMessage('Finalized — a quotation already existed for this job.');
      }
    } catch (err) {
      console.error('Error finalizing inspection report:', err);
    }
  };

  return (
    <div className="p-8 bg-slate-950 min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-white">Inspection Reports</h1>
            <p className="text-sm text-slate-500 mt-1">
              Finalizing a report automatically generates its quotation
            </p>
          </div>
          <ActionButton
            text={showForm ? 'Cancel' : 'New Inspection'}
            variant={showForm ? 'ghost' : 'primary'}
            showArrow={!showForm}
            onClick={() => setShowForm(!showForm)}
          />
        </div>

        {/* New report form — mirrors the original Excel Inspection Report layout */}
        {showForm && (
          <div className="bg-slate-900 border border-slate-800 rounded-md mb-6">
            <div className="px-5 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-300">New Inspection Report</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Job ID</label>
                  <input
                    type="text"
                    value={formData.job_id}
                    onChange={(e) => setFormData({ ...formData, job_id: e.target.value })}
                    required
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

              {/* Tax summary block — matches the Excel "Tax Summary / Standard Rate (5%)" section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Taxable Amount (AED)</label>
                  <input
                    type="number"
                    value={formData.taxable_amount}
                    onChange={(e) => setFormData({ ...formData, taxable_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    value={formData.tax_rate}
                    onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
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

              <ActionButton type="submit" disabled={loading} text={loading ? 'Saving...' : 'Save Inspection Report'} />
            </form>
          </div>
        )}

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

          {reports.length === 0 ? (
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
                    <td className="px-5 py-3 text-slate-400">{r.customer_name || '—'}</td>
                    <td className="px-5 py-3 text-slate-400">{r.appliance_type || '—'}</td>
                    <td className="px-5 py-3 text-slate-400">
                      {r.inspected_at ? new Date(r.inspected_at).toLocaleDateString() : '—'}
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
                        <ActionButton
                          text="Finalize"
                          variant="success"
                          showArrow={false}
                          className="!px-3 !py-1 !text-xs"
                          onClick={() => handleFinalize(r.id)}
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
