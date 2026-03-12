'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/utils/api';
import { BarChart3, TrendingUp, UserMinus, Brain } from 'lucide-react';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/dashboard').then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" /></div>;
  if (!data) return <div className="text-center py-20 text-gray-400">Unable to load analytics</div>;

  const { overview, charts } = data;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8 flex items-center gap-2"><BarChart3 className="h-6 w-6" /> Analytics</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Departures', value: overview.totalDepartures, icon: UserMinus, color: 'text-blue-600' },
          { label: 'Active', value: overview.activeDepartures, icon: TrendingUp, color: 'text-orange-600' },
          { label: 'Knowledge Items', value: overview.totalKnowledgeItems, icon: Brain, color: 'text-purple-600' },
          { label: 'Avg Risk Score', value: overview.avgRiskScore, icon: BarChart3, color: 'text-red-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <Icon className={`h-5 w-5 ${color} mb-2`} />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts — visual bars rendered with CSS */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Departures by Month */}
        <div className="card p-6">
          <h2 className="font-semibold mb-4">Departures by Month</h2>
          {(charts.departuresByMonth || []).length === 0 ? (
            <p className="text-gray-400 text-sm">No data yet</p>
          ) : (
            <div className="space-y-3">
              {charts.departuresByMonth.slice(0, 6).map(({ month, count }) => {
                const max = Math.max(...charts.departuresByMonth.map((d) => d.count));
                return (
                  <div key={month} className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 w-20">{month}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-6">
                      <div className="bg-brand-500 rounded-full h-6 flex items-center justify-end pr-2"
                        style={{ width: `${Math.max((count / max) * 100, 10)}%` }}>
                        <span className="text-xs text-white font-medium">{count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* By Reason */}
        <div className="card p-6">
          <h2 className="font-semibold mb-4">Departures by Reason</h2>
          {Object.keys(charts.departuresByReason || {}).length === 0 ? (
            <p className="text-gray-400 text-sm">No data yet</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(charts.departuresByReason).map(([reason, count]) => (
                <div key={reason} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{reason.replace('_', ' ')}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Risk Distribution */}
      <div className="card p-6">
        <h2 className="font-semibold mb-4">Risk Distribution</h2>
        {Object.keys(charts.riskDistribution || {}).length === 0 ? (
          <p className="text-gray-400 text-sm">No data yet</p>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {[
              { level: 'low', label: 'Low', color: 'bg-green-500' },
              { level: 'medium', label: 'Medium', color: 'bg-yellow-500' },
              { level: 'high', label: 'High', color: 'bg-orange-500' },
              { level: 'critical', label: 'Critical', color: 'bg-red-500' },
            ].map(({ level, label, color }) => (
              <div key={level} className="text-center">
                <div className={`w-full h-24 ${color} rounded-lg flex items-center justify-center mb-2 opacity-${charts.riskDistribution[level] ? '100' : '20'}`}>
                  <span className="text-2xl font-bold text-white">{charts.riskDistribution[level] || 0}</span>
                </div>
                <p className="text-sm font-medium">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
