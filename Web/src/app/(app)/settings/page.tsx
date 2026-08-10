'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useClients, Client } from '@/hooks/useClients';
import { ActionButton } from '@/components/ui/action-button';
import { isElectron, getBackupFolder, chooseBackupFolder } from '@/lib/electronBridge';
import { PinInput } from '@/components/ui/pin-input';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const EMPTY_FORM = {
  name: '',
  logo_url: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  country: '',
  billing_email: '',
};

export default function SettingsPage() {
  const { getClient, updateClient, loading, error } = useClients();
  const [clientId, setClientId] = useState('');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saved, setSaved] = useState(false);
  const [backupFolder, setBackupFolder] = useState<string | null>(null);
  const [changingFolder, setChangingFolder] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');
  const [changingPin, setChangingPin] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('selectedClientId');
    if (!stored) return;
    setClientId(stored);
    getClient(stored).then((c: Client | null) => {
      if (!c) return;
      setFormData({
        name: c.name || '',
        logo_url: c.logo_url || '',
        email: c.email || '',
        phone: c.phone || '',
        address: c.address || '',
        city: c.city || '',
        country: c.country || '',
        billing_email: c.billing_email || '',
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isElectron()) return;
    getBackupFolder().then(setBackupFolder);
  }, []);

  const handleChooseFolder = async () => {
    setChangingFolder(true);
    try {
      const folder = await chooseBackupFolder();
      if (folder) setBackupFolder(folder);
    } finally {
      setChangingFolder(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    setSaved(false);
    try {
      await updateClient(clientId, formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving company profile:', err);
    }
  };

  const handleChangePin = async () => {
    setPinError('');
    setPinSuccess('');
    if (currentPin.length !== 6) {
      setPinError('Enter your current 6-digit PIN');
      return;
    }
    if (newPin.length !== 6) {
      setPinError('New PIN must be 6 digits');
      return;
    }
    if (newPin !== confirmNewPin) {
      setPinError('New PINs do not match');
      return;
    }
    setChangingPin(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/auth/change-pin`,
        { currentPin, newPin },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPinSuccess('PIN changed successfully.');
      setCurrentPin('');
      setNewPin('');
      setConfirmNewPin('');
    } catch (err: any) {
      setPinError(err?.response?.data?.message || 'Could not change PIN');
    } finally {
      setChangingPin(false);
    }
  };

  const changePinSection = (
    <div className="bg-slate-900 border border-slate-800 rounded-md mb-6">
      <div className="px-5 py-3 border-b border-slate-800">
        <h2 className="text-sm font-semibold text-slate-300">Change PIN</h2>
      </div>
      <div className="p-5 space-y-5">
        {pinError && (
          <div className="bg-red-500/10 border border-red-200 text-red-400 text-sm px-4 py-3 rounded-md">{pinError}</div>
        )}
        {pinSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-200 text-emerald-300 text-sm px-4 py-3 rounded-md">{pinSuccess}</div>
        )}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-2 text-center">Current PIN</label>
          <PinInput length={6} value={currentPin} onChange={setCurrentPin} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-2 text-center">New PIN</label>
          <PinInput length={6} value={newPin} onChange={setNewPin} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-2 text-center">Confirm New PIN</label>
          <PinInput length={6} value={confirmNewPin} onChange={setConfirmNewPin} onComplete={handleChangePin} />
        </div>
        <p className="text-xs text-slate-500">Forgot your current PIN instead? Sign out and use &quot;Forgot PIN?&quot; on the login screen.</p>
        <ActionButton type="button" onClick={handleChangePin} disabled={changingPin} text={changingPin ? 'Changing...' : 'Change PIN'} />
      </div>
    </div>
  );

  if (!clientId) {
    return (
      <div className="p-8 bg-slate-950 min-h-screen">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-semibold text-white mb-2">Settings</h1>
          {changePinSection}
          <div className="bg-slate-900 border border-slate-800 rounded-md px-5 py-12 text-center">
            <p className="text-sm text-slate-500">Select a client from the dropdown above for company profile settings.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-950 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold text-white mb-1">Settings</h1>
        <p className="text-sm text-slate-500 mb-6">
          This company profile appears on every generated Quotation, Invoice, and Inspection Report.
        </p>

        {saved && (
          <div className="bg-emerald-500/10 border border-emerald-200 text-emerald-300 text-sm px-4 py-3 rounded-md mb-6">
            Saved. Documents will now use this profile.
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-200 text-red-400 text-sm px-4 py-3 rounded-md mb-6">{error}</div>
        )}

        {changePinSection}

        <div className="bg-slate-900 border border-slate-800 rounded-md mb-6">
          <div className="px-5 py-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-300">Company Profile</h2>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-md border border-slate-800 flex items-center justify-center overflow-hidden bg-slate-950 shrink-0">
                {formData.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={formData.logo_url} alt="Logo preview" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-xs text-slate-400">No logo</span>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-500 mb-1">Logo URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Company Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Phone</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Billing Email</label>
                <input type="email" value={formData.billing_email} onChange={(e) => setFormData({ ...formData, billing_email: e.target.value })} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">Address</label>
                <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">City</label>
                <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Country</label>
                <input type="text" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600" />
              </div>
            </div>

            <ActionButton type="submit" disabled={loading} text={loading ? 'Saving...' : 'Save Company Profile'} />
          </form>
        </div>

        {isElectron() && (
          <div className="bg-slate-900 border border-slate-800 rounded-md mb-6">
            <div className="px-5 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-300">Local Backup Folder</h2>
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-500 mb-3">
                Every Quotation, Invoice, and Inspection Report is automatically saved as a PDF here too —
                independent of the cloud database, so nothing is lost even if internet or account access is
                interrupted. Safe to point this at a shared drive so your boss always has a local copy.
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 px-3 py-2 border border-slate-800 rounded-md text-sm text-slate-300 bg-slate-950 truncate">
                  {backupFolder || 'Loading...'}
                </div>
                <ActionButton
                  text={changingFolder ? 'Choosing...' : 'Change Folder'}
                  variant="ghost"
                  showArrow={false}
                  disabled={changingFolder}
                  onClick={handleChooseFolder}
                />
              </div>
            </div>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-md">
          <div className="px-5 py-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-300">Social Integrations</h2>
          </div>
          <div className="p-5 space-y-3">
            {['Facebook / Instagram', 'TikTok', 'Google Business'].map((name) => (
              <div key={name} className="flex items-center justify-between px-4 py-3 border border-slate-800 rounded-md">
                <div>
                  <div className="text-sm font-medium text-white">{name}</div>
                  <div className="text-xs text-slate-500">Not connected yet</div>
                </div>
                <span className="text-xs text-slate-400">Coming soon</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
