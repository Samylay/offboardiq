'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { api } from '@/lib/utils/api';
import RiskBadge from '@/components/common/RiskBadge';
import ProgressRing from '@/components/common/ProgressRing';
import { Brain, MessageSquare, ListTodo, AlertTriangle, Plus, RefreshCw, CheckCircle } from 'lucide-react';

export default function DepartureDetailPage({ params }) {
  const { id } = use(params);
  const [departure, setDeparture] = useState(null);
  const [coverage, setCoverage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assessing, setAssessing] = useState(false);

  useEffect(() => { loadData(); }, [id]);

  const loadData = () => {
    Promise.all([
      api.get(`/departures/${id}`),
      api.get(`/knowledge/coverage/${id}`).catch(() => null),
    ]).then(([dept, cov]) => { setDeparture(dept); setCoverage(cov); })
      .catch(console.error).finally(() => setLoading(false));
  };

  const runRiskAssessment = async () => {
    setAssessing(true);
    try {
      await api.post(`/departures/${id}/risk-assessment`);
      loadData();
    } catch (err) { console.error(err); }
    finally { setAssessing(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" /></div>;
  if (!departure) return <div className="text-center py-20 text-gray-400">Departure not found</div>;

  const daysLeft = Math.max(0, Math.ceil((new Date(departure.last_working_day) - new Date()) / (1000 * 60 * 60 * 24)));

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{departure.employee_name}</h1>
          <p className="text-gray-500">{departure.title} &middot; {departure.department}</p>
        </div>
        <div className="flex items-center gap-4">
          {departure.overall_risk_score != null && <RiskBadge score={departure.overall_risk_score} />}
          <div className="text-right">
            <p className="text-2xl font-bold text-orange-600">{daysLeft}</p>
            <p className="text-xs text-gray-500">days remaining</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href={`/interviews/${id}?new=true`} className="card p-5 hover:border-brand-300 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium group-hover:text-brand-600">Start Interview</p>
              <p className="text-sm text-gray-500">{departure.interviews?.length || 0} sessions completed</p>
            </div>
          </div>
        </Link>
        <button onClick={runRiskAssessment} disabled={assessing} className="card p-5 hover:border-brand-300 transition-colors group text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              {assessing ? <RefreshCw className="h-5 w-5 text-orange-600 animate-spin" /> : <AlertTriangle className="h-5 w-5 text-orange-600" />}
            </div>
            <div>
              <p className="font-medium group-hover:text-brand-600">{assessing ? 'Assessing...' : 'Run Risk Assessment'}</p>
              <p className="text-sm text-gray-500">Multi-factor analysis</p>
            </div>
          </div>
        </button>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <ProgressRing progress={coverage?.coverageScore || 0} size={48} strokeWidth={4} />
            <div>
              <p className="font-medium">Knowledge Coverage</p>
              <p className="text-sm text-gray-500">{coverage?.totalItems || 0} items captured</p>
            </div>
          </div>
        </div>
      </div>

      {/* Knowledge Domains */}
      <div className="card mb-6">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2"><Brain className="h-5 w-5" /> Knowledge Domains</h2>
        </div>
        {(departure.domains || []).length === 0 ? (
          <div className="p-8 text-center text-gray-400">No knowledge domains mapped yet. Start an interview to begin capturing knowledge.</div>
        ) : (
          <div className="divide-y">
            {departure.domains.map((d) => (
              <div key={d.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{d.name}</p>
                  <p className="text-sm text-gray-500">{d.category} &middot; Criticality: {d.criticality}/10</p>
                </div>
                <div className="flex items-center gap-4">
                  <ProgressRing progress={d.capture_completeness} size={40} strokeWidth={3} />
                  <span className={`badge ${d.status === 'verified' ? 'bg-green-100 text-green-800' : d.status === 'captured' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                    {d.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Risk Assessment */}
      {departure.riskAssessment && (
        <div className="card mb-6">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Risk Assessment</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              {Object.entries(departure.riskAssessment.factors || {}).map(([key, value]) => (
                <div key={key} className="text-center">
                  <ProgressRing progress={value} size={64} strokeWidth={5} color={value >= 70 ? '#ef4444' : value >= 40 ? '#f59e0b' : '#22c55e'} />
                  <p className="text-xs text-gray-500 mt-2">{key.replace(/_/g, ' ')}</p>
                </div>
              ))}
            </div>
            {departure.riskAssessment.recommendations?.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Recommendations:</p>
                {departure.riskAssessment.recommendations.map((r, i) => (
                  <div key={i} className={`text-sm px-4 py-2 rounded-lg ${r.priority === 'critical' ? 'bg-red-50 text-red-800' : 'bg-yellow-50 text-yellow-800'}`}>
                    <span className="font-medium">{r.priority}:</span> {r.action}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transfer Plans */}
      {(departure.transferPlans || []).length > 0 && (
        <div className="card">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold flex items-center gap-2"><ListTodo className="h-5 w-5" /> Transfer Plans</h2>
          </div>
          <div className="divide-y">
            {departure.transferPlans.map((plan) => (
              <div key={plan.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{plan.title || 'Transfer Plan'}</p>
                  <span className={`badge ${plan.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{plan.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
