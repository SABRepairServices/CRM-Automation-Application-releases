'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  Wrench,
  ClipboardCheck,
  FileText,
  Receipt,
  Link2,
  MessagesSquare,
  Phone,
  UserCog,
  FlaskConical,
} from 'lucide-react';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Building2 },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/technicians', label: 'Technicians', icon: UserCog },
  { href: '/jobs', label: 'Jobs', icon: Wrench },
  { href: '/inspections', label: 'Inspections', icon: ClipboardCheck },
  { href: '/quotes', label: 'Quotes', icon: FileText },
  { href: '/invoices', label: 'Invoices', icon: Receipt },
  { href: '/social-accounts', label: 'Accounts', icon: Link2 },
  { href: '/social-posts', label: 'Posts', icon: MessagesSquare },
  { href: '/call-agent', label: 'Call Agent', icon: Phone },
  { href: '/whatsapp-sim', label: 'WhatsApp Sim', icon: FlaskConical },
];

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-[#0d1220] border-r border-white/5 z-40 flex flex-col">
      <div className="px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-blue-900/40">
            SB
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white leading-tight">Shams Al Barakat</h1>
            <p className="text-[11px] text-slate-500 leading-tight">Repair Services CRM</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                active
                  ? 'bg-gradient-to-r from-blue-500/15 to-violet-500/10 text-white font-medium'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-gradient-to-b from-blue-400 to-violet-500" />
              )}
              <Icon
                className={`w-[18px] h-[18px] shrink-0 transition-all duration-200 ${
                  active
                    ? 'text-blue-400 drop-shadow-[0_0_6px_rgba(96,165,250,0.7)]'
                    : 'text-slate-500 group-hover:text-slate-300 group-hover:drop-shadow-[0_0_5px_rgba(148,163,184,0.5)]'
                }`}
                strokeWidth={2}
              />
              <span className="flex-1">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/5">
        <div className="text-[11px] text-slate-600 text-center">
          <p>v1.0.0</p>
          <p className="mt-1">© 2026 Shams Al Barakat Repair Services</p>
        </div>
      </div>
    </div>
  );
}
