'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarContextValue {
  wide: boolean;
  setWide: (wide: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue>({ wide: false, setWide: () => {} });

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [wide, setWide] = useState(false);
  return <SidebarContext.Provider value={{ wide, setWide }}>{children}</SidebarContext.Provider>;
}

export function useSidebarWidth() {
  return useContext(SidebarContext);
}
