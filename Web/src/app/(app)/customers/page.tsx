'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomers } from '@/hooks/useCustomers';
import { ActionButton } from '@/components/ui/action-button';

export default function CustomersPage() {
  const router = useRouter();
  const [clientId, setClientId] = useState('');
  const { customers, stats, loading, error, listCustomers, createCustomer, updateCustomer, deleteCustomer, getStats } = useCustomers();

  useEffect(() => {
    const stored = localStorage.getItem('selectedClientId');
    if (stored) setClientId(stored);
  }, []);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', area: '', address: '', source: 'google', billing_type: 'individual' as 'individual' | 'contractor' });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (clientId) {
      listCustomers({ clientId });
      getStats();
    }
  }, [clientId, listCustomers, getStats]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    try {
      if (editingId) {
        await updateCustomer(editingId, formData, clientId);
        setEditingId(null);
      } else {
        await createCustomer({ ...formData, status: 'new' }, clientId);
      }
      setFormData({ name: '', phone: '', email: '', area: '', address: '', source: 'google', billing_type: 'individual' });
      setShowForm(false);
      await listCustomers({ clientId });
      await getStats(clientId);
    } catch (err) {
      console.error('Error saving customer:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!clientId) return;
    if (confirm('Delete this customer?')) {
      try {
        await deleteCustomer(id, clientId);
        await getStats(clientId);
      } catch (err) {
        console.error('Error deleting customer:', err);
      }
    }
  };

  const handleEdit = (customer: typeof customers[0]) => {
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      area: (customer as any).area || '',
      address: (customer as any).address || '',
      source: customer.source,
      billing_type: customer.billing_type || 'individual',
    });
    setEditingId(customer.id);
    setShowForm(true);
  };

  return (
    <div className="p-8 bg-slate-950 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-white">Customers</h1>
            <p className="text-sm text-slate-500 mt-1">Leads and customer contacts</p>
          </div>
          <ActionButton
            text={showForm ? 'Cancel' : 'Add Customer'}
            variant={showForm ? 'ghost' : 'primary'}
            showArrow={!showForm}
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({ name: '', phone: '', email: '', area: '', address: '', source: 'google', billing_type: 'individual' });
            }}
          />
        </div>

        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Customers', value: stats.total, color: 'text-white' },
              { label: 'New Leads', value: stats.new_count, color: 'text-blue-400' },
              { label: 'Booked', value: stats.booked_count, color: 'text-purple-600' },
              { label: 'Completed', value: stats.done_count, color: 'text-emerald-600' },
            ].map((s) => (
              <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-md px-4 py-3">
                <div className={`text-2xl font-semibold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <div className="bg-slate-900 border border-slate-800 rounded-md mb-6">
            <div className="px-5 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-300">{editingId ? 'Edit Customer' : 'New Customer'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Phone</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Source</label>
                <select value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600">
                  <option value="google">Google</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="referral">Referral</option>
                  <option value="walk_in">Walk In</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Billing Type</label>
                <select
                  value={formData.billing_type}
                  onChange={(e) => setFormData({ ...formData, billing_type: e.target.value as 'individual' | 'contractor' })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white"
                >
                  <option value="individual">Individual — invoiced immediately</option>
                  <option value="contractor">Contractor — invoiced monthly (batched)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Area</label>
                <input type="text" placeholder="e.g. Al Quoz, Dubai" value={formData.area} onChange={(e) => setFormData({ ...formData, area: e.target.value })} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Address</label>
                <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600" />
              </div>
              <div className="sm:col-span-2">
                <ActionButton type="submit" disabled={loading} text={loading ? 'Saving...' : editingId ? 'Update Customer' : 'Create Customer'} />
              </div>
            </form>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-200 text-red-400 text-sm px-4 py-3 rounded-md mb-6">{error}</div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">All Customers</h2>
            <span className="text-xs text-slate-400">{customers.length} total</span>
          </div>

          {customers.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-slate-500">No customers yet. Add one to get started.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-5 py-2 font-medium">Name</th>
                  <th className="px-5 py-2 font-medium">Phone</th>
                  <th className="px-5 py-2 font-medium">Area</th>
                  <th className="px-5 py-2 font-medium">Source</th>
                  <th className="px-5 py-2 font-medium">Billing</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                  <th className="px-5 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => router.push(`/customers/${customer.id}`)}
                    className="border-b border-slate-800 last:border-0 cursor-pointer hover:bg-slate-950"
                  >
                    <td className="px-5 py-3 font-medium text-white">{customer.name}</td>
                    <td className="px-5 py-3 text-slate-400">{customer.phone}</td>
                    <td className="px-5 py-3 text-slate-400">{(customer as any).area || '—'}</td>
                    <td className="px-5 py-3 text-slate-400 capitalize">{customer.source}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          customer.billing_type === 'contractor'
                            ? 'bg-violet-500/10 text-violet-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {customer.billing_type === 'contractor' ? 'Contractor' : 'Individual'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          customer.status === 'done'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : customer.status === 'booked'
                            ? 'bg-blue-500/10 text-blue-400'
                            : customer.status === 'contacted'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right space-x-3" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => handleEdit(customer)} className="text-xs font-medium text-blue-400 hover:text-blue-700">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(customer.id)} className="text-xs font-medium text-red-400 hover:text-red-400">
                        Delete
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
