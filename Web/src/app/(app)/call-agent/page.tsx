'use client';

export default function CallAgentPage() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-10 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center text-2xl">
          ☎️
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Call Agent — Coming Soon</h1>
        <p className="text-slate-400 max-w-md mx-auto">
          This section will handle automated customer calls, follow-ups, and reminders once
          it's wired up. It's reserved in the navigation now so the layout won't need to
          change when it's built.
        </p>
      </div>
    </div>
  );
}
