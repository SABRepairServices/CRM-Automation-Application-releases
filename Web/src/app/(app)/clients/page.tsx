'use client';

import { useEffect, useState } from 'react';
import { useClients } from '@/hooks/useClients';
import { ActionButton } from '@/components/ui/action-button';

export default function ClientsPage() {
  const { clients, loading, error, listClients, createClient } = useClients();
  const [showForm, setShowForm] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', city: '' });
  const [selected, setSelected] = useState('');

  useEffect(() => {
    listClients();
    setSelected(localStorage.getItem('selectedClientId') || '');
  }, [listClients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await createClient(formData);
      setFormData({ name: '', email: '', phone: '', city: '' });
      setShowForm(false);
      if (!selected && created?.id) {
        localStorage.setItem('selectedClientId', created.id);
        setSelected(created.id);
      }
    } catch (err) {
      console.error('Error creating client:', err);
    }
  };

  const handleUseClient = (id: string) => {
    localStorage.setItem('selectedClientId', id);
    setSelected(id);
    window.location.reload();
  };

  return (
    <div className="px-4 py-4 bg-slate-950 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-white">Clients</h1>
            <p className="text-sm text-slate-500 mt-1">The businesses you manage in this CRM</p>
          </div>
          <ActionButton
            text={showForm ? 'Cancel' : 'Add Client'}
            variant={showForm ? 'ghost' : 'primary'}
            showArrow={!showForm}
            onClick={() => setShowForm(!showForm)}
          />
        </div>

        {showForm && (
          <div className="bg-slate-900 border border-slate-800 rounded-md mb-6">
            <div className="px-5 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-300">New Client</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Phone</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">City</label>
                <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600" />
              </div>
              <div className="sm:col-span-2">
                <ActionButton type="submit" disabled={loading} text={loading ? 'Creating...' : 'Create Client'} />
              </div>
            </form>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-200 text-red-400 text-sm px-4 py-3 rounded-md mb-6">{error}</div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">All Clients</h2>
            <span className="text-xs text-slate-400">{clients.length} total</span>
          </div>

          {clients.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-slate-500">No clients yet. Add one to get started.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-5 py-2 font-medium">Name</th>
                  <th className="px-5 py-2 font-medium">Email</th>
                  <th className="px-5 py-2 font-medium">Phone</th>
                  <th className="px-5 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-b border-slate-800 last:border-0">
                    <td className="px-5 py-3 font-medium text-white">{client.name}</td>
                    <td className="px-5 py-3 text-slate-400">{client.email || '—'}</td>
                    <td className="px-5 py-3 text-slate-400">{client.phone || '—'}</td>
                    <td className="px-5 py-3 text-right">
                      {selected === client.id ? (
                        <span className="text-xs font-medium text-emerald-400">Active</span>
                      ) : (
                        <button onClick={() => handleUseClient(client.id)} className="text-xs font-medium text-blue-400 hover:text-blue-700">
                          Use this client
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

