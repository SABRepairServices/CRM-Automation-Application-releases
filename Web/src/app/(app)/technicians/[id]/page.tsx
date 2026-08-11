'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTechnicians, Technician } from '@/hooks/useTechnicians';
import { useJobs } from '@/hooks/useJobs';

export default function TechnicianDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { technicians, listTechnicians } = useTechnicians();
  const { jobs, loading, listJobs } = useJobs();
  const [clientId, setClientId] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('selectedClientId');
    if (!stored || !id) return;
    setClientId(stored);
    listTechnicians(stored);
    listJobs(stored, { technician_id: id });
  }, [id, listTechnicians, listJobs]);

  const technician: Technician | undefined = technicians.find((t) => t.id === id);

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

  const activeJobs = jobs.filter((j) => !['completed', 'cancelled', 'rejected'].includes(j.status));
  const pastJobs = jobs.filter((j) => ['completed', 'cancelled', 'rejected'].includes(j.status));

  return (
    <div className="p-8 bg-slate-950 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.push('/technicians')} className="text-xs text-slate-500 hover:text-slate-300 mb-4">
          ← Back to Technicians
        </button>

        {!technician ? (
          <div className="bg-slate-900 border border-slate-800 rounded-md px-5 py-12 text-center">
            <p className="text-sm text-slate-500">{loading ? 'Loading…' : 'Technician not found.'}</p>
          </div>
        ) : (
          <>
            <div className="bg-slate-900 border border-slate-800 rounded-md mb-6 px-5 py-5">
              <h1 className="text-2xl font-semibold text-white">{technician.name}</h1>
              <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-400">
                <span>{technician.phone}</span>
                {technician.email && <span>{technician.email}</span>}
                {technician.speciality && <span>Speciality: {technician.speciality}</span>}
              </div>
              <div className="mt-3 flex gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${activeJobs.length > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>
                  {activeJobs.length > 0 ? `${activeJobs.length} active job${activeJobs.length === 1 ? '' : 's'}` : 'No active jobs'}
                </span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden mb-6">
              <div className="px-5 py-3 border-b border-slate-800">
                <h2 className="text-sm font-semibold text-slate-300">Active Jobs</h2>
              </div>
              {activeJobs.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-slate-500">No active jobs assigned.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-left text-xs text-slate-500 uppercase tracking-wide">
                      <th className="px-5 py-2 font-medium">Appliance</th>
                      <th className="px-5 py-2 font-medium">Customer</th>
                      <th className="px-5 py-2 font-medium">Reported Fault</th>
                      <th className="px-5 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeJobs.map((job) => (
                      <tr key={job.id} className="border-b border-slate-800 last:border-0">
                        <td className="px-5 py-3 font-medium text-white">{job.appliance_type}</td>
                        <td className="px-5 py-3 text-slate-400">{job.customer_name || '—'}</td>
                        <td className="px-5 py-3 text-slate-400 max-w-xs truncate">{job.reported_fault || '—'}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(job.status)}`}>{job.status.replace('_', ' ')}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-300">Job History</h2>
                <span className="text-xs text-slate-400">{pastJobs.length} total</span>
              </div>
              {pastJobs.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-slate-500">No completed jobs yet.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-left text-xs text-slate-500 uppercase tracking-wide">
                      <th className="px-5 py-2 font-medium">Appliance</th>
                      <th className="px-5 py-2 font-medium">Customer</th>
                      <th className="px-5 py-2 font-medium">Created</th>
                      <th className="px-5 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastJobs.map((job) => (
                      <tr key={job.id} className="border-b border-slate-800 last:border-0">
                        <td className="px-5 py-3 font-medium text-white">{job.appliance_type}</td>
                        <td className="px-5 py-3 text-slate-400">{job.customer_name || '—'}</td>
                        <td className="px-5 py-3 text-slate-400">{new Date(job.created_at).toLocaleDateString()}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(job.status)}`}>{job.status.replace('_', ' ')}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
