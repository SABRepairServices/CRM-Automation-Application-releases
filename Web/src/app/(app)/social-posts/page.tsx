'use client';

import { useEffect, useState, useRef } from 'react';
import { useSocialPosts } from '@/hooks/useSocialPosts';
import { useSocialAccounts } from '@/hooks/useSocialAccounts';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';

export default function SocialPostsPage() {
  const { posts, listPosts, createPost, publishPost, schedulePost, deletePost, loading, error } = useSocialPosts();
  const { accounts, listAccounts } = useSocialAccounts();
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    socialAccountId: '',
    content: '',
    platforms: [] as string[],
    scheduledAt: '',
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    listAccounts();
    listPosts();
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.socialAccountId) {
      alert('Select an account');
      return;
    }
    const result = await createPost({
      content: formData.content,
      platforms: formData.platforms.length > 0 ? formData.platforms : ['facebook'],
      scheduled_at: formData.scheduledAt || null,
    } as any);
    if (result) {
      setFormData({ socialAccountId: '', content: '', platforms: [], scheduledAt: '' });
      setShowForm(false);
      listPosts();
    }
  };

  const togglePlatform = (platform: string) => {
    setFormData({
      ...formData,
      platforms: formData.platforms.includes(platform)
        ? formData.platforms.filter(p => p !== platform)
        : [...formData.platforms, platform]
    });
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
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        {/* Hero Section */}
        <div className="mb-16 animate-heroScale">
          <h1 className="hero-title font-bold mb-4">
            <span className="inline-block">Social</span>
            <span className="inline-block ml-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Posts</span>
          </h1>
          <p className="hero-subtitle mb-8 font-light">
            Create, schedule, and publish your content across all social media platforms
          </p>
        </div>

        {/* Create Button */}
        <InteractiveHoverButton
          text={showForm ? '✕ Close' : '✏️ Post'}
          onClick={() => setShowForm(!showForm)}
          className="mb-12 stagger-item px-6"
          style={{ animationDelay: '0.1s' } as any}
        />

        {/* Form Container */}
        {showForm && (
          <form onSubmit={handleSubmit} className="form-glass p-10 rounded-2xl mb-12">
            <h2 className="text-3xl font-bold text-white mb-8">New Post</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">Account</label>
                <select
                  value={formData.socialAccountId}
                  onChange={(e) => setFormData({ ...formData, socialAccountId: e.target.value })}
                  className="w-full px-5 py-4 rounded-lg text-white text-lg"
                  required
                >
                  <option value="">-- Select account --</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_name} (@{acc.account_username})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your post..."
                  rows={5}
                  required
                  className="w-full px-5 py-4 rounded-lg text-white text-lg font-sans resize-none"
                />
                <div className="text-sm text-gray-400 mt-2">{formData.content.length} characters</div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wide">Platforms</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['facebook', 'instagram', 'twitter', 'tiktok'].map(platform => (
                    <label
                      key={platform}
                      className="flex items-center p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700 cursor-pointer transition-all duration-300"
                    >
                      <input
                        type="checkbox"
                        checked={formData.platforms.includes(platform)}
                        onChange={() => togglePlatform(platform)}
                        className="w-4 h-4 mr-2 accent-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-200 capitalize">{platform}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">Schedule (optional)</label>
                <input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className="w-full px-5 py-4 rounded-lg text-white text-lg"
                />
                <div className="text-sm text-gray-400 mt-2">Leave empty to save as draft</div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-premium w-full py-4 rounded-lg text-white font-semibold text-lg disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Publish Post'}
              </button>

              {error && <div className="text-red-400 text-sm font-medium bg-red-500/10 p-4 rounded-lg">{error}</div>}
            </div>
          </form>
        )}

        {/* Posts Grid */}
        {posts.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-xl text-gray-400">No posts created yet</p>
            <p className="text-sm text-gray-500 mt-2">Create your first post to get started</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {posts.map((post, i) => {
              const account = accounts.find(a => a.id === post.social_account_id);
              return (
                <div
                  key={post.id}
                  className="post-card p-6 rounded-xl"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                        {account?.account_name}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        @{account?.account_username} · <span className="text-blue-400">{account?.platform}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`status-badge status-${post.status}`}>
                        {post.status}
                      </span>
                      <button
                        onClick={() => deletePost(post.id)}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-300 font-semibold rounded-lg transition-all duration-300 will-change-transform"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-200 mb-4 whitespace-pre-wrap leading-relaxed">{post.content}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {(post.platforms || []).map(p => (
                      <span key={p} className="platform-tag px-3 py-1 rounded-full text-xs font-medium capitalize">
                        {p}
                      </span>
                    ))}
                  </div>

                  {post.scheduled_at && (
                    <div className="text-sm text-gray-400 mb-4 flex items-center gap-2">
                      <span>📅 Scheduled for {new Date(post.scheduled_at).toLocaleString()}</span>
                    </div>
                  )}

                  {post.status === 'draft' && (
                    <div className="flex gap-3 pt-4 border-t border-slate-700">
                      <button
                        onClick={() => publishPost(post.id)}
                        className="px-6 py-2 bg-green-500/20 hover:bg-green-500/40 text-green-300 font-semibold rounded-lg transition-all duration-300"
                      >
                        🚀 Publish Now
                      </button>
                      <button
                        onClick={() => {
                          const date = new Date();
                          date.setHours(date.getHours() + 1);
                          schedulePost(post.id, date.toISOString());
                        }}
                        className="px-6 py-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 font-semibold rounded-lg transition-all duration-300"
                      >
                        ⏰ Schedule +1h
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
