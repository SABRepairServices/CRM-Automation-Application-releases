import { ReactNode } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { AuthGuard } from '@/components/AuthGuard';

export default function AppShellLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-950">
        <Sidebar />
        <Header />
        <main className="ml-16 pt-16 min-h-screen">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
