'use client';

import { useEffect, useState } from 'react';
import { useCalls } from '@/hooks/useCalls';
import { useCustomers } from '@/hooks/useCustomers';
import { useTechnicians } from '@/hooks/useTechnicians';
import { ActionButton } from '@/components/ui/action-button';

const PURPOSE_LABEL: Record<string, string> = {
  reminder: 'Reminder',
  follow_up: 'Follow-up',
  inquiry: 'Inquiry',
  complaint: 'Complaint',
  quotation_discussion: 'Quotation Discussion',
  other: 'Other',
};

export default function CallAgentPage() {
  const { calls, stats, loading, error, listCalls, getStats, createCall, deleteCall } = useCalls();
  const { customers, listCustomers } = useCustomers();
  const { technicians, listTechnicians } = useTechnicians();
  const [clientId, setClientId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    technician_id: '',
    direction: 'outbound' as 'inbound' | 'outbound',
    purpose: 'follow_up',
    notes: '',
    duration_minutes: '',
  });

  useEffect(() => {
    const stored = localStorage.getItem('selectedClientId');
    if (stored) {
      setClientId(stored);
      listCalls(stored);
      getStats(stored);
      listCustomers({ clientId: stored });
      listTechnicians(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !formData.customer_id) return;
    try {
      await createCall(clientId, {
        customer_id: formData.customer_id,
        technician_id: formData.technician_id || undefined,
        direction: formData.direction,
        purpose: formData.purpose,
        notes: formData.notes,
        duration_minutes: formData.duration_minutes ? Number(formData.duration_minutes) : undefined,
      });
      setFormData({ customer_id: '', technician_id: '', direction: 'outbound', purpose: 'follow_up', notes: '', duration_minutes: '' });
      setShowForm(false);
      await getStats(clientId);
    } catch (err) {
      console.error('Error logging call:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!clientId) return;
    if (confirm('Delete this call log entry?')) {
      await deleteCall(clientId, id);
      await getStats(clientId);
    }
  };

  return (
    <div className="p-8 bg-slate-950 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-white">Call Agent</h1>
            <p className="text-sm text-slate-500 mt-1">
              Call log for now — AI-automated calling is planned once there&apos;s budget for a telephony provider (see FUTURE_WORK.md)
            </p>
          </div>
          <ActionButton
            text={showForm ? 'Cancel' : 'Log a Call'}
            variant={showForm ? 'ghost' : 'primary'}
            showArrow={!showForm}
            onClick={() => setShowForm(!showForm)}
          />
        </div>

        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Calls', value: stats.total, color: 'text-white' },
              { label: 'Inbound', value: stats.inbound_count, color: 'text-blue-400' },
              { label: 'Outbound', value: stats.outbound_count, color: 'text-violet-400' },
              { label: 'Today', value: stats.today_count, color: 'text-emerald-400' },
            ].map((s) => (
              <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-md px-4 py-3">
                <div className={`text-2xl font-semibold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <div className="bg-slate-900 border border-slate-800 rounded-md mb-6">
            <div className="px-5 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-300">Log a Call</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Customer</label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white"
                >
                  <option value="">Choose a customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Technician (optional)</label>
                <select
                  value={formData.technician_id}
                  onChange={(e) => setFormData({ ...formData, technician_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white"
                >
                  <option value="">Unassigned</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Direction</label>
                <select
                  value={formData.direction}
                  onChange={(e) => setFormData({ ...formData, direction: e.target.value as 'inbound' | 'outbound' })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white"
                >
                  <option value="outbound">Outbound (we called them)</option>
                  <option value="inbound">Inbound (they called us)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Purpose</label>
                <select
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white"
                >
                  {Object.entries(PURPOSE_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Duration (minutes, optional)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600"
                />
              </div>
              <div className="sm:col-span-2">
                <ActionButton type="submit" disabled={loading} text={loading ? 'Saving...' : 'Save Call Log'} />
              </div>
            </form>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-900 text-red-400 text-sm px-4 py-3 rounded-md mb-6">{error}</div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">Call History</h2>
            <span className="text-xs text-slate-400">{calls.length} total</span>
          </div>

          {calls.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-slate-500">No calls logged yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-5 py-2 font-medium">Customer</th>
                  <th className="px-5 py-2 font-medium">Direction</th>
                  <th className="px-5 py-2 font-medium">Purpose</th>
                  <th className="px-5 py-2 font-medium">Technician</th>
                  <th className="px-5 py-2 font-medium">When</th>
                  <th className="px-5 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {calls.map((call) => (
                  <tr key={call.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-950/50">
                    <td className="px-5 py-3">
                      <div className="font-medium text-white">{call.customer_name || 'Unknown'}</div>
                      <div className="text-xs text-slate-500">{call.customer_phone}</div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${call.direction === 'inbound' ? 'bg-blue-500/10 text-blue-400' : 'bg-violet-500/10 text-violet-400'}`}>
                        {call.direction}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400">{PURPOSE_LABEL[call.purpose] || call.purpose}</td>
                    <td className="px-5 py-3 text-slate-400">{call.technician_name || '—'}</td>
                    <td className="px-5 py-3 text-slate-400">{new Date(call.called_at).toLocaleString()}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => handleDelete(call.id)} className="text-xs font-medium text-red-400 hover:text-red-300">
                        Delete
                      </button>
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
