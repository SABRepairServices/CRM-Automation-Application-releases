'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Customer } from '@/hooks/useCustomers';
import type { Job } from '@/hooks/useJobs';
import type { Quotation } from '@/hooks/useQuotations';
import type { Invoice } from '@/hooks/useInvoices';
import type { InspectionReport } from '@/hooks/useInspections';

interface ApplianceRecord {
  job: Job;
  quotation: Quotation | null;
  invoice: Invoice | null;
  inspection: InspectionReport | null;
}

const JOB_STATUS_COLOR: Record<string, string> = {
  new: 'bg-red-500/10 text-red-400',
  scheduled: 'bg-amber-500/10 text-amber-400',
  inspected: 'bg-blue-500/10 text-blue-400',
  quoted: 'bg-purple-500/10 text-purple-400',
  approved: 'bg-emerald-500/10 text-emerald-400',
  rejected: 'bg-slate-800 text-slate-500',
  in_progress: 'bg-orange-500/10 text-orange-400',
  completed: 'bg-slate-800 text-slate-400',
  cancelled: 'bg-slate-800 text-slate-400',
};

function DocSlot({
  label,
  exists,
  number,
  onClick,
}: {
  label: string;
  exists: boolean;
  number?: string;
  onClick?: () => void;
}) {
  if (!exists) {
    return (
      <div className="flex-1 border border-dashed border-slate-800 rounded-md px-3 py-2 text-center">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
        <div className="text-xs text-slate-400 mt-1">Not created</div>
      </div>
    );
  }
  return (
    <button
      onClick={onClick}
      className="flex-1 border border-slate-800 bg-slate-900 hover:border-slate-400 hover:bg-slate-950 transition-colors rounded-md px-3 py-2 text-center"
    >
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-xs text-white font-medium mt-1">{number}</div>
    </button>
  );
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [appliances, setAppliances] = useState<ApplianceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // The list hooks (useJobs, useQuotations, etc.) set hook-internal state
  // rather than returning data directly, which doesn't compose well for a
  // per-job join like this. Fetch everything directly here instead.
  useEffect(() => {
    const stored = localStorage.getItem('selectedClientId');
    if (!stored || !id) return;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const authHeader = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const axios = (await import('axios')).default;

        const custRes = await axios.get(`${API_URL}/customers/${id}?client_id=${stored}`, authHeader);
        setCustomer(custRes.data.data);

        const jobsRes = await axios.get(`${API_URL}/jobs?client_id=${stored}&customer_id=${id}`, authHeader);
        const jobs: Job[] = jobsRes.data.data || [];

        const records = await Promise.all(
          jobs.map(async (job) => {
            const [qRes, iRes, insRes] = await Promise.all([
              axios.get(`${API_URL}/quotations?client_id=${stored}&job_id=${job.id}`, authHeader),
              axios.get(`${API_URL}/invoices?client_id=${stored}&job_id=${job.id}`, authHeader),
              axios.get(`${API_URL}/inspections?client_id=${stored}&job_id=${job.id}`, authHeader),
            ]);
            return {
              job,
              quotation: qRes.data.data?.[0] || null,
              invoice: iRes.data.data?.[0] || null,
              inspection: insRes.data.data?.[0] || null,
            };
          })
        );

        setAppliances(records);
      } catch (err) {
        console.error('Error loading customer:', err);
        setError('Could not load this customer — check your connection and try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-sm text-slate-500">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8">
        <p className="text-sm text-slate-500">Customer not found.</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-950 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => router.push('/customers')} className="text-sm text-slate-500 hover:text-slate-300 mb-4">
          ← Back to Customers
        </button>

        <div className="bg-slate-900 border border-slate-800 rounded-md px-6 py-5 mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-white">{customer.name}</h1>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                customer.billing_type === 'contractor' ? 'bg-violet-500/10 text-violet-400' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {customer.billing_type === 'contractor' ? 'Contractor' : 'Individual'}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-slate-500">
            <span>{customer.phone}</span>
            {customer.email && <span>{customer.email}</span>}
            {customer.area && <span>{customer.area}</span>}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-300">
            Appliances &amp; Repair History
          </h2>
          <span className="text-xs text-slate-400">
            {appliances.length} appliance{appliances.length !== 1 ? 's' : ''} — each with its own Inspection, Quotation &amp; Invoice
          </span>
        </div>

        {appliances.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-md px-5 py-12 text-center">
            <p className="text-sm text-slate-500">
              No appliances/jobs yet for this customer.{' '}
              <button onClick={() => router.push('/jobs')} className="text-blue-400 font-medium">
                Create one
              </button>
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {appliances.map(({ job, quotation, invoice, inspection }) => (
              <div key={job.id} className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white capitalize">
                      {job.appliance_type.replace('_', ' ')}
                      {job.brand ? ` — ${job.brand}` : ''}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{job.reported_fault || 'No fault description'}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${JOB_STATUS_COLOR[job.status] || 'bg-slate-800 text-slate-400'}`}>
                    {job.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="p-4 flex gap-3">
                  <DocSlot
                    label="Inspection"
                    exists={!!inspection}
                    number={inspection?.report_number}
                    onClick={() => inspection && router.push(`/inspections/${inspection.id}`)}
                  />
                  <DocSlot
                    label="Quotation"
                    exists={!!quotation}
                    number={quotation?.quotation_number}
                    onClick={() => quotation && router.push(`/quotes/${quotation.id}`)}
                  />
                  <DocSlot
                    label="Invoice"
                    exists={!!invoice}
                    number={invoice?.invoice_number}
                    onClick={() => invoice && router.push(`/invoices/${invoice.id}`)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 bg-amber-500/10 border border-amber-200 rounded-md px-4 py-3 text-xs text-amber-300">
          Each appliance gets its own Inspection → Quotation → Invoice. If this customer has another appliance
          to repair (e.g. a separate dishwasher on top of an iron), create a <strong>new Job</strong> for it —
          never combine two appliances into one job.
        </div>
      </div>
    </div>
  );
}
