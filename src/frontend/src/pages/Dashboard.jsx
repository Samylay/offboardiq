import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Brain, AlertTriangle, CheckCircle, Clock, ArrowRight, TrendingUp } from 'lucide-react';
import RiskBadge from '../components/common/RiskBadge';
import ProgressRing from '../components/common/ProgressRing';

// Mock data for demonstration — in production this comes from the API
const mockData = {
  summary: {
    activeDepartures: 4,
    completedDepartures: 12,
    totalKnowledgeItems: 347,
    avgRiskScore: 58.3,
    avgCaptureScore: 64.7,
  },
  upcomingDeadlines: [
    { id: '1', first_name: 'Sarah', last_name: 'Chen', department: 'Engineering', last_working_day: '2026-03-28', overall_risk_score: 82, knowledge_capture_score: 35 },
    { id: '2', first_name: 'Marcus', last_name: 'Johnson', department: 'Product', last_working_day: '2026-04-11', overall_risk_score: 61, knowledge_capture_score: 52 },
    { id: '3', first_name: 'Priya', last_name: 'Patel', department: 'Customer Success', last_working_day: '2026-04-18', overall_risk_score: 45, knowledge_capture_score: 71 },
    { id: '4', first_name: 'James', last_name: 'Rivera', department: 'Finance', last_working_day: '2026-05-02', overall_risk_score: 33, knowledge_capture_score: 15 },
  ],
};

export default function Dashboard() {
  const data = mockData; // Replace with API call

  const stats = [
    { label: 'Active Departures', value: data.summary.activeDepartures, icon: Users, color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: 'Knowledge Items', value: data.summary.totalKnowledgeItems, icon: Brain, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Avg Risk Score', value: data.summary.avgRiskScore.toFixed(1), icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Avg Capture', value: `${data.summary.avgCaptureScore.toFixed(0)}%`, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-1">Knowledge risk overview for your organization</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Active Departures */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Active Departures</h2>
          <Link to="/departures" className="text-sm text-brand-600 font-medium hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="pb-3 font-medium">Employee</th>
                <th className="pb-3 font-medium">Department</th>
                <th className="pb-3 font-medium">Last Day</th>
                <th className="pb-3 font-medium">Risk</th>
                <th className="pb-3 font-medium">Knowledge Captured</th>
                <th className="pb-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.upcomingDeadlines.map((dep) => {
                const daysLeft = Math.ceil((new Date(dep.last_working_day) - new Date()) / (1000 * 60 * 60 * 24));
                return (
                  <tr key={dep.id} className="hover:bg-gray-50">
                    <td className="py-4">
                      <div className="font-medium">{dep.first_name} {dep.last_name}</div>
                    </td>
                    <td className="py-4 text-gray-600">{dep.department}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className={daysLeft <= 7 ? 'text-red-600 font-medium' : ''}>
                          {daysLeft} days
                        </span>
                      </div>
                    </td>
                    <td className="py-4">
                      <RiskBadge score={dep.overall_risk_score} size="sm" />
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              dep.knowledge_capture_score >= 70 ? 'bg-green-500' :
                              dep.knowledge_capture_score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${dep.knowledge_capture_score}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{dep.knowledge_capture_score}%</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <Link to={`/departures/${dep.id}`} className="text-brand-600 hover:underline text-sm font-medium">
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alerts */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Alerts & Recommendations</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800">Critical: Sarah Chen's offboarding is only 35% complete with 16 days remaining</p>
              <p className="text-sm text-red-600 mt-1">3 critical knowledge domains have no successor assigned. Schedule a deep-dive session immediately.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
            <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-yellow-800">Marcus Johnson has 2 overdue transfer tasks</p>
              <p className="text-sm text-yellow-600 mt-1">Documentation review for "Payment Gateway Integration" was due 3 days ago.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-800">Priya Patel's knowledge capture reached 71%</p>
              <p className="text-sm text-green-600 mt-1">On track for successful handoff. One remaining deep-dive session scheduled for next week.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
