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

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

const EMPTY_FORM = {
  name: '',
  logo_url: '',
  document_logo_url: '',
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
  const [metaConfigured, setMetaConfigured] = useState<boolean | null>(null);
  const [clientsChecked, setClientsChecked] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saved, setSaved] = useState(false);
  const [logoError, setLogoError] = useState('');
  const [docLogoError, setDocLogoError] = useState('');
  const [savingLogos, setSavingLogos] = useState(false);
  const [logosSaved, setLogosSaved] = useState(false);
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
  const [waToken, setWaToken] = useState('');
  const [waPhoneId, setWaPhoneId] = useState('');
  const [waDisplay, setWaDisplay] = useState('');
  const [waStatus, setWaStatus] = useState<{ connected: boolean; phoneNumberId?: string | null; displayNumber?: string | null; connectedAt?: string | null } | null>(null);
  const [waSaving, setWaSaving] = useState(false);
  const [waMsg, setWaMsg] = useState('');

  const applyClient = (c: Client) => {
    setFormData({
      name: c.name || '',
      logo_url: c.logo_url || '',
      document_logo_url: c.document_logo_url || '',
      email: c.email || '',
      phone: c.phone || '',
      address: c.address || '',
      city: c.city || '',
      country: c.country || '',
      billing_email: c.billing_email || '',
      vat_number: c.vat_number || '',
    });
  };

  const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const loadWaStatus = async (id: string) => {
    try {
      const { data } = await axios.get(`${API_URL}/clients/${id}/whatsapp`, authHeaders());
      setWaStatus(data.data);
    } catch { /* non-fatal */ }
  };

  const handleSelectClient = (id: string) => {
    if (!id) return;
    localStorage.setItem('selectedClientId', id);
    setClientId(id);
    getClient(id).then((c: Client | null) => c && applyClient(c));
    loadWaStatus(id);
  };

  useEffect(() => {
    const stored = localStorage.getItem('selectedClientId');
    if (stored) {
      setClientId(stored);
      getClient(stored).then((c: Client | null) => c && applyClient(c));
      loadWaStatus(stored);
    }
    listClients().then(() => setClientsChecked(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Most installs only ever manage one business, so there's no reason to make
  // the owner hunt down the header's client dropdown just to edit their own
  // company profile -- pick it for them the moment we know there's only one.
  useEffect(() => {
    if (clientId || clients.length !== 1) return;
    handleSelectClient(clients[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, clientId]);

  useEffect(() => {
    if (!isElectron()) return;
    getBackupFolder().then(setBackupFolder);
  }, []);

  useEffect(() => {
    axios
      .get(`${API_URL}/social-accounts/meta-status`, authHeaders())
      .then(({ data }) => setMetaConfigured(Boolean(data?.data?.configured)))
      .catch(() => setMetaConfigured(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const { logo_url, document_logo_url, ...companyDetails } = formData;
      await updateClient(clientId, companyDetails);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving company profile:', err);
    }
  };

  // Logos save independently from the rest of the company profile — you
  // shouldn't have to fill in or re-submit name/phone/address just to swap
  // a logo, and vice versa.
  const handleSaveLogos = async () => {
    if (!clientId) return;
    setSavingLogos(true);
    setLogosSaved(false);
    try {
      await updateClient(clientId, { logo_url: formData.logo_url, document_logo_url: formData.document_logo_url });
      setLogosSaved(true);
      setTimeout(() => setLogosSaved(false), 3000);
    } catch (err) {
      console.error('Error saving logos:', err);
    } finally {
      setSavingLogos(false);
    }
  };

  const handleSaveWhatsapp = async () => {
    if (!clientId) return;
    setWaSaving(true);
    setWaMsg('');
    try {
      await axios.put(`${API_URL}/clients/${clientId}/whatsapp`, {
        token: waToken,
        phoneNumberId: waPhoneId,
        displayNumber: waDisplay,
      }, authHeaders());
      await loadWaStatus(clientId);
      setWaToken('');
      setWaPhoneId('');
      setWaMsg(waToken ? 'WhatsApp number connected.' : 'WhatsApp disconnected.');
      setTimeout(() => setWaMsg(''), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      setWaMsg(`Error: ${msg}`);
    } finally {
      setWaSaving(false);
    }
  };

  const handleDisconnectWhatsapp = async () => {
    if (!clientId) return;
    setWaSaving(true);
    setWaMsg('');
    try {
      await axios.put(`${API_URL}/clients/${clientId}/whatsapp`, { token: '', phoneNumberId: '', displayNumber: '' }, authHeaders());
      setWaStatus({ connected: false });
      setWaMsg('WhatsApp disconnected.');
      setTimeout(() => setWaMsg(''), 4000);
    } catch { setWaMsg('Failed to disconnect.'); } finally { setWaSaving(false); }
  };

  const handleChangePin = async (freshConfirm?: string) => {
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
      setSetupError('PINs do not match -- try again');
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
        <p className="text-xs text-slate-500">
          No PIN is set yet, so the app opens straight to the dashboard. Set one here to lock it &mdash;
          it&apos;ll be required the next time the app starts.
        </p>
        {setupError && (
          <div className="bg-red-500/10 border border-red-200 text-red-400 text-sm px-4 py-3 rounded-md">{setupError}</div>
        )}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-2 text-center">New PIN</label>
          <PinInput key={`setup-${setupFailCount}`} length={4} value={setupPin} onChange={setSetupPin} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-2 text-center">Confirm PIN</label>
          <PinInput key={`setupconfirm-${setupFailCount}`} length={4} value={setupConfirmPin} onChange={setSetupConfirmPin} onComplete={handleSetPin} />
        </div>
        <ActionButton
          type="button"
          onClick={() => handleSetPin(setupConfirmPin)}
          disabled={settingUpPin || setupConfirmPin.length !== 4}
          isLoading={settingUpPin}
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
          <label className="block text-xs font-medium text-slate-500 mb-2 text-center">Current PIN</label>
          <PinInput key={`cur-${changeFailCount}`} length={4} value={currentPin} onChange={setCurrentPin} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-2 text-center">New PIN</label>
          <PinInput key={`new-${changeFailCount}`} length={4} value={newPin} onChange={setNewPin} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-2 text-center">Confirm New PIN</label>
          <PinInput key={`confirm-${changeFailCount}`} length={4} value={confirmNewPin} onChange={setConfirmNewPin} onComplete={handleChangePin} />
        </div>
        <p className="text-xs text-slate-500">Forgot your current PIN? There&apos;s no self-service reset &mdash; contact your developer to reset it directly.</p>
        <ActionButton type="button" onClick={() => handleChangePin()} disabled={changingPin} isLoading={changingPin} text={changingPin ? 'Changing...' : 'Change PIN'} />
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
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500 mb-4">
                    No company profile set up yet. Go to <strong className="text-slate-300">Clients</strong> in the sidebar to add your business details (name, logo, contact info).
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
                    <option value="" disabled>Choose a company&hellip;</option>
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
          This company profile appears on every generated Quotation, Invoice, and Inspection Report &mdash; and the logo also replaces the &quot;SB&quot; badge in the sidebar and header once set.
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

        {/* Saves independently from Company Profile below — swapping a
            logo shouldn't require touching or re-submitting name/phone/
            address, and vice versa. */}
        <div className="bg-slate-900 border border-slate-800 rounded-md mb-6">
          <div className="px-5 py-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-300">Logos</h2>
          </div>
          <div className="p-5 space-y-5">
            <div className="group flex items-center gap-4">
              <div className="spring-hover w-20 h-20 rounded-md border border-slate-800 flex items-center justify-center overflow-hidden bg-slate-950 shrink-0 group-hover:border-blue-500/50 group-hover:shadow-[0_0_16px_-2px_rgba(96,165,250,0.4)]">
                {formData.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={formData.logo_url} alt="Logo preview" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-xs text-slate-400">No logo</span>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">App Logo <span className="font-normal text-slate-600">— sidebar &amp; header badge</span></label>
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
                        setLogoError('Logo must be under 2MB &mdash; try a smaller image.');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => setFormData((prev) => ({ ...prev, logo_url: String(reader.result) }));
                      reader.onerror = () => setLogoError('Could not read that file &mdash; try again.');
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

            {/* Separate from the App Logo above — a business often wants a
                compact square mark for the app UI but a wider letterhead
                logo on the actual paperwork customers receive. Falls back
                to the App Logo automatically (see DocumentHeader.tsx) if
                this is left blank, so setting only one still works fine. */}
            <div className="group flex items-center gap-4 pt-1 border-t border-slate-800/60">
              <div className="spring-hover w-20 h-20 rounded-md border border-slate-800 flex items-center justify-center overflow-hidden bg-slate-950 shrink-0 mt-4 group-hover:border-blue-500/50 group-hover:shadow-[0_0_16px_-2px_rgba(96,165,250,0.4)]">
                {formData.document_logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={formData.document_logo_url} alt="Document logo preview" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-xs text-slate-400 text-center px-1">Uses App Logo</span>
                )}
              </div>
              <div className="flex-1 space-y-2 mt-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Document Logo <span className="font-normal text-slate-600">— Quotations, Invoices &amp; Inspection Reports</span></label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setDocLogoError('');
                      if (!file.type.startsWith('image/')) {
                        setDocLogoError('Please choose an image file.');
                        return;
                      }
                      if (file.size > 2 * 1024 * 1024) {
                        setDocLogoError('Logo must be under 2MB &mdash; try a smaller image.');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => setFormData((prev) => ({ ...prev, document_logo_url: String(reader.result) }));
                      reader.onerror = () => setDocLogoError('Could not read that file &mdash; try again.');
                      reader.readAsDataURL(file);
                    }}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-500 file:cursor-pointer cursor-pointer"
                  />
                  {docLogoError && <p className="text-xs text-red-400 mt-1">{docLogoError}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">or paste a Logo URL</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={formData.document_logo_url.startsWith('data:') ? '' : formData.document_logo_url}
                    onChange={(e) => setFormData({ ...formData, document_logo_url: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600"
                  />
                </div>
              </div>
            </div>

            {logosSaved && (
              <div className="bg-emerald-500/10 border border-emerald-200 text-emerald-300 text-sm px-4 py-3 rounded-md">
                Logos saved.
              </div>
            )}
            <ActionButton type="button" onClick={handleSaveLogos} disabled={savingLogos} isLoading={savingLogos} text={savingLogos ? 'Saving...' : 'Save Logos'} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-md mb-6">
          <div className="px-5 py-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-300">Company Profile</h2>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
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

            <ActionButton type="submit" disabled={loading} isLoading={loading} text={loading ? 'Saving...' : 'Save Company Profile'} />
          </form>
        </div>

        {isElectron() && (
          <div className="bg-slate-900 border border-slate-800 rounded-md mb-6">
            <div className="px-5 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-300">Local Backup Folder</h2>
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-500 mb-3">
                Every Quotation, Invoice, and Inspection Report is automatically saved as a PDF here too &mdash;
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
                  isLoading={changingFolder}
                  onClick={handleChooseFolder}
                />
              </div>
              {backupFolderSaved && (
                <p className="text-xs text-emerald-400 mt-2">Backup folder updated.</p>
              )}
            </div>
          </div>
        )}

        {/* WhatsApp Business connection */}
        <div className="bg-slate-900 border border-slate-800 rounded-md">
          <div className="group px-5 py-3 border-b border-slate-800 flex items-center gap-2">
            <span className="spring-hover flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 group-hover:scale-110 group-hover:-rotate-6">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-emerald-400" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378L.057 23.25l1.926-4.836a9.928 9.928 0 0 1-1.412-5.143C.572 7.352 5.924 2 12.427 2c3.153 0 6.11 1.229 8.333 3.458A11.684 11.684 0 0 1 24 13.835c-.003 6.497-5.354 11.851-11.949 11.951"/></svg>
            </span>
            <h2 className="text-sm font-semibold text-slate-300">WhatsApp Business</h2>
            {waStatus?.connected && (
              <span className="ml-auto flex items-center gap-1 text-xs text-emerald-400">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Connected{waStatus.displayNumber ? ` · ${waStatus.displayNumber}` : ''}
              </span>
            )}
          </div>
          <div className="p-5 space-y-4">
            {waStatus?.connected ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">
                  Number <span className="font-mono text-white">{waStatus.displayNumber || waStatus.phoneNumberId}</span> is connected. Document send buttons on Quotes, Invoices and Inspections will use this number.
                </p>
                <div className="flex gap-2">
                  <ActionButton text={waSaving ? 'Disconnecting…' : 'Disconnect'} variant="danger" showArrow={false} disabled={waSaving} isLoading={waSaving} onClick={handleDisconnectWhatsapp} />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">Connect your own WhatsApp Business number. Get the Token and Phone Number ID from the <strong className="text-slate-300">Meta Business Manager → WhatsApp → API Setup</strong> panel.</p>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Permanent Access Token</label>
                    <input
                      type="password"
                      placeholder="EAAxxxxxxxxxxxxxxx..."
                      value={waToken}
                      onChange={(e) => setWaToken(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white font-mono"
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Phone Number ID</label>
                    <input
                      type="text"
                      placeholder="1234567890123456"
                      value={waPhoneId}
                      onChange={(e) => setWaPhoneId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Display Number (optional, e.g. +971 50 123 4567)</label>
                    <input
                      type="text"
                      placeholder="+971 50 123 4567"
                      value={waDisplay}
                      onChange={(e) => setWaDisplay(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white"
                    />
                  </div>
                </div>
                <ActionButton
                  text={waSaving ? 'Saving…' : 'Connect Number'}
                  variant="primary"
                  showArrow={false}
                  disabled={waSaving || !waToken || !waPhoneId}
                  isLoading={waSaving}
                  onClick={handleSaveWhatsapp}
                />
              </div>
            )}
            {waMsg && (
              <p className={`text-xs mt-1 ${waMsg.startsWith('Error') ? 'text-red-400' : 'text-emerald-400'}`}>{waMsg}</p>
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-md">
          <div className="px-5 py-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-300">Social Integrations</h2>
          </div>
          <div className="p-5 space-y-3">
            <button
              type="button"
              onClick={() => router.push('/social-accounts')}
              className="w-full flex items-center justify-between px-4 py-3 border border-slate-800 rounded-md hover:border-blue-500/50 hover:bg-slate-800/40 transition-all text-left"
            >
              <div>
                <div className="text-sm font-medium text-white">Facebook / Instagram</div>
                <div className="text-xs text-slate-500">
                  {metaConfigured === null ? 'Checking…' : metaConfigured ? 'Ready — connect from Social Accounts' : 'Needs a Meta App ID/Secret set on the server first'}
                </div>
              </div>
              <span className={`text-xs font-medium ${metaConfigured ? 'text-emerald-400' : 'text-amber-400'}`}>
                {metaConfigured === null ? '…' : metaConfigured ? 'Connect →' : 'Setup needed'}
              </span>
            </button>
            {['TikTok', 'Google Business'].map((name) => (
              <div key={name} className="flex items-center justify-between px-4 py-3 border border-slate-800 rounded-md">
                <div>
                  <div className="text-sm font-medium text-white">{name}</div>
                  <div className="text-xs text-slate-500">Needs API credentials from {name}&apos;s developer console first</div>
                </div>
                <span className="text-xs text-slate-400">Not built yet</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
