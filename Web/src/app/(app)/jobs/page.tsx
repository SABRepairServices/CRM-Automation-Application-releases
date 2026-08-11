'use client';

import { useEffect, useState } from 'react';
import { useJobs } from '@/hooks/useJobs';
import { useTechnicians } from '@/hooks/useTechnicians';
import { ActionButton } from '@/components/ui/action-button';

const STATUSES = ['new', 'scheduled', 'inspected', 'quoted', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled'];

export default function JobsPage() {
  const { jobs, loading, error, listJobs, createJob, updateJob } = useJobs();
  const { technicians, listTechnicians } = useTechnicians();
  const [showForm, setShowForm] = useState(false);
  const [clientId, setClientId] = useState('');
  const [formData, setFormData] = useState({
    customer_id: '',
    appliance_type: '',
    reported_fault: '',
    scheduled_at: '',
  });

  useEffect(() => {
    const stored = localStorage.getItem('selectedClientId');
    if (stored) {
      setClientId(stored);
      listJobs(stored);
      listTechnicians(stored);
    }
  }, [listJobs, listTechnicians]);

  const handleTechnicianChange = async (jobId: string, technicianId: string) => {
    if (!clientId) return;
    try {
      await updateJob(clientId, jobId, { technician_id: technicianId || undefined });
    } catch (err) {
      console.error('Error assigning technician:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    try {
      await createJob(clientId, formData);
      setFormData({ customer_id: '', appliance_type: '', reported_fault: '', scheduled_at: '' });
      setShowForm(false);
    } catch (err) {
      console.error('Error creating job:', err);
    }
  };

  const handleStatusChange = async (jobId: string, status: string) => {
    if (!clientId) return;
    try {
      await updateJob(clientId, jobId, { status: status as any });
    } catch (err) {
      console.error('Error updating job status:', err);
    }
  };

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-red-500/10 text-red-400',
      scheduled: 'bg-amber-500/10 text-amber-400',
      inspected: 'bg-blue-500/10 text-blue-700',
      quoted: 'bg-purple-50 text-purple-700',
      approved: 'bg-emerald-500/10 text-emerald-400',
      rejected: 'bg-slate-800 text-slate-500',
      in_progress: 'bg-orange-50 text-orange-700',
      completed: 'bg-slate-800 text-slate-400',
      cancelled: 'bg-slate-800 text-slate-400',
    };
    return colors[status] || 'bg-slate-800 text-slate-400';
  };

  return (
    <div className="p-8 bg-slate-950 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-white">Repair Jobs</h1>
            <p className="text-sm text-slate-500 mt-1">new → scheduled → inspected → quoted → approved → in_progress → completed</p>
          </div>
          <ActionButton
            text={showForm ? 'Cancel' : 'New Job'}
            variant={showForm ? 'ghost' : 'primary'}
            showArrow={!showForm}
            onClick={() => setShowForm(!showForm)}
          />
        </div>

        {showForm && (
          <div className="bg-slate-900 border border-slate-800 rounded-md mb-6">
            <div className="px-5 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-300">New Job</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Customer ID</label>
                <input type="text" value={formData.customer_id} onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })} required className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Appliance Type</label>
                <input type="text" placeholder="AC, Fridge, Washing Machine..." value={formData.appliance_type} onChange={(e) => setFormData({ ...formData, appliance_type: e.target.value })} required className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Reported Fault</label>
                <textarea value={formData.reported_fault} onChange={(e) => setFormData({ ...formData, reported_fault: e.target.value })} rows={2} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Scheduled At</label>
                <input type="datetime-local" value={formData.scheduled_at} onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600" />
              </div>
              <ActionButton type="submit" disabled={loading} text={loading ? 'Creating...' : 'Create Job'} />
            </form>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-200 text-red-400 text-sm px-4 py-3 rounded-md mb-6">{error}</div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">All Jobs</h2>
            <span className="text-xs text-slate-400">{jobs.length} total</span>
          </div>

          {jobs.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-slate-500">No jobs yet. Create one to get started.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-5 py-2 font-medium">Appliance</th>
                  <th className="px-5 py-2 font-medium">Customer</th>
                  <th className="px-5 py-2 font-medium">Reported Fault</th>
                  <th className="px-5 py-2 font-medium">Created</th>
                  <th className="px-5 py-2 font-medium">Technician</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b border-slate-800 last:border-0">
                    <td className="px-5 py-3 font-medium text-white">{job.appliance_type}</td>
                    <td className="px-5 py-3 text-slate-400">{job.customer_name || '—'}</td>
                    <td className="px-5 py-3 text-slate-400 max-w-xs truncate">{job.reported_fault || '—'}</td>
                    <td className="px-5 py-3 text-slate-400">{new Date(job.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <select
                        value={job.technician_id || ''}
                        onChange={(e) => handleTechnicianChange(job.id, e.target.value)}
                        className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Unassigned</option>
                        {technicians.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={job.status}
                        onChange={(e) => handleStatusChange(job.id, e.target.value)}
                        className={`px-2 py-1 rounded-md text-xs font-medium border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 ${statusColor(job.status)}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s.replace('_', ' ')}</option>
                        ))}
                      </select>
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
