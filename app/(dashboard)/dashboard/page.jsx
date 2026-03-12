'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/utils/api';
import RiskBadge from '@/components/common/RiskBadge';
import { UserMinus, Brain, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [departures, setDepartures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/dashboard'),
      api.get('/departures?limit=5'),
    ]).then(([statsData, deptData]) => {
      setStats(statsData.overview);
      setDepartures(deptData.departures || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" /></div>;

  const statCards = [
    { label: 'Active Departures', value: stats?.activeDepartures || 0, icon: UserMinus, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Knowledge Items', value: stats?.totalKnowledgeItems || 0, icon: Brain, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Avg Risk Score', value: stats?.avgRiskScore || 0, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100' },
    { label: 'Verified Items', value: `${stats?.verificationRate || 0}%`, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link href="/departures" className="btn-primary text-sm">
          New Departure <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${bg} rounded-lg flex items-center justify-center`}>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold">Upcoming Departures</h2>
          <Link href="/departures" className="text-sm text-brand-600 hover:text-brand-700">View all</Link>
        </div>
        {departures.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <UserMinus className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No active departures</p>
            <Link href="/departures" className="text-brand-600 text-sm mt-2 inline-block">Create your first departure</Link>
          </div>
        ) : (
          <div className="divide-y">
            {departures.map((d) => (
              <Link key={d.id} href={`/departures/${d.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="font-medium">{d.employee_name}</p>
                  <p className="text-sm text-gray-500">{d.title} &middot; {d.department}</p>
                </div>
                <div className="flex items-center gap-4">
                  {d.overall_risk_score != null && <RiskBadge score={d.overall_risk_score} size="sm" />}
                  <span className="text-sm text-gray-400">
                    {new Date(d.last_working_day).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
