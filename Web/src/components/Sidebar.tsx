'use client';

import { useEffect, useRef, useState, CSSProperties } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getAppVersion, installUpdate, isElectron, onUpdateDownloaded, UpdateInfo } from '@/lib/electronBridge';
import { useSidebarWidth } from '@/context/SidebarContext';
import {
  LayoutDashboard,
  Building2,
  Users,
  Wrench,
  ClipboardCheck,
  FileText,
  Receipt,
  CalendarRange,
  Phone,
  UserCog,
  FlaskConical,
  Pin,
  Share2,
} from 'lucide-react';

// Each nav item's icon keeps its own tint so the rail reads as a row of
// distinct controls, not one flat monochrome list — but the hover/selected
// motion itself (the ring-hover system) is one uniform amber "sidebar"
// context color, per the app-wide ring design system.
const ACCENTS = {
  blue: { text: 'text-blue-400', bg: 'bg-blue-500/15' },
  violet: { text: 'text-violet-400', bg: 'bg-violet-500/15' },
  cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500/15' },
  amber: { text: 'text-amber-400', bg: 'bg-amber-500/15' },
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  rose: { text: 'text-rose-400', bg: 'bg-rose-500/15' },
} as const;

const SIDEBAR_RING = { '--ring-clr': '245 158 11' } as CSSProperties;

const links: { href: string; label: string; icon: typeof LayoutDashboard; accent: keyof typeof ACCENTS }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, accent: 'blue' },
  { href: '/clients', label: 'Clients', icon: Building2, accent: 'violet' },
  { href: '/customers', label: 'Customers', icon: Users, accent: 'cyan' },
  { href: '/technicians', label: 'Technicians', icon: UserCog, accent: 'amber' },
  { href: '/jobs', label: 'Jobs', icon: Wrench, accent: 'emerald' },
  { href: '/inspections', label: 'Inspections', icon: ClipboardCheck, accent: 'rose' },
  { href: '/quotes', label: 'Quotes', icon: FileText, accent: 'blue' },
  { href: '/invoices', label: 'Invoices', icon: Receipt, accent: 'violet' },
  { href: '/monthly-invoices', label: 'Monthly Invoices', icon: CalendarRange, accent: 'amber' },
  { href: '/social-accounts', label: 'Social Accounts', icon: Share2, accent: 'violet' },
  { href: '/call-agent', label: 'Call Agent', icon: Phone, accent: 'cyan' },
  { href: '/whatsapp-sim', label: 'WhatsApp Sim', icon: FlaskConical, accent: 'rose' },
];

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;
  const [version, setVersion] = useState<string | null>(null);
  const [updateReady, setUpdateReady] = useState<UpdateInfo | null>(null);
  const [autoInstallIn, setAutoInstallIn] = useState<number | null>(null);

  // Three-state expand logic: collapsed icon rail by default, hover
  // previews it wide, and pinning locks it wide until unpinned. Closing it
  // manually while the cursor is still resting on it must not let the same
  // hover reopen it — only a fresh mouseenter (after actually leaving) does.
  const [pinned, setPinned] = useState(false);
  const [hovering, setHovering] = useState(false);
  const suppressHoverRef = useRef(false);
  const wide = pinned || hovering;

  // The main content area lives outside this component (in the shared app
  // shell layout) and only needs to shift over for a PINNED sidebar — a
  // persistent layout change the user asked for. A hover preview is
  // transient and shouldn't reflow the page every time the cursor passes
  // near the edge; the sidebar is already `position: fixed` with its own
  // z-index, so while only hovering it just floats over the content
  // (which has real desktop-window room to spare) instead of shoving it
  // aside and back on every mouse-in/mouse-out.
  const { setWide: setSidebarWide } = useSidebarWidth();
  useEffect(() => {
    setSidebarWide(pinned);
  }, [pinned, setSidebarWide]);

  useEffect(() => {
    if (!isElectron()) return;
    getAppVersion().then(setVersion);
    return onUpdateDownloaded((info) => setUpdateReady(info));
  }, []);

  // Mirrors the real 30s auto-install timer main.js runs — purely a visual
  // cue so the app quitting and relaunching on its own doesn't blindside
  // whoever's mid-task; clicking "Restart Now" jumps straight to install
  // and this display never matters.
  //
  // Keyed on the version STRING, not the updateReady object — main.js now
  // dedupes repeat 'update-downloaded' events for the same version, but
  // keying on object identity here too is cheap insurance: an object
  // reference changing without the version actually changing would have
  // restarted this effect and reset the countdown back to 30, which is
  // exactly what made the timer visibly jump instead of counting down.
  useEffect(() => {
    if (!updateReady) {
      setAutoInstallIn(null);
      return;
    }
    setAutoInstallIn(30);
    const interval = setInterval(() => {
      setAutoInstallIn((s) => (s === null ? null : Math.max(0, s - 1)));
    }, 1000);
    return () => clearInterval(interval);
  }, [updateReady?.version]);

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
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] z-30 flex flex-col transition-all duration-500 ease-in-out ${
        wide
          ? 'w-56 bg-slate-900 shadow-[8px_0_24px_-8px_rgba(0,0,0,0.5)]'
          : 'w-16 bg-slate-900'
      }`}
    >
      <div className={`flex items-center h-9 shrink-0 ${wide ? 'justify-end px-2 pt-2' : 'justify-center pt-2'}`}>
        <button
          onClick={togglePin}
          title={pinned ? 'Unpin sidebar' : 'Pin sidebar open'}
          aria-label={pinned ? 'Unpin sidebar' : 'Pin sidebar open — needed to use the sidebar on touch devices, which have no hover'}
          className={`spring-hover w-7 h-7 rounded-full flex items-center justify-center ${
            pinned
              ? 'text-cyan-400 bg-cyan-500/15 shadow-[0_0_10px_rgba(34,211,238,0.5)] rotate-45'
              : 'text-slate-500 hover:text-cyan-300 hover:bg-white/5 hover:scale-110'
          }`}
        >
          <Pin className="w-3.5 h-3.5" strokeWidth={2.4} />
        </button>
      </div>

      <nav className="flex-1 px-2.5 py-1 space-y-1.5 overflow-y-auto overflow-x-hidden">
        {links.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.href);
          const accent = ACCENTS[link.accent];
          return (
            <Link
              key={link.href}
              href={link.href}
              title={wide ? undefined : link.label}
              style={SIDEBAR_RING}
              className={`group relative flex items-center gap-2.5 rounded-lg text-sm transition-all duration-150 ${
                wide ? `px-2 py-2 nav-row-3d ring-hover ring-hover-row ${active ? 'ring-hover-selected' : ''}` : 'justify-center px-0 py-2'
              } ${active ? 'text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <span
                style={SIDEBAR_RING}
                className={`ring-hover ring-hover-icon flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${active ? 'ring-hover-selected' : ''} ${accent.bg}`}
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
        <div className="mx-2.5 mb-2.5 rounded-lg bg-blue-500/10 border border-blue-500/30 px-3 py-2.5 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shrink-0" />
            <p className="text-xs text-blue-300 font-semibold">Update ready &mdash; v{updateReady.version}</p>
          </div>
          {updateReady.releaseNotes && (
            <p className="text-[10.5px] text-slate-400 leading-relaxed line-clamp-3">
              {String(updateReady.releaseNotes).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}
            </p>
          )}
          <button
            onClick={() => installUpdate()}
            className="w-full text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-md px-2 py-1.5 transition-colors"
          >
            Restart Now
          </button>
          {autoInstallIn !== null && (
            <p className="text-[10px] text-slate-500 text-center">
              Installing automatically in {autoInstallIn}s if untouched
            </p>
          )}
        </div>
      )}

      {/* Collapsed rail has no room for the full card above, but an update
          being ready — and about to auto-install on its own 30s timer — is
          exactly the kind of thing that shouldn't be invisible just because
          nobody happens to be hovering the sidebar at that moment. A small
          pulsing dot on the pin/toggle button is visible in both states and
          hovering it (or the sidebar itself) reveals the full card. */}
      {updateReady && !wide && (
        <div className="pb-2.5 flex justify-center" title={`Update ready — v${updateReady.version} — hover the sidebar for details`}>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
          </span>
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
