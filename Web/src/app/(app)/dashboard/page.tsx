'use client';

import AdvancedStats from '@/components/ui/advanced-stats';

export default function DashboardPage() {
  const features = [
    {
      icon: '🚀',
      title: 'Built for Growth',
      desc: 'Multi-tenant architecture scales with your business',
      stat: '10,000+',
      statLabel: 'Concurrent users supported',
    },
    {
      icon: '🔐',
      title: 'Enterprise Security',
      desc: 'JWT authentication, RLS, and encrypted data storage',
      stat: '256-bit',
      statLabel: 'End-to-end encryption',
    },
    {
      icon: '⚡',
      title: 'High Performance',
      desc: '<200ms API responses with optimized database queries',
      stat: '<200ms',
      statLabel: 'Average response time',
    },
  ];

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(to bottom right, rgb(15, 23, 42), rgb(88, 28, 135), rgb(15, 23, 42))' }}
    >
      <div className="max-w-7xl mx-auto px-6 py-10">
        <AdvancedStats />

        <div className="mt-4">
          <h2 className="text-2xl font-bold text-white mb-10">
            Why <span className="text-blue-400">Shams Al Barakat Repair Services</span>?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="bg-slate-800/50 backdrop-filter backdrop-blur-xl border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-all"
              >
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400 mb-4">{feature.desc}</p>
                <div className="pt-4 border-t border-slate-700">
                  <div className="text-xl font-bold text-blue-400">{feature.stat}</div>
                  <div className="text-xs text-gray-500">{feature.statLabel}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
