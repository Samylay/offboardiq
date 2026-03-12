import { Brain, Users, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

const mockOrgMetrics = {
  totalDeparturesThisYear: 16,
  avgKnowledgeCaptured: 64.7,
  avgRiskReduction: 42,
  totalKnowledgeItems: 347,
  avgTimeToComplete: 18.3,
  topRiskDepartments: [
    { department: 'Engineering', departures: 6, avgRisk: 71, avgCapture: 58 },
    { department: 'Product', departures: 3, avgRisk: 55, avgCapture: 67 },
    { department: 'Customer Success', departures: 3, avgRisk: 48, avgCapture: 72 },
    { department: 'Finance', departures: 2, avgRisk: 42, avgCapture: 61 },
    { department: 'Marketing', departures: 2, avgRisk: 35, avgCapture: 78 },
  ],
  knowledgeTypeBreakdown: [
    { type: 'Procedures', count: 87, pct: 25 },
    { type: 'Technical Docs', count: 72, pct: 21 },
    { type: 'Decision Context', count: 55, pct: 16 },
    { type: 'Contacts', count: 48, pct: 14 },
    { type: 'Workarounds', count: 35, pct: 10 },
    { type: 'Unwritten Rules', count: 28, pct: 8 },
    { type: 'Escalation Paths', count: 22, pct: 6 },
  ],
  monthlyTrend: [
    { month: 'Oct', departures: 2, captured: 58 },
    { month: 'Nov', departures: 3, captured: 62 },
    { month: 'Dec', departures: 1, captured: 71 },
    { month: 'Jan', departures: 4, captured: 59 },
    { month: 'Feb', departures: 3, captured: 68 },
    { month: 'Mar', departures: 3, captured: 65 },
  ],
};

export default function Analytics() {
  const data = mockOrgMetrics;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-gray-600 mt-1">Organizational knowledge retention metrics</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Departures (YTD)', value: data.totalDeparturesThisYear, icon: Users },
          { label: 'Avg Knowledge Captured', value: `${data.avgKnowledgeCaptured}%`, icon: Brain },
          { label: 'Avg Risk Reduction', value: `${data.avgRiskReduction}%`, icon: TrendingDown },
          { label: 'Knowledge Items', value: data.totalKnowledgeItems, icon: TrendingUp },
          { label: 'Avg Days to Complete', value: data.avgTimeToComplete, icon: AlertTriangle },
        ].map((stat) => (
          <div key={stat.label} className="card">
            <stat.icon className="w-5 h-5 text-gray-400 mb-2" />
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Department Risk Table */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Risk by Department</h2>
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b">
                <th className="pb-2 font-medium">Department</th>
                <th className="pb-2 font-medium text-center">Departures</th>
                <th className="pb-2 font-medium text-center">Avg Risk</th>
                <th className="pb-2 font-medium text-center">Avg Capture</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.topRiskDepartments.map((dept) => (
                <tr key={dept.department}>
                  <td className="py-3 font-medium text-sm">{dept.department}</td>
                  <td className="py-3 text-center text-sm">{dept.departures}</td>
                  <td className="py-3 text-center">
                    <span className={`text-sm font-medium ${
                      dept.avgRisk >= 60 ? 'text-red-600' : dept.avgRisk >= 40 ? 'text-yellow-600' : 'text-green-600'
                    }`}>{dept.avgRisk}</span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${
                          dept.avgCapture >= 70 ? 'bg-green-500' : dept.avgCapture >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} style={{ width: `${dept.avgCapture}%` }} />
                      </div>
                      <span className="text-xs text-gray-600">{dept.avgCapture}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Knowledge Type Breakdown */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Knowledge by Type</h2>
          <div className="space-y-3">
            {data.knowledgeTypeBreakdown.map((type) => (
              <div key={type.type}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">{type.type}</span>
                  <span className="text-sm text-gray-500">{type.count} items ({type.pct}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="h-2 rounded-full bg-brand-500" style={{ width: `${type.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Monthly Trend</h2>
        <div className="grid grid-cols-6 gap-4">
          {data.monthlyTrend.map((month) => (
            <div key={month.month} className="text-center">
              <div className="relative h-32 flex items-end justify-center gap-1 mb-2">
                <div className="w-6 bg-brand-200 rounded-t" style={{ height: `${month.departures * 20}%` }} title={`${month.departures} departures`} />
                <div className="w-6 bg-green-400 rounded-t" style={{ height: `${month.captured}%` }} title={`${month.captured}% captured`} />
              </div>
              <p className="text-xs font-medium">{month.month}</p>
              <p className="text-xs text-gray-500">{month.departures} dep.</p>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-4 text-xs text-gray-500 justify-center">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-brand-200 rounded" /> Departures</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-400 rounded" /> Capture Rate</span>
        </div>
      </div>
    </div>
  );
}
