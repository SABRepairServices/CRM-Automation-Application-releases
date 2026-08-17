'use client';

import { useEffect, useState } from 'react';
import { useClients } from '@/hooks/useClients';
import { CLIENT_CHANGED_EVENT } from '@/hooks/useSelectedClientId';

export function ClientSelector() {
  const { clients, listClients } = useClients();
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    listClients();
  }, [listClients]);

  useEffect(() => {
    const stored = localStorage.getItem('selectedClientId');
    if (stored) setSelectedId(stored);
  }, []);

  const handleChange = (clientId: string) => {
    setSelectedId(clientId);
    localStorage.setItem('selectedClientId', clientId);
    window.dispatchEvent(new CustomEvent(CLIENT_CHANGED_EVENT));
  };

  // On a totally fresh profile (first-ever launch, or Electron's storage
  // wiped by a reinstall) nothing has ever written selectedClientId, so
  // every client-scoped page — Dashboard included — sat on an empty
  // clientId forever, looking exactly like "nothing is showing" even
  // though the account has real data. Almost every install only ever
  // manages one business, so there's no reason to make them hunt down
  // this dropdown just to see their own dashboard — pick it for them the
  // moment we know there's only one, same as Settings already does
  // locally for its own page. This fires the shared change event too, so
  // Dashboard/Header and everything else using useSelectedClientId()
  // picks it up immediately without a reload.
  useEffect(() => {
    if (selectedId || clients.length !== 1) return;
    handleChange(clients[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, selectedId]);

  if (clients.length === 0) return null;

  return (
    <select
      value={selectedId}
      onChange={(e) => handleChange(e.target.value)}
      className="px-3 py-1.5 text-sm border border-slate-700 bg-slate-950 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[180px]"
      title="Select Client"
    >
      <option value="">Choose a client...</option>
      {clients.map((client) => (
        <option key={client.id} value={client.id}>
          {client.name}
        </option>
      ))}
    </select>
  );
}
