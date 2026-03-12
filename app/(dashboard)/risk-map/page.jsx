'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/utils/api';
import { Map, AlertTriangle, Users, Shield } from 'lucide-react';

const vulnColors = (score) =>
  score >= 70 ? 'border-red-300 bg-red-50' : score >= 40 ? 'border-yellow-300 bg-yellow-50' : 'border-green-300 bg-green-50';
const vulnText = (score) =>
  score >= 70 ? 'text-red-700' : score >= 40 ? 'text-yellow-700' : 'text-green-700';

export default function RiskMapPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/flight-risk/recommendations')
      .then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" /></div>;
  if (!data) return <div className="text-center py-20 text-gray-400">Unable to load risk map</div>;

  const map = data.concentrationMap;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Map className="h-6 w-6" /> Knowledge Risk Map</h1>
          <p className="text-gray-500">Proactive knowledge concentration analysis across your organization</p>
        </div>
        <div className="card px-6 py-3 text-center">
          <p className="text-3xl font-bold">{map?.overallVulnerability || 0}</p>
          <p className="text-xs text-gray-500">Org Vulnerability Score</p>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-5 flex items-center gap-4">
          <Users className="h-8 w-8 text-brand-600" />
          <div><p className="text-2xl font-bold">{map?.totalEmployees || 0}</p><p className="text-sm text-gray-500">Total Employees</p></div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <Shield className="h-8 w-8 text-brand-600" />
          <div><p className="text-2xl font-bold">{map?.totalDepartments || 0}</p><p className="text-sm text-gray-500">Departments</p></div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <div><p className="text-2xl font-bold">{map?.criticalSPOFs?.length || 0}</p><p className="text-sm text-gray-500">Single Points of Failure</p></div>
        </div>
      </div>

      {/* Department Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {(map?.departments || []).map((dept) => (
          <div key={dept.department} className={`card p-5 border-2 ${vulnColors(dept.vulnerabilityScore)}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{dept.department}</h3>
              <span className={`text-2xl font-bold ${vulnText(dept.vulnerabilityScore)}`}>{dept.vulnerabilityScore}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center text-sm mb-3">
              <div><p className="font-medium">{dept.teamSize}</p><p className="text-xs text-gray-500">Team Size</p></div>
              <div><p className="font-medium">{dept.uniqueRoles}</p><p className="text-xs text-gray-500">Unique Roles</p></div>
              <div><p className="font-medium">{dept.busFactor}</p><p className="text-xs text-gray-500">Bus Factor</p></div>
            </div>
            {dept.singlePointsOfFailure.length > 0 && (
              <div className="border-t pt-3 mt-1">
                <p className="text-xs font-medium text-gray-500 mb-2">At-Risk Employees:</p>
                {dept.singlePointsOfFailure.map((spof) => (
                  <div key={spof.id} className="flex items-center justify-between text-sm py-1">
                    <span>{spof.name}</span>
                    <span className="text-xs text-gray-500">{spof.title}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-3 italic">{dept.recommendation}</p>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {data.recommendations?.length > 0 && (
        <div className="card">
          <div className="px-6 py-4 border-b"><h2 className="font-semibold">Proactive Recommendations</h2></div>
          <div className="divide-y">
            {data.recommendations.map((rec, i) => (
              <div key={i} className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className={`badge ${rec.priority === 'critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{rec.priority}</span>
                  <p className="font-medium">{rec.title}</p>
                </div>
                <p className="text-sm text-gray-500 mt-1">{rec.description}</p>
                <p className="text-xs text-gray-400 mt-1">Estimated effort: {rec.estimatedEffort}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
