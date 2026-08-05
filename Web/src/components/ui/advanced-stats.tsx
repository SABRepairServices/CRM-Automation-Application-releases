'use client'

import React from 'react'
import { cn } from '@/lib/utils'

const kpis = [
  { label: 'Total Customers', value: '0', change: '+0%', status: 'up' },
  { label: 'Active Jobs', value: '0', change: '+0%', status: 'up' },
  { label: 'Revenue', value: '$0', change: '+0%', status: 'up' },
  { label: 'Conversion', value: '0%', change: '+0%', status: 'up' },
]

export default function AdvancedStats() {
  return (
    <section className="flex flex-col gap-8 py-12 min-h-screen justify-center px-6 font-sans">
      <div className="max-w-6xl mx-auto w-full">
        {/* Main Title */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-2">
            Your Business <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Analytics</span>
          </h2>
          <p className="text-gray-400">Real-time insights into your repair business</p>
        </div>

        {/* Primary Metric */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Main Chart Area */}
          <div className="lg:col-span-2 p-8 rounded-2xl bg-slate-800/50 backdrop-filter backdrop-blur-xl border border-blue-500/20 hover:border-blue-500/50 transition-all">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">
                Monthly Performance
              </p>
              <h3 className="text-2xl font-bold text-white">
                Business Growth
              </h3>
            </div>

            {/* Chart Placeholder */}
            <div className="h-64 rounded-lg bg-gradient-to-b from-blue-600/10 to-purple-600/10 border border-blue-500/20 flex items-end justify-around p-4">
              {[65, 45, 78, 52, 88, 72, 91].map((height, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg mx-1 opacity-80 hover:opacity-100 transition-opacity"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>

            <div className="mt-4 text-xs text-gray-500">
              7-day rolling average
            </div>
          </div>

          {/* Primary Goal */}
          <div className="p-6 rounded-2xl h-fit bg-gradient-to-br from-slate-800 to-slate-900 text-white flex flex-col justify-between shadow-lg border border-blue-500/20">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-3">
                Primary Goal
              </p>
              <h4 className="text-xl font-bold tracking-tight">
                Revenue Growth
              </h4>
            </div>
            <div className="mt-8">
              <div className="flex justify-between items-end mb-3">
                <span className="text-3xl font-semibold tracking-tighter">
                  82%
                </span>
                <span className="text-xs font-medium text-gray-400 mb-1">
                  Target: 90%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 w-[82%] rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((kpi, index) => (
            <div
              key={kpi.label}
              className={cn(
                'p-6 rounded-xl border bg-slate-800/50 backdrop-filter backdrop-blur-xl transition-all hover:border-blue-500/50',
                kpi.status === 'up'
                  ? 'border-emerald-500/20 hover:bg-emerald-950/30'
                  : 'border-blue-500/20 hover:bg-slate-700/30'
              )}
              style={{
                animation: `slideUp 0.6s ease-out backwards`,
                animationDelay: `${index * 0.1}s`,
              }}
            >
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                {kpi.label}
              </p>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-black text-white tracking-tighter">
                  {kpi.value}
                </p>
                <span
                  className={cn(
                    'text-xs font-bold px-2 py-1 rounded',
                    kpi.status === 'up'
                      ? 'text-emerald-400 bg-emerald-500/20'
                      : 'text-blue-400 bg-blue-500/20'
                  )}
                >
                  {kpi.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  )
}
