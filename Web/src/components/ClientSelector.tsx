'use client';

import { useEffect, useState } from 'react';
import { useClients } from '@/hooks/useClients';

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
  };

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
