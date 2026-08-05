import React from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  variant?: 'primary' | 'success' | 'danger' | 'ghost';
  showArrow?: boolean;
}

const VARIANTS: Record<string, string> = {
  primary: 'bg-blue-600 border-blue-600 text-white hover:bg-blue-500',
  success: 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-500',
  danger: 'bg-red-950/40 border-red-900 text-red-400 hover:bg-red-900/50',
  ghost: 'bg-slate-800/60 border-slate-700 text-slate-200 hover:bg-slate-700/60',
};

// Technique #15/#16 (UI-Inspiration-Library) — neon glow on hover/focus,
// color-matched per variant so it reads as "this button is lit up" rather
// than a generic drop-shadow.
const GLOW: Record<string, string> = {
  primary: 'hover:shadow-[0_0_16px_rgba(59,130,246,0.55)] focus-visible:shadow-[0_0_16px_rgba(59,130,246,0.55)]',
  success: 'hover:shadow-[0_0_16px_rgba(16,185,129,0.55)] focus-visible:shadow-[0_0_16px_rgba(16,185,129,0.55)]',
  danger: 'hover:shadow-[0_0_16px_rgba(248,113,113,0.4)] focus-visible:shadow-[0_0_16px_rgba(248,113,113,0.4)]',
  ghost: 'hover:shadow-[0_0_14px_rgba(148,163,184,0.3)] focus-visible:shadow-[0_0_14px_rgba(148,163,184,0.3)]',
};

/**
 * A tasteful, professional take on the dashboard's InteractiveHoverButton —
 * same slide-out-text / slide-in-arrow interaction, but flat solid colors
 * instead of the purple gradient, tuned for the app's dark CRUD pages.
 */
const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ text, variant = 'primary', showArrow = true, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'group relative overflow-hidden rounded-md border px-4 py-2 text-sm font-medium transition-all duration-200',
          VARIANTS[variant],
          GLOW[variant],
          className
        )}
        {...props}
      >
        <span
          className={cn(
            'inline-flex items-center gap-1.5 transition-transform duration-200',
            showArrow && 'group-hover:-translate-x-1'
          )}
        >
          {text}
          {showArrow && (
            <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" />
          )}
        </span>
      </button>
    );
  }
);

ActionButton.displayName = 'ActionButton';

export { ActionButton };
