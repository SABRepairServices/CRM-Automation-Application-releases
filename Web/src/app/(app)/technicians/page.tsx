'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTechnicians, Technician } from '@/hooks/useTechnicians';
import { useJobs } from '@/hooks/useJobs';
import { useSelectedClientId } from '@/hooks/useSelectedClientId';
import { ActionButton } from '@/components/ui/action-button';

const ACTIVE_STATUSES = ['scheduled', 'inspected', 'quoted', 'approved', 'in_progress'];

export default function TechniciansPage() {
  const router = useRouter();
  const { technicians, loading, error, listTechnicians, createTechnician, updateTechnician, deleteTechnician } = useTechnicians();
  const { jobs, listJobs } = useJobs();
  const clientId = useSelectedClientId();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', speciality: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: '', phone: '', email: '', speciality: '' });

  useEffect(() => {
    if (clientId) {
      listTechnicians(clientId);
      listJobs(clientId);
    }
  }, [clientId, listTechnicians, listJobs]);

  const activeJobCount = (techId: string) =>
    jobs.filter((j) => j.technician_id === techId && ACTIVE_STATUSES.includes(j.status)).length;

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

  const startEdit = (tech: Technician) => {
    setEditingId(tech.id);
    setEditData({ name: tech.name, phone: tech.phone, email: tech.email || '', speciality: tech.speciality || '' });
  };

  const handleSaveEdit = async (id: string) => {
    if (!clientId) return;
    try {
      await updateTechnician(id, editData, clientId);
      setEditingId(null);
    } catch (err) {
      console.error('Error updating technician:', err);
    }
  };

  const handleDelete = async (id: string) => {
    const active = activeJobCount(id);
    if (active > 0) {
      const deactivateInstead = confirm(
        `This technician has ${active} active job${active === 1 ? '' : 's'}. Removing them won't reassign those jobs.\n\nClick OK to deactivate instead (keeps their history, hides them from new assignments), or Cancel to stop.`
      );
      if (deactivateInstead) {
        try {
          await updateTechnician(id, { is_active: false }, clientId);
        } catch (err) {
          console.error('Error deactivating technician:', err);
        }
      }
      return;
    }
    if (!confirm('Remove this technician? This cannot be undone.')) return;
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

          {!clientId ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-slate-500">Select a client from the dropdown in the header to see technicians.</p>
            </div>
          ) : loading ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-slate-500">Loading...</p>
            </div>
          ) : technicians.length === 0 ? (
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
                  <th className="px-5 py-2 font-medium">Workload</th>
                  <th className="px-5 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {technicians.map((tech) => {
                  const active = activeJobCount(tech.id);
                  const isEditing = editingId === tech.id;
                  return (
                    <tr key={tech.id} className="border-b border-slate-800 last:border-0">
                      {isEditing ? (
                        <>
                          <td className="px-5 py-2">
                            <input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-sm text-white" />
                          </td>
                          <td className="px-5 py-2">
                            <input value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-sm text-white" />
                          </td>
                          <td className="px-5 py-2">
                            <input value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-sm text-white" />
                          </td>
                          <td className="px-5 py-2">
                            <input value={editData.speciality} onChange={(e) => setEditData({ ...editData, speciality: e.target.value })} className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-sm text-white" />
                          </td>
                          <td className="px-5 py-3 text-slate-500">—</td>
                          <td className="px-5 py-3 text-right space-x-3 whitespace-nowrap">
                            <button onClick={() => handleSaveEdit(tech.id)} className="text-emerald-400 hover:text-emerald-300 text-xs font-medium">Save</button>
                            <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-300 text-xs font-medium">Cancel</button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td
                            className="px-5 py-3 font-medium text-white cursor-pointer hover:underline"
                            onClick={() => router.push(`/technicians/${tech.id}`)}
                          >
                            {tech.name}
                          </td>
                          <td className="px-5 py-3 text-slate-400">{tech.phone}</td>
                          <td className="px-5 py-3 text-slate-400">{tech.email || '—'}</td>
                          <td className="px-5 py-3 text-slate-400">{tech.speciality || '—'}</td>
                          <td className="px-5 py-3">
                            {!tech.is_active ? (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-500">Inactive</span>
                            ) : active > 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400">{active} active</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-500">Free</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right space-x-3 whitespace-nowrap">
                            <button onClick={() => startEdit(tech)} className="text-blue-400 hover:text-blue-300 text-xs font-medium">Edit</button>
                            {!tech.is_active && (
                              <button onClick={() => updateTechnician(tech.id, { is_active: true }, clientId)} className="text-emerald-400 hover:text-emerald-300 text-xs font-medium">Reactivate</button>
                            )}
                            <button onClick={() => handleDelete(tech.id)} className="text-red-400 hover:text-red-300 text-xs font-medium">Remove</button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
