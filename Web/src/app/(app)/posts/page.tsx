'use client';

export default function PostsPage() {
  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">Social Posts</h1>
        <p className="text-slate-400 mb-8">Create, schedule, and publish to all platforms</p>

        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-500 mb-8">
          + New Post
        </button>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-lg text-center">
          <div className="text-6xl mb-4">📱</div>
          <p className="text-slate-400">No posts yet.</p>
        </div>
      </div>
    </div>
  );
}
