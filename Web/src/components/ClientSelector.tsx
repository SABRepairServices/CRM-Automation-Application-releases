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
    <div className="bg-slate-900 border-b border-slate-800 p-4">
      <label className="block text-sm font-medium text-slate-300 mb-2">Select Client</label>
      <select
        value={selectedId}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full px-4 py-2 border border-slate-700 bg-slate-950 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">Choose a client...</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.name}
          </option>
        ))}
      </select>
    </div>
  );
}
