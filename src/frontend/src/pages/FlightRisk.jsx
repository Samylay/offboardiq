import { Shield, AlertTriangle, Users, ArrowRight, Lightbulb } from 'lucide-react';

const mockConcentrationData = {
  overallVulnerability: 62,
  totalEmployees: 47,
  departments: [
    { department: 'Engineering', teamSize: 14, uniqueRoles: 9, busFactor: 0.64, vulnerabilityScore: 72, singlePointsOfFailure: [
      { name: 'David Park', title: 'Infrastructure Lead', risk: 'Single holder of this role' },
      { name: 'Ana Rodriguez', title: 'Security Engineer', risk: 'Single holder of this role' },
    ]},
    { department: 'Product', teamSize: 5, uniqueRoles: 4, busFactor: 0.80, vulnerabilityScore: 78, singlePointsOfFailure: [
      { name: 'Tom Walsh', title: 'Product Analytics Lead', risk: 'Single holder of this role' },
      { name: 'Mei Lin', title: 'UX Researcher', risk: 'Single holder of this role' },
    ]},
    { department: 'Finance', teamSize: 3, uniqueRoles: 3, busFactor: 1.00, vulnerabilityScore: 90, singlePointsOfFailure: [
      { name: 'Rachel Kim', title: 'Controller', risk: 'Single holder of this role' },
      { name: 'James Rivera', title: 'Financial Analyst', risk: 'Single holder of this role' },
    ]},
    { department: 'Customer Success', teamSize: 8, uniqueRoles: 4, busFactor: 0.50, vulnerabilityScore: 30, singlePointsOfFailure: []},
    { department: 'Marketing', teamSize: 6, uniqueRoles: 5, busFactor: 0.83, vulnerabilityScore: 68, singlePointsOfFailure: [
      { name: 'Alex Kim', title: 'Brand Designer', risk: 'Single holder of this role' },
    ]},
  ],
  recommendations: [
    { type: 'department_initiative', priority: 'critical', target: 'Finance', title: 'Knowledge resilience program for Finance', description: 'Finance has a vulnerability score of 90/100. Every team member is a single point of failure. Implement immediate cross-training.', estimatedEffort: '1-2 weeks' },
    { type: 'proactive_capture', priority: 'high', target: 'David Park', title: 'Proactive knowledge capture for David Park', description: 'David Park (Infrastructure Lead) is the sole holder of their role. Schedule a knowledge mapping session to document critical infrastructure knowledge.', estimatedEffort: '2-4 hours' },
    { type: 'proactive_capture', priority: 'high', target: 'Ana Rodriguez', title: 'Proactive knowledge capture for Ana Rodriguez', description: 'Ana Rodriguez (Security Engineer) is the sole security specialist. Document security processes, vendor relationships, and incident response procedures.', estimatedEffort: '2-4 hours' },
    { type: 'cross_training', priority: 'medium', target: 'Product', title: 'Cross-training program for Product', description: 'Small team (5 members) with 4 unique roles. Implement buddy system and cross-training schedule.', estimatedEffort: 'Ongoing (1 hour/week)' },
  ],
};

export default function FlightRisk() {
  const data = mockConcentrationData;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-7 h-7 text-brand-600" />
          Knowledge Risk Map
        </h1>
        <p className="text-gray-600 mt-1">
          Proactive knowledge concentration analysis — find single points of failure before anyone resigns.
        </p>
      </div>

      {/* Overall Score */}
      <div className="card mb-8 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Organization Vulnerability Index</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-5xl font-bold">{data.overallVulnerability}</span>
              <span className="text-gray-400">/100</span>
            </div>
            <p className="text-gray-400 text-sm mt-2">
              {data.overallVulnerability >= 60 ? 'Elevated risk — multiple departments have critical single points of failure' :
               data.overallVulnerability >= 40 ? 'Moderate risk — some knowledge concentration detected' :
               'Healthy — knowledge is well-distributed across the organization'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">{data.totalEmployees} employees analyzed</p>
            <p className="text-gray-400 text-sm">{data.departments.length} departments</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Department cards */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Department Risk Breakdown</h2>
          {data.departments
            .sort((a, b) => b.vulnerabilityScore - a.vulnerabilityScore)
            .map((dept) => (
            <div key={dept.department} className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{dept.department}</h3>
                <div className={`badge ${
                  dept.vulnerabilityScore >= 70 ? 'badge-danger' :
                  dept.vulnerabilityScore >= 40 ? 'badge-warning' : 'badge-success'
                }`}>
                  Score: {dept.vulnerabilityScore}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                <div>
                  <span className="text-gray-500">Team size</span>
                  <p className="font-medium">{dept.teamSize}</p>
                </div>
                <div>
                  <span className="text-gray-500">Unique roles</span>
                  <p className="font-medium">{dept.uniqueRoles}</p>
                </div>
                <div>
                  <span className="text-gray-500">Bus factor</span>
                  <p className={`font-medium ${dept.busFactor >= 0.8 ? 'text-red-600' : dept.busFactor >= 0.5 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {dept.busFactor.toFixed(2)}
                  </p>
                </div>
              </div>

              {dept.singlePointsOfFailure.length > 0 && (
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-red-800 mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Single Points of Failure
                  </p>
                  {dept.singlePointsOfFailure.map((spof, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-1">
                      <span className="font-medium text-red-900">{spof.name}</span>
                      <span className="text-red-600 text-xs">{spof.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Recommendations */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Recommendations
          </h2>
          <div className="space-y-3">
            {data.recommendations.map((rec, i) => (
              <div key={i} className={`card border-l-4 ${
                rec.priority === 'critical' ? 'border-l-red-500' :
                rec.priority === 'high' ? 'border-l-orange-500' : 'border-l-yellow-500'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`badge ${
                    rec.priority === 'critical' ? 'badge-danger' :
                    rec.priority === 'high' ? 'badge-warning' : 'badge-info'
                  }`}>{rec.priority}</span>
                </div>
                <h4 className="font-medium text-sm mb-1">{rec.title}</h4>
                <p className="text-xs text-gray-600 mb-2">{rec.description}</p>
                <p className="text-xs text-gray-500">Effort: {rec.estimatedEffort}</p>
                <button className="text-xs text-brand-600 font-medium mt-2 flex items-center gap-1 hover:underline">
                  Take action <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
