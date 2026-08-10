'use client';

import { useEffect, useState } from 'react';
import { DownloadCloud, X } from 'lucide-react';
import { onUpdateDownloaded, installUpdate } from '@/lib/electronBridge';

export function UpdateNotification() {
  const [version, setVersion] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const unsubscribe = onUpdateDownloaded((v) => {
      setVersion(v);
      setDismissed(false);
    });
    return unsubscribe;
  }, []);

  if (!version || dismissed) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      <div className="px-4 pt-4 pb-3 flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shrink-0">
          <DownloadCloud className="w-4.5 h-4.5 text-white" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white">Update ready</div>
          <p className="text-xs text-slate-400 mt-0.5">
            Version {version} has downloaded in the background and is ready to install.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="text-slate-500 hover:text-slate-300 shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex border-t border-slate-800">
        <button
          onClick={() => setDismissed(true)}
          className="flex-1 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800/60 transition-colors"
        >
          Later
        </button>
        <div className="w-px bg-slate-800" />
        <button
          onClick={async () => {
            setInstalling(true);
            await installUpdate();
          }}
          disabled={installing}
          className="flex-1 py-2.5 text-sm font-semibold text-blue-400 hover:bg-slate-800/60 transition-colors disabled:opacity-50"
        >
          {installing ? 'Restarting...' : 'Restart Now'}
        </button>
      </div>
    </div>
  );
}
