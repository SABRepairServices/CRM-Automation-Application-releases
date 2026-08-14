'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getAppVersion, installUpdate, isElectron, onUpdateDownloaded } from '@/lib/electronBridge';
import { useSidebarWidth } from '@/context/SidebarContext';
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
  Pin,
} from 'lucide-react';

// Each nav item gets its own accent so the rail reads as a row of distinct
// colorful controls instead of one flat monochrome list. Every class string
// used in the DOM is written out in full below — Tailwind's JIT scanner
// only picks up classes that appear as literal, unbroken tokens in the
// source, so these can't be assembled at runtime via template interpolation.
const ACCENTS = {
  blue: {
    text: 'text-blue-400',
    bg: 'bg-blue-500/15',
    iconIdle: 'bg-blue-500/15 group-hover:shadow-[0_0_12px_rgba(96,165,250,0.55)]',
    iconActive: 'bg-blue-500/15 shadow-[0_0_12px_rgba(96,165,250,0.55)]',
  },
  violet: {
    text: 'text-violet-400',
    bg: 'bg-violet-500/15',
    iconIdle: 'bg-violet-500/15 group-hover:shadow-[0_0_12px_rgba(167,139,250,0.55)]',
    iconActive: 'bg-violet-500/15 shadow-[0_0_12px_rgba(167,139,250,0.55)]',
  },
  cyan: {
    text: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
    iconIdle: 'bg-cyan-500/15 group-hover:shadow-[0_0_12px_rgba(34,211,238,0.55)]',
    iconActive: 'bg-cyan-500/15 shadow-[0_0_12px_rgba(34,211,238,0.55)]',
  },
  amber: {
    text: 'text-amber-400',
    bg: 'bg-amber-500/15',
    iconIdle: 'bg-amber-500/15 group-hover:shadow-[0_0_12px_rgba(251,191,36,0.55)]',
    iconActive: 'bg-amber-500/15 shadow-[0_0_12px_rgba(251,191,36,0.55)]',
  },
  emerald: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    iconIdle: 'bg-emerald-500/15 group-hover:shadow-[0_0_12px_rgba(52,211,153,0.55)]',
    iconActive: 'bg-emerald-500/15 shadow-[0_0_12px_rgba(52,211,153,0.55)]',
  },
  rose: {
    text: 'text-rose-400',
    bg: 'bg-rose-500/15',
    iconIdle: 'bg-rose-500/15 group-hover:shadow-[0_0_12px_rgba(251,113,133,0.55)]',
    iconActive: 'bg-rose-500/15 shadow-[0_0_12px_rgba(251,113,133,0.55)]',
  },
} as const;

const links: { href: string; label: string; icon: typeof LayoutDashboard; accent: keyof typeof ACCENTS }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, accent: 'blue' },
  { href: '/clients', label: 'Clients', icon: Building2, accent: 'violet' },
  { href: '/customers', label: 'Customers', icon: Users, accent: 'cyan' },
  { href: '/technicians', label: 'Technicians', icon: UserCog, accent: 'amber' },
  { href: '/jobs', label: 'Jobs', icon: Wrench, accent: 'emerald' },
  { href: '/inspections', label: 'Inspections', icon: ClipboardCheck, accent: 'rose' },
  { href: '/quotes', label: 'Quotes', icon: FileText, accent: 'blue' },
  { href: '/invoices', label: 'Invoices', icon: Receipt, accent: 'violet' },
  { href: '/social-accounts', label: 'Accounts', icon: Link2, accent: 'cyan' },
  { href: '/social-posts', label: 'Posts', icon: MessagesSquare, accent: 'amber' },
  { href: '/call-agent', label: 'Call Agent', icon: Phone, accent: 'emerald' },
  { href: '/whatsapp-sim', label: 'WhatsApp Sim', icon: FlaskConical, accent: 'rose' },
];

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;
  const [version, setVersion] = useState<string | null>(null);
  const [updateReady, setUpdateReady] = useState<string | null>(null);

  // Three-state expand logic: collapsed icon rail by default, hover
  // previews it wide, and pinning locks it wide until unpinned. Closing it
  // manually while the cursor is still resting on it must not let the same
  // hover reopen it — only a fresh mouseenter (after actually leaving) does.
  const [pinned, setPinned] = useState(false);
  const [hovering, setHovering] = useState(false);
  const suppressHoverRef = useRef(false);
  const wide = pinned || hovering;

  // The main content area lives outside this component (in the shared app
  // shell layout), so it needs to know the sidebar's current width too —
  // otherwise expanding the sidebar just overlays it on top of the page
  // instead of pushing the content over, hiding whatever was underneath.
  const { setWide: setSidebarWide } = useSidebarWidth();
  useEffect(() => {
    setSidebarWide(wide);
  }, [wide, setSidebarWide]);

  useEffect(() => {
    if (!isElectron()) return;
    getAppVersion().then(setVersion);
    return onUpdateDownloaded((newVersion) => setUpdateReady(newVersion));
  }, []);

  const handleMouseEnter = () => {
    if (suppressHoverRef.current) return;
    setHovering(true);
  };
  const handleMouseLeave = () => {
    suppressHoverRef.current = false;
    setHovering(false);
  };
  const togglePin = () => {
    setPinned((was) => {
      const next = !was;
      if (!next) {
        // Unpinning while the mouse is still over the sidebar should close
        // it immediately and keep it closed until a real re-hover.
        setHovering(false);
        suppressHoverRef.current = true;
      }
      return next;
    });
  };

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-slate-900 border-r border-slate-800 z-30 flex flex-col transition-[width] duration-500 ease-in-out ${
        wide ? 'w-56 shadow-[8px_0_24px_-8px_rgba(0,0,0,0.5)]' : 'w-16'
      }`}
    >
      <div className={`flex items-center h-9 shrink-0 ${wide ? 'justify-end px-2 pt-2' : 'justify-center pt-2'}`}>
        <button
          onClick={togglePin}
          title={pinned ? 'Unpin sidebar' : 'Pin sidebar open'}
          aria-label={pinned ? 'Unpin sidebar' : 'Pin sidebar open — needed to use the sidebar on touch devices, which have no hover'}
          className={`w-7 h-7 rounded-md flex items-center justify-center transition-all duration-150 ${
            pinned
              ? 'text-cyan-400 bg-cyan-500/15 shadow-[0_0_10px_rgba(34,211,238,0.5)] rotate-45'
              : 'text-slate-500 hover:text-cyan-300 hover:bg-white/5'
          }`}
        >
          <Pin className="w-3.5 h-3.5" strokeWidth={2.4} />
        </button>
      </div>

      <nav className="flex-1 px-2.5 py-1 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {links.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.href);
          const accent = ACCENTS[link.accent];
          return (
            <Link
              key={link.href}
              href={link.href}
              title={wide ? undefined : link.label}
              className={`group relative flex items-center gap-2.5 rounded-lg text-sm transition-all duration-150 ${
                wide ? 'px-2 py-2' : 'justify-center px-0 py-2'
              } ${active ? 'text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-gradient-to-b from-blue-400 to-violet-500 shadow-[0_0_8px_rgba(96,165,250,0.7)]" />
              )}
              <span
                className={`flex items-center justify-center w-8 h-8 rounded-md shrink-0 transition-all duration-200 ${
                  active ? accent.iconActive : accent.iconIdle
                }`}
              >
                <Icon className={`w-4 h-4 ${accent.text}`} strokeWidth={2} />
              </span>
              <span className={`flex-1 whitespace-nowrap transition-opacity duration-300 ${wide ? 'opacity-100 delay-200' : 'opacity-0 w-0 overflow-hidden'}`}>
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {updateReady && wide && (
        <div className="mx-2.5 mb-2.5 rounded-lg bg-blue-500/10 border border-blue-500/30 px-3 py-2.5">
          <p className="text-xs text-blue-300 font-medium">Update ready — v{updateReady}</p>
          <button
            onClick={() => installUpdate()}
            className="mt-1.5 w-full text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-md px-2 py-1.5 transition-colors"
          >
            Restart to update
          </button>
        </div>
      )}

      {wide && (
        <div className="px-3 py-3 border-t border-white/5">
          <div className="text-[10.5px] text-slate-600 text-center leading-relaxed">
            <p>{version ? `v${version}` : ' '}</p>
            <p>© 2026 Shams Al Barakat Repair Services</p>
          </div>
        </div>
      )}
    </aside>
  );
}
