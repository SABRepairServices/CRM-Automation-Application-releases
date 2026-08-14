'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useClients, Client } from '@/hooks/useClients';
import { ActionButton } from '@/components/ui/action-button';
import { isElectron, getBackupFolder, chooseBackupFolder } from '@/lib/electronBridge';
import { PinInput } from '@/components/ui/pin-input';
import { useAuth } from '@/context/AuthContext';
import { OWNER_EMAIL, OWNER_NAME } from '@/lib/authConstants';

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
  vat_number: '',
};

export default function SettingsPage() {
  const router = useRouter();
  const { clients, listClients, getClient, updateClient, loading, error } = useClients();
  const { pinConfigured, register, refreshPinStatus } = useAuth();
  const [clientId, setClientId] = useState('');
  const [clientsChecked, setClientsChecked] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saved, setSaved] = useState(false);
  const [logoError, setLogoError] = useState('');
  const [backupFolder, setBackupFolder] = useState<string | null>(null);
  const [changingFolder, setChangingFolder] = useState(false);
  const [backupFolderSaved, setBackupFolderSaved] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');
  const [changingPin, setChangingPin] = useState(false);
  const [changeFailCount, setChangeFailCount] = useState(0);
  const [setupPin, setSetupPin] = useState('');
  const [setupConfirmPin, setSetupConfirmPin] = useState('');
  const [setupError, setSetupError] = useState('');
  const [setupFailCount, setSetupFailCount] = useState(0);
  const [settingUpPin, setSettingUpPin] = useState(false);

  const applyClient = (c: Client) => {
    setFormData({
      name: c.name || '',
      logo_url: c.logo_url || '',
      email: c.email || '',
      phone: c.phone || '',
      address: c.address || '',
      city: c.city || '',
      country: c.country || '',
      billing_email: c.billing_email || '',
      vat_number: c.vat_number || '',
    });
  };

  const handleSelectClient = (id: string) => {
    if (!id) return;
    localStorage.setItem('selectedClientId', id);
    setClientId(id);
    getClient(id).then((c: Client | null) => c && applyClient(c));
  };

  useEffect(() => {
    const stored = localStorage.getItem('selectedClientId');
    if (stored) {
      setClientId(stored);
      getClient(stored).then((c: Client | null) => c && applyClient(c));
    }
    listClients().then(() => setClientsChecked(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Most installs only ever manage one business, so there's no reason to make
  // the owner hunt down the header's client dropdown just to edit their own
  // company profile — pick it for them the moment we know there's only one.
  useEffect(() => {
    if (clientId || clients.length !== 1) return;
    handleSelectClient(clients[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, clientId]);

  useEffect(() => {
    if (!isElectron()) return;
    getBackupFolder().then(setBackupFolder);
  }, []);

  const handleChooseFolder = async () => {
    setChangingFolder(true);
    try {
      const folder = await chooseBackupFolder();
      if (folder) {
        setBackupFolder(folder);
        setBackupFolderSaved(true);
        setTimeout(() => setBackupFolderSaved(false), 3000);
      }
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

  const handleChangePin = async (freshConfirm?: string) => {
    // freshConfirm is passed by onComplete before the React state update for
    // confirmNewPin has propagated — if absent (button click), fall back to
    // the already-current state value.
    const confirmToCheck = freshConfirm ?? confirmNewPin;
    setPinError('');
    setPinSuccess('');
    if (currentPin.length !== 4) {
      setPinError('Enter your current 4-digit PIN');
      return;
    }
    if (newPin.length !== 4) {
      setPinError('New PIN must be 4 digits');
      return;
    }
    if (newPin !== confirmToCheck) {
      setPinError('New PINs do not match');
      setConfirmNewPin('');
      setChangeFailCount((n) => n + 1);
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
      setCurrentPin('');
      setNewPin('');
      setConfirmNewPin('');
    } finally {
      setChangingPin(false);
    }
  };

  const handleSetPin = async (fullConfirmPin: string) => {
    setSetupError('');
    if (setupPin.length !== 4) {
      setSetupError('PIN must be 4 digits');
      return;
    }
    if (fullConfirmPin !== setupPin) {
      setSetupError('PINs do not match — try again');
      setSetupPin('');
      setSetupConfirmPin('');
      setSetupFailCount((n) => n + 1);
      return;
    }
    setSettingUpPin(true);
    try {
      await register(OWNER_EMAIL, setupPin, OWNER_NAME);
      await refreshPinStatus();
      setSetupPin('');
      setSetupConfirmPin('');
      // pinConfigured flips true right after this, swapping this card out
      // for changePinSection — set the shared success message now so it
      // carries over and actually confirms the PIN was saved, instead of
      // the card-swap being the only (easy to miss) feedback.
      setPinSuccess('PIN set successfully.');
    } catch (err: any) {
      setSetupError(err?.response?.data?.message || 'Could not set PIN');
      setSetupPin('');
      setSetupConfirmPin('');
    } finally {
      setSettingUpPin(false);
    }
  };

  const setPinSection = (
    <div className="bg-slate-900 border border-slate-800 rounded-md mb-6">
      <div className="px-5 py-3 border-b border-slate-800">
        <h2 className="text-sm font-semibold text-slate-300">Set a PIN</h2>
      </div>
      <div className="p-5 space-y-5">
        <p className=”text-xs text-slate-500”>
          No PIN is set yet, so the app opens straight to the dashboard. Set one here to lock it —
          it&apos;ll be required the next time the app starts.
        </p>
        {setupError && (
          <div className=”bg-red-500/10 border border-red-200 text-red-400 text-sm px-4 py-3 rounded-md”>{setupError}</div>
        )}
        <div>
          <label className=”block text-xs font-medium text-slate-500 mb-2 text-center”>New PIN</label>
          <PinInput key={`setup-${setupFailCount}`} length={4} value={setupPin} onChange={setSetupPin} />
        </div>
        <div>
          <label className=”block text-xs font-medium text-slate-500 mb-2 text-center”>Confirm PIN</label>
          <PinInput key={`setupconfirm-${setupFailCount}`} length={4} value={setupConfirmPin} onChange={setSetupConfirmPin} onComplete={handleSetPin} />
        </div>
        <ActionButton
          type="button"
          onClick={() => handleSetPin(setupConfirmPin)}
          disabled={settingUpPin || setupConfirmPin.length !== 4}
          text={settingUpPin ? 'Setting...' : 'Set PIN'}
        />
      </div>
    </div>
  );

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
          <label className=”block text-xs font-medium text-slate-500 mb-2 text-center”>Current PIN</label>
          <PinInput key={`cur-${changeFailCount}`} length={4} value={currentPin} onChange={setCurrentPin} />
        </div>
        <div>
          <label className=”block text-xs font-medium text-slate-500 mb-2 text-center”>New PIN</label>
          <PinInput key={`new-${changeFailCount}`} length={4} value={newPin} onChange={setNewPin} />
        </div>
        <div>
          <label className=”block text-xs font-medium text-slate-500 mb-2 text-center”>Confirm New PIN</label>
          <PinInput key={`confirm-${changeFailCount}`} length={4} value={confirmNewPin} onChange={setConfirmNewPin} onComplete={handleChangePin} />
        </div>
        <p className=”text-xs text-slate-500”>Forgot your current PIN? There&apos;s no self-service reset — contact your developer to reset it directly.</p>
        <ActionButton type="button" onClick={handleChangePin} disabled={changingPin} text={changingPin ? 'Changing...' : 'Change PIN'} />
      </div>
    </div>
  );

  const pinSection = pinConfigured ? changePinSection : setPinSection;

  if (!clientId) {
    return (
      <div className="px-4 py-4 bg-slate-950 min-h-screen">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-semibold text-white mb-2">Settings</h1>
          {pinSection}
          <div className="bg-slate-900 border border-slate-800 rounded-md">
            <div className="px-5 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-300">Company Profile</h2>
            </div>
            <div className="p-5">
              {!clientsChecked ? (
                <p className="text-sm text-slate-500 text-center py-8">Loading...</p>
              ) : clients.length === 0 ? (
                <div className=”text-center py-8”>
                  <p className=”text-sm text-slate-500 mb-4”>
                    No company profile set up yet. Go to <strong className=”text-slate-300”>Clients</strong> in the sidebar to add your business details (name, logo, contact info).
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-slate-500 mb-3">Choose which company profile to edit:</p>
                  <select
                    defaultValue=""
                    onChange={(e) => handleSelectClient(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="" disabled>Choose a company...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 bg-slate-950 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold text-white mb-1">Settings</h1>
        <p className="text-sm text-slate-500 mb-6">
          This company profile appears on every generated Quotation, Invoice, and Inspection Report — and the logo also replaces the &quot;SB&quot; badge in the sidebar and header once set.
        </p>

        {saved && (
          <div className="bg-emerald-500/10 border border-emerald-200 text-emerald-300 text-sm px-4 py-3 rounded-md mb-6">
            Saved. Documents will now use this profile.
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-200 text-red-400 text-sm px-4 py-3 rounded-md mb-6">{error}</div>
        )}

        {pinSection}

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
              <div className="flex-1 space-y-2">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Upload Logo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setLogoError('');
                      if (!file.type.startsWith('image/')) {
                        setLogoError('Please choose an image file.');
                        return;
                      }
                      if (file.size > 2 * 1024 * 1024) {
                        setLogoError('Logo must be under 2MB — try a smaller image.');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => setFormData((prev) => ({ ...prev, logo_url: String(reader.result) }));
                      reader.onerror = () => setLogoError('Could not read that file — try again.');
                      reader.readAsDataURL(file);
                    }}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-500 file:cursor-pointer cursor-pointer"
                  />
                  {logoError && <p className="text-xs text-red-400 mt-1">{logoError}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">or paste a Logo URL</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={formData.logo_url.startsWith('data:') ? '' : formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600"
                  />
                </div>
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
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Tax Registration Number (TRN)</label>
                <input type="text" placeholder="e.g. 100123456700003" value={formData.vat_number} onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600" />
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
              {backupFolderSaved && (
                <p className="text-xs text-emerald-400 mt-2">Backup folder updated.</p>
              )}
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

