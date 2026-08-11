'use client';

import { useEffect, useState } from 'react';
import { useSocialPosts } from '@/hooks/useSocialPosts';
import { useSocialAccounts } from '@/hooks/useSocialAccounts';
import { ActionButton } from '@/components/ui/action-button';

const PLATFORM_LABELS: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'Twitter',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
};

export default function PostsPage() {
  const { posts, loading, error, listPosts, createPost, publishPost } = useSocialPosts();
  const { accounts, listAccounts } = useSocialAccounts();
  const [formData, setFormData] = useState({
    content: '',
    platforms: [] as string[],
    scheduled_at: '',
  });

  useEffect(() => {
    listPosts();
    listAccounts();
  }, [listPosts, listAccounts]);

  const togglePlatform = (platform: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content || formData.platforms.length === 0) return;
    const created = await createPost({
      content: formData.content,
      platforms: formData.platforms,
      scheduled_at: formData.scheduled_at || null,
      status: formData.scheduled_at ? 'scheduled' : 'draft',
    });
    if (created) {
      setFormData({ content: '', platforms: [], scheduled_at: '' });
    }
  };

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-slate-800 text-slate-400',
      scheduled: 'bg-amber-500/10 text-amber-400',
      published: 'bg-emerald-500/10 text-emerald-400',
      failed: 'bg-red-500/10 text-red-400',
    };
    return colors[status] || 'bg-slate-800 text-slate-400';
  };

  return (
    <div className="p-8 bg-slate-950 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-white">Social Posts</h1>
            <p className="text-sm text-slate-500 mt-1">Create, schedule, and publish to all connected platforms</p>
          </div>
        </div>

        {accounts.length === 0 && (
          <div className="bg-amber-500/10 border border-amber-200 text-amber-400 text-sm px-4 py-3 rounded-md mb-6">
            No social accounts connected yet. Connect one in Settings to publish posts.
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-md mb-6">
          <div className="px-5 py-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-300">New Post</h2>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Content</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={4}
                placeholder="What do you want to share?"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2">Platforms</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PLATFORM_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => togglePlatform(key)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                      formData.platforms.includes(key)
                        ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                        : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Schedule (optional)</label>
              <input
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-600 mt-1">Leave blank to save as a draft you can publish manually.</p>
            </div>

            <ActionButton
              type="submit"
              disabled={loading || !formData.content || formData.platforms.length === 0}
              text={loading ? 'Saving...' : formData.scheduled_at ? 'Schedule Post' : 'Save Draft'}
            />
          </form>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-200 text-red-400 text-sm px-4 py-3 rounded-md mb-6">{error}</div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">All Posts</h2>
            <span className="text-xs text-slate-400">{posts.length} total</span>
          </div>

          {posts.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-slate-500">No posts yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-5 py-2 font-medium">Content</th>
                  <th className="px-5 py-2 font-medium">Platforms</th>
                  <th className="px-5 py-2 font-medium">Scheduled</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                  <th className="px-5 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.id} className="border-b border-slate-800 last:border-0">
                    <td className="px-5 py-3 text-white max-w-xs truncate">{p.content}</td>
                    <td className="px-5 py-3 text-slate-400">
                      {p.platforms.map((pl) => PLATFORM_LABELS[pl] || pl).join(', ')}
                    </td>
                    <td className="px-5 py-3 text-slate-400">
                      {p.scheduled_at ? new Date(p.scheduled_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(p.status)}`}>{p.status}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {(p.status === 'draft' || p.status === 'scheduled') && (
                        <ActionButton
                          text="Publish Now"
                          variant="success"
                          showArrow={false}
                          className="!px-3 !py-1 !text-xs"
                          onClick={() => publishPost(p.id)}
                        />
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
