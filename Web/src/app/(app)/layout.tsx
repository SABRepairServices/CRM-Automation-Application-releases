'use client';

import { ReactNode } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { AuthGuard } from '@/components/AuthGuard';
import { SidebarProvider, useSidebarWidth } from '@/context/SidebarContext';

function MainArea({ children }: { children: ReactNode }) {
  const { wide } = useSidebarWidth();
  return (
    <main className={`pt-16 min-h-screen transition-[margin-left] duration-500 ease-in-out ${wide ? 'ml-56' : 'ml-16'}`}>
      {children}
    </main>
  );
}

export default function AppShellLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="min-h-screen bg-slate-950">
          <Sidebar />
          <Header />
          <MainArea>{children}</MainArea>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}
