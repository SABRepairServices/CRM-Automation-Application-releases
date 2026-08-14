'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomers } from '@/hooks/useCustomers';
import { useJobs } from '@/hooks/useJobs';
import { useQuotations } from '@/hooks/useQuotations';
import { useInvoices } from '@/hooks/useInvoices';
import { useSelectedClientId } from '@/hooks/useSelectedClientId';
import {
  LayoutDashboard, Users, Wrench, FileText, Receipt,
  TrendingUp, AlertTriangle, CheckCircle2, Clock,
  Search, Bell, ChevronRight, Zap, Target,
  ArrowUpRight, ArrowDownRight, Activity,
} from 'lucide-react';

const ACTIVE_JOB_STATUSES = ['new', 'scheduled', 'inspected', 'quoted', 'approved', 'in_progress'];

const STATUS_LABELS: Record<string, string> = {
  new: 'New', scheduled: 'Scheduled', inspected: 'Inspected',
  quoted: 'Quoted', approved: 'Approved', in_progress: 'In Progress',
  completed: 'Completed', cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  scheduled: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  inspected: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  quoted: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  approved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  in_progress: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  completed: 'bg-slate-700 text-slate-400 border-slate-600',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
};

export default function DashboardPage() {
  const router = useRouter();
  const { customers, listCustomers, loading: cLoading } = useCustomers();
  const { jobs, listJobs, loading: jLoading } = useJobs();
  const { quotations, listQuotations, loading: qLoading } = useQuotations();
  const { invoices, listInvoices, loading: iLoading } = useInvoices();
  const clientId = useSelectedClientId();
  const loading = cLoading || jLoading || qLoading || iLoading;
  const [search, setSearch] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

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
  const overdueInvoices = invoices.filter((i) => i.status === 'overdue');
  const completedThisMonth = jobs.filter((j) => {
    if (j.status !== 'completed') return false;
    const d = new Date(j.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const notifications = useMemo(() => {
    const n: { type: 'warning' | 'info' | 'success'; text: string; href: string }[] = [];
    if (overdueInvoices.length > 0) n.push({ type: 'warning', text: `${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? 's' : ''} need attention`, href: '/invoices' });
    if (pendingQuotes.length > 3) n.push({ type: 'info', text: `${pendingQuotes.length} quotes awaiting customer response`, href: '/quotes' });
    if (activeJobs.length > 5) n.push({ type: 'info', text: `${activeJobs.length} active jobs in progress`, href: '/jobs' });
    if (completedThisMonth.length > 0) n.push({ type: 'success', text: `${completedThisMonth.length} job${completedThisMonth.length > 1 ? 's' : ''} completed this month`, href: '/jobs' });
    return n;
  }, [overdueInvoices.length, pendingQuotes.length, activeJobs.length, completedThisMonth.length]);

  const recommendations = useMemo(() => {
    const r: { icon: typeof Zap; text: string; href: string; accent: string }[] = [];
    if (unpaidInvoices.length > 0) r.push({ icon: Receipt, text: 'Follow up on unpaid invoices', href: '/invoices', accent: 'text-amber-400' });
    if (pendingQuotes.length > 0) r.push({ icon: FileText, text: 'Review pending quotations', href: '/quotes', accent: 'text-blue-400' });
    const unassigned = activeJobs.filter((j) => !j.technician_id);
    if (unassigned.length > 0) r.push({ icon: Wrench, text: `${unassigned.length} job${unassigned.length > 1 ? 's' : ''} without a technician assigned`, href: '/jobs', accent: 'text-rose-400' });
    if (customers.length === 0) r.push({ icon: Users, text: 'Add your first customer to get started', href: '/customers', accent: 'text-cyan-400' });
    return r.slice(0, 3);
  }, [unpaidInvoices.length, pendingQuotes.length, activeJobs, customers.length]);

  const jobStatusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const j of activeJobs) counts[j.status] = (counts[j.status] || 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [activeJobs]);

  const filteredJobs = useMemo(() => {
    if (!search.trim()) return jobs.slice(0, 8);
    const q = search.toLowerCase();
    return jobs.filter((j) =>
      j.appliance_type?.toLowerCase().includes(q) ||
      j.customer_name?.toLowerCase().includes(q) ||
      j.status?.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [jobs, search]);

  const cards = [
    { label: 'Customers', value: customers.length, icon: Users, accent: 'cyan', delta: null, href: '/customers' },
    { label: 'Active Jobs', value: activeJobs.length, icon: Wrench, accent: 'emerald', delta: null, href: '/jobs' },
    { label: 'Pending Quotes', value: pendingQuotes.length, icon: FileText, accent: 'amber', delta: null, href: '/quotes' },
    { label: 'Outstanding (AED)', value: `${outstandingAmount.toFixed(0)}`, icon: Receipt, accent: 'rose', sub: `${unpaidInvoices.length} invoices`, href: '/invoices' },
  ] as const;

  const accentMap: Record<string, { text: string; bg: string; glow: string }> = {
    cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500/15', glow: 'shadow-[0_0_16px_rgba(34,211,238,0.25)]' },
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/15', glow: 'shadow-[0_0_16px_rgba(52,211,153,0.25)]' },
    amber: { text: 'text-amber-400', bg: 'bg-amber-500/15', glow: 'shadow-[0_0_16px_rgba(251,191,36,0.25)]' },
    rose: { text: 'text-rose-400', bg: 'bg-rose-500/15', glow: 'shadow-[0_0_16px_rgba(251,113,133,0.25)]' },
  };

  if (!clientId) {
    return (
      <div className="px-4 py-4 bg-slate-950 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-blue-400" /> Dashboard
          </h1>
          <div className="bg-slate-900 border border-slate-800 rounded-lg px-5 py-10 text-center">
            <Target className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Select a client from the header to see your overview.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 bg-slate-950 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-4">

        {/* Header row: title + search + notifications */}
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-white flex items-center gap-2 shrink-0">
            <LayoutDashboard className="w-5 h-5 text-blue-400" /> Dashboard
          </h1>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search jobs, customers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="relative ml-auto">
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="relative w-8 h-8 flex items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-10 w-72 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Notifications</span>
                  <span className="text-[10px] text-slate-500">{notifications.length} alerts</span>
                </div>
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-slate-600">All clear — nothing needs attention</div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {notifications.map((n, i) => (
                      <button key={i} onClick={() => { router.push(n.href); setNotifOpen(false); }}
                        className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-800/60 transition-colors">
                        {n.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />}
                        {n.type === 'info' && <Activity className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />}
                        {n.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />}
                        <span className="text-xs text-slate-300 leading-relaxed">{n.text}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* KPI cards */}
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
          {cards.map((card) => {
            const a = accentMap[card.accent];
            const Icon = card.icon;
            return (
              <button
                key={card.label}
                onClick={() => router.push(card.href)}
                className={`text-left bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-slate-700 hover:${a.glow} transition-all duration-200 group`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-8 h-8 rounded-md ${a.bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${a.text}`} />
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                </div>
                <p className={`text-xl font-bold ${a.text} leading-none mb-1`}>{loading ? '—' : card.value}</p>
                <p className="text-[11px] text-slate-500 leading-tight">{card.label}</p>
                {card.sub && <p className="text-[10px] text-slate-600 mt-0.5">{card.sub}</p>}
              </button>
            );
          })}
        </div>

        {/* Middle row: Job breakdown + Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

          {/* Active job status breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-800 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-300">Active Job Pipeline</span>
            </div>
            {loading ? (
              <div className="px-4 py-8 text-center text-xs text-slate-600">Loading…</div>
            ) : jobStatusBreakdown.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Clock className="w-6 h-6 text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-600">No active jobs right now.</p>
                <button onClick={() => router.push('/jobs')} className="mt-2 text-xs text-blue-400 hover:text-blue-300">Create a job →</button>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {jobStatusBreakdown.map(([status, count]) => {
                  const pct = Math.round((count / activeJobs.length) * 100);
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${STATUS_COLORS[status] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                          {STATUS_LABELS[status] || status}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">{count}</span>
                      </div>
                      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recommendations */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-800 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-slate-300">Recommended Actions</span>
            </div>
            {loading ? (
              <div className="px-4 py-8 text-center text-xs text-slate-600">Loading…</div>
            ) : recommendations.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <p className="text-xs text-slate-600">Everything looks great — nothing urgent.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {recommendations.map((rec, i) => {
                  const Icon = rec.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => router.push(rec.href)}
                      className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-800/60 transition-colors group"
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${rec.accent}`} />
                      <span className="text-xs text-slate-300 flex-1 leading-relaxed">{rec.text}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent jobs table */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-semibold text-slate-300">{search ? 'Search Results' : 'Recent Jobs'}</span>
            </div>
            <button onClick={() => router.push('/jobs')} className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {loading ? (
            <div className="px-4 py-8 text-center text-xs text-slate-600">Loading…</div>
          ) : filteredJobs.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Wrench className="w-6 h-6 text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-600">{search ? 'No jobs match your search.' : 'No jobs yet.'}</p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-left text-[10px] text-slate-600 uppercase tracking-wide">
                  <th className="px-4 py-2 font-medium">Appliance</th>
                  <th className="px-4 py-2 font-medium">Customer</th>
                  <th className="px-4 py-2 font-medium hidden sm:table-cell">Date</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job, i) => (
                  <tr
                    key={job.id}
                    onClick={() => router.push('/jobs')}
                    className="border-b border-slate-800 last:border-0 cursor-pointer hover:bg-slate-800/40 transition-colors"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <td className="px-4 py-2.5 font-medium text-white">{job.appliance_type}</td>
                    <td className="px-4 py-2.5 text-slate-400">{job.customer_name || '—'}</td>
                    <td className="px-4 py-2.5 text-slate-500 hidden sm:table-cell">{new Date(job.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${STATUS_COLORS[job.status] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                        {STATUS_LABELS[job.status] || job.status}
                      </span>
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
