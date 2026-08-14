'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSocialAccounts } from '@/hooks/useSocialAccounts';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';

// useSearchParams() requires a Suspense boundary above it in the App
// Router (a page that reads it can't be fully static) — without this,
// `next build` fails outright instead of just warning.
export default function SocialAccountsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <SocialAccountsContent />
    </Suspense>
  );
}

function SocialAccountsContent() {
  const { accounts, listAccounts, createAccount, deleteAccount, connectFacebook, loading, error } = useSocialAccounts();
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const connected = searchParams.get('connected');
  const connectError = searchParams.get('connect_error');
  const [formData, setFormData] = useState<{
    platform: 'facebook' | 'instagram' | 'twitter' | 'tiktok' | 'linkedin' | 'youtube';
    accountName: string;
    accountUsername: string;
    accessToken: string;
  }>({
    platform: 'facebook',
    accountName: '',
    accountUsername: '',
    accessToken: '',
  });

  useEffect(() => {
    // Simulate premium preloader
    const timer = setTimeout(() => setIsLoading(false), 800);
    listAccounts();
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!connected && !connectError) return;
    const t = setTimeout(() => router.replace('/social-accounts'), 6000);
    return () => clearTimeout(t);
  }, [connected, connectError, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createAccount(formData);
    if (result) {
      setFormData({ platform: 'facebook', accountName: '', accountUsername: '', accessToken: '' });
      setShowForm(false);
      listAccounts();
    }
  };

  return (
    <div className="min-h-screen overflow-hidden relative" ref={containerRef} style={{ background: 'linear-gradient(to bottom right, rgb(15, 23, 42), rgb(88, 28, 135), rgb(15, 23, 42))' }}>

      {/* Premium Preloader */}
      {isLoading && (
        <div className="preloader fixed inset-0 bg-slate-900 flex items-center justify-center z-50">
          <div className="w-12 h-12 border-2 border-blue-500 border-t-purple-500 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Gradient Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        {/* Hero Section */}
        <div className="mb-16 animate-heroScale">
          <h1 className="hero-title font-bold mb-4">
            <span className="inline-block">Social</span>
            <span className="inline-block ml-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Accounts</span>
          </h1>
          <p className="hero-subtitle mb-8 font-light">
            Connect and orchestrate your social media presence across all platforms
          </p>
        </div>

        {connected && (
          <div className="mb-8 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm px-5 py-3 rounded-lg">
            Connected {connected} — you can publish real posts from it now.
          </div>
        )}
        {connectError && (
          <div className="mb-8 bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-5 py-3 rounded-lg">
            Connection failed: {connectError}
          </div>
        )}
        {error && !showForm && (
          <div className="mb-8 bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-5 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Connect buttons */}
        <div className="flex flex-wrap gap-3 mb-12 stagger-item" style={{ animationDelay: '0.1s' } as any}>
          <button
            onClick={connectFacebook}
            className="btn-premium px-6 py-3 rounded-lg text-white font-semibold flex items-center gap-2"
          >
            Connect with Facebook
          </button>
          <InteractiveHoverButton
            text={showForm ? '✕ Close' : 'Paste a token manually'}
            onClick={() => setShowForm(!showForm)}
            className="px-6"
          />
        </div>

        {/* Form Container */}
        {showForm && (
          <form onSubmit={handleSubmit} className="form-glass p-10 rounded-2xl mb-12">
            <h2 className="text-3xl font-bold text-white mb-8">Connect New Account</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">Platform</label>
                <select
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value as typeof formData.platform })}
                  className="w-full px-5 py-4 rounded-lg text-white text-lg"
                >
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="twitter">Twitter/X</option>
                  <option value="tiktok">TikTok</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="youtube">YouTube</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">Account Name</label>
                <input
                  type="text"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  placeholder="e.g., Main Business Account"
                  required
                  className="w-full px-5 py-4 rounded-lg text-white text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">Username</label>
                <input
                  type="text"
                  value={formData.accountUsername}
                  onChange={(e) => setFormData({ ...formData, accountUsername: e.target.value })}
                  placeholder="e.g., @mycompany"
                  required
                  className="w-full px-5 py-4 rounded-lg text-white text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">API Token</label>
                <input
                  type="password"
                  value={formData.accessToken}
                  onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                  placeholder="Paste your API token"
                  required
                  className="w-full px-5 py-4 rounded-lg text-white text-lg font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-premium w-full py-4 rounded-lg text-white font-semibold text-lg disabled:opacity-50"
              >
                {loading ? 'Connecting...' : 'Confirm Connection'}
              </button>

              {error && <div className="text-red-400 text-sm font-medium bg-red-500/10 p-4 rounded-lg">{error}</div>}
            </div>
          </form>
        )}

        {/* Accounts Grid */}
        {accounts.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-xl text-gray-400">No accounts connected yet</p>
            <p className="text-sm text-gray-500 mt-2">Add your first social media account to get started</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {accounts.map((account, i) => (
              <div
                key={account.id}
                className="account-card p-6 rounded-xl flex justify-between items-center group"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div>
                  <div className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">{account.account_name}</div>
                  <div className="text-gray-400 text-sm mt-1">
                    @{account.account_username} · <span className="text-blue-400">{account.platform}</span>
                  </div>
                  <div className="text-gray-500 text-xs mt-2">Connected {new Date(account.created_at).toLocaleDateString()}</div>
                </div>
                <button
                  onClick={() => confirm(`Disconnect ${account.account_name}? This cannot be undone.`) && deleteAccount(account.id)}
                  className="px-6 py-3 bg-red-500/20 hover:bg-red-500/40 text-red-300 font-semibold rounded-lg transition-all duration-300 opacity-0 group-hover:opacity-100 will-change-transform"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
