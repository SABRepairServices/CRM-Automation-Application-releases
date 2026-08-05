'use client';

import { useEffect, useState } from 'react';
import { useTechnicians } from '@/hooks/useTechnicians';
import { ActionButton } from '@/components/ui/action-button';

export default function TechniciansPage() {
  const { technicians, loading, error, listTechnicians, createTechnician, deleteTechnician } = useTechnicians();
  const [showForm, setShowForm] = useState(false);
  const [clientId, setClientId] = useState('');
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', speciality: '' });

  useEffect(() => {
    const stored = localStorage.getItem('selectedClientId');
    if (stored) {
      setClientId(stored);
      listTechnicians(stored);
    }
  }, [listTechnicians]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    try {
      await createTechnician(formData, clientId);
      setFormData({ name: '', phone: '', email: '', speciality: '' });
      setShowForm(false);
    } catch (err) {
      console.error('Error creating technician:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this technician?')) return;
    try {
      await deleteTechnician(id, clientId);
    } catch (err) {
      console.error('Error deleting technician:', err);
    }
  };

  return (
    <div className="p-8 bg-slate-950 min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-white">Technicians</h1>
            <p className="text-sm text-slate-500 mt-1">Repair staff available for job assignment</p>
          </div>
          <ActionButton
            text={showForm ? 'Cancel' : 'Add Technician'}
            variant={showForm ? 'ghost' : 'primary'}
            showArrow={!showForm}
            onClick={() => setShowForm(!showForm)}
          />
        </div>

        {/* Add form — plain bordered box, no gradients/animation */}
        {showForm && (
          <div className="bg-slate-900 border border-slate-800 rounded-md mb-6">
            <div className="px-5 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-300">New Technician</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Email (optional)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Speciality (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. washing machine, AC, oven"
                  value={formData.speciality}
                  onChange={(e) => setFormData({ ...formData, speciality: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="sm:col-span-2">
                <ActionButton type="submit" disabled={loading} text={loading ? 'Adding...' : 'Add Technician'} />
              </div>
            </form>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-200 text-red-400 text-sm px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* List — bordered rows inside a single box, table-like, no shadows/animation */}
        <div className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">All Technicians</h2>
            <span className="text-xs text-slate-400">{technicians.length} total</span>
          </div>

          {technicians.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-slate-500">No technicians yet. Add one to start assigning jobs.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-5 py-2 font-medium">Name</th>
                  <th className="px-5 py-2 font-medium">Phone</th>
                  <th className="px-5 py-2 font-medium">Email</th>
                  <th className="px-5 py-2 font-medium">Speciality</th>
                  <th className="px-5 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {technicians.map((tech) => (
                  <tr key={tech.id} className="border-b border-slate-800 last:border-0">
                    <td className="px-5 py-3 font-medium text-white">{tech.name}</td>
                    <td className="px-5 py-3 text-slate-400">{tech.phone}</td>
                    <td className="px-5 py-3 text-slate-400">{tech.email || '—'}</td>
                    <td className="px-5 py-3 text-slate-400">{tech.speciality || '—'}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleDelete(tech.id)}
                        className="text-red-400 hover:text-red-400 text-xs font-medium"
                      >
                        Remove
                      </button>
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
