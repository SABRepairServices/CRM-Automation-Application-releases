'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomers } from '@/hooks/useCustomers';
import { useJobs } from '@/hooks/useJobs';
import { useQuotations } from '@/hooks/useQuotations';
import { useInvoices } from '@/hooks/useInvoices';
import { useSelectedClientId } from '@/hooks/useSelectedClientId';

const ACTIVE_JOB_STATUSES = ['new', 'scheduled', 'inspected', 'quoted', 'approved', 'in_progress'];

export default function DashboardPage() {
  const router = useRouter();
  const { customers, listCustomers, loading: customersLoading } = useCustomers();
  const { jobs, listJobs, loading: jobsLoading } = useJobs();
  const { quotations, listQuotations, loading: quotationsLoading } = useQuotations();
  const { invoices, listInvoices, loading: invoicesLoading } = useInvoices();
  const clientId = useSelectedClientId();
  const loading = customersLoading || jobsLoading || quotationsLoading || invoicesLoading;

  useEffect(() => {
    if (!clientId) return;
    listCustomers({ clientId });
    listJobs(clientId);
    listQuotations(clientId);
    listInvoices(clientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const activeJobs = jobs.filter((j) => ACTIVE_JOB_STATUSES.includes(j.status));
  const pendingQuotes = quotations.filter((q) => q.status === 'draft' || q.status === 'sent');
  const unpaidInvoices = invoices.filter((i) => i.status !== 'paid' && i.status !== 'cancelled');
  const outstandingAmount = unpaidInvoices.reduce((sum, i) => sum + (Number(i.total_amount) - Number(i.paid_amount)), 0);

  const cards = [
    { label: 'Customers', value: customers.length, href: '/customers' },
    { label: 'Active Jobs', value: activeJobs.length, href: '/jobs' },
    { label: 'Quotes Awaiting Response', value: pendingQuotes.length, href: '/quotes' },
    { label: 'Unpaid Invoices', value: unpaidInvoices.length, sub: `AED ${outstandingAmount.toFixed(2)} outstanding`, href: '/invoices' },
  ];

  if (!clientId) {
    return (
      <div className="p-8 bg-slate-950 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-semibold text-white mb-6">Dashboard</h1>
          <div className="bg-slate-900 border border-slate-800 rounded-md px-5 py-12 text-center">
            <p className="text-sm text-slate-500">Select a client from the dropdown above to see your overview.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-950 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold text-white mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {cards.map((card) => (
            <button
              key={card.label}
              onClick={() => router.push(card.href)}
              className="text-left bg-slate-900 border border-slate-800 rounded-md p-5 hover:border-slate-700 transition-colors"
            >
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">{card.label}</p>
              <p className="text-2xl font-semibold text-white">{card.value}</p>
              {card.sub && <p className="text-xs text-slate-500 mt-1">{card.sub}</p>}
            </button>
          ))}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-300">Recent Jobs</h2>
          </div>
          {loading ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-slate-500">Loading...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-slate-500">No jobs yet.</p>
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
                {jobs.slice(0, 5).map((job) => (
                  <tr key={job.id} className="border-b border-slate-800 last:border-0 cursor-pointer hover:bg-slate-950" onClick={() => router.push('/jobs')}>
                    <td className="px-5 py-3 font-medium text-white">{job.appliance_type}</td>
                    <td className="px-5 py-3 text-slate-400">{job.customer_name || '—'}</td>
                    <td className="px-5 py-3 text-slate-400">{new Date(job.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-slate-400">{job.status.replace('_', ' ')}</td>
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
