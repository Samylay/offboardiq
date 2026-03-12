import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Clock } from 'lucide-react';
import RiskBadge from '../components/common/RiskBadge';

const mockDepartures = [
  { id: '1', employee_first_name: 'Sarah', employee_last_name: 'Chen', employee_title: 'Senior Backend Engineer', employee_department: 'Engineering', status: 'in_progress', last_working_day: '2026-03-28', overall_risk_score: 82, knowledge_capture_score: 35, departure_reason: 'voluntary' },
  { id: '2', employee_first_name: 'Marcus', employee_last_name: 'Johnson', employee_title: 'Product Manager', employee_department: 'Product', status: 'in_progress', last_working_day: '2026-04-11', overall_risk_score: 61, knowledge_capture_score: 52, departure_reason: 'voluntary' },
  { id: '3', employee_first_name: 'Priya', employee_last_name: 'Patel', employee_title: 'Customer Success Lead', employee_department: 'Customer Success', status: 'in_progress', last_working_day: '2026-04-18', overall_risk_score: 45, knowledge_capture_score: 71, departure_reason: 'voluntary' },
  { id: '4', employee_first_name: 'James', employee_last_name: 'Rivera', employee_title: 'Financial Analyst', employee_department: 'Finance', status: 'knowledge_mapping', last_working_day: '2026-05-02', overall_risk_score: 33, knowledge_capture_score: 15, departure_reason: 'contract_end' },
  { id: '5', employee_first_name: 'Lisa', employee_last_name: 'Kim', employee_title: 'DevOps Engineer', employee_department: 'Engineering', status: 'completed', last_working_day: '2026-02-14', overall_risk_score: 71, knowledge_capture_score: 89, departure_reason: 'voluntary' },
];

const statusColors = {
  initiated: 'badge-neutral',
  knowledge_mapping: 'badge-info',
  in_progress: 'badge-warning',
  review: 'badge-info',
  completed: 'badge-success',
  archived: 'badge-neutral',
};

const statusLabels = {
  initiated: 'Initiated',
  knowledge_mapping: 'Mapping',
  in_progress: 'In Progress',
  review: 'Review',
  completed: 'Completed',
  archived: 'Archived',
};

export default function DeparturesList() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = mockDepartures.filter((d) => {
    const matchesSearch = `${d.employee_first_name} ${d.employee_last_name} ${d.employee_department}`
      .toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Departures</h1>
          <p className="text-gray-600 mt-1">Manage employee offboarding cases</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Departure
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or department..."
            className="input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="initiated">Initiated</option>
          <option value="knowledge_mapping">Knowledge Mapping</option>
          <option value="in_progress">In Progress</option>
          <option value="review">Review</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Departures Grid */}
      <div className="grid gap-4">
        {filtered.map((dep) => {
          const daysLeft = Math.ceil((new Date(dep.last_working_day) - new Date()) / (1000 * 60 * 60 * 24));
          return (
            <Link key={dep.id} to={`/departures/${dep.id}`} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold">
                    {dep.employee_first_name[0]}{dep.employee_last_name[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold">{dep.employee_first_name} {dep.employee_last_name}</h3>
                    <p className="text-sm text-gray-500">{dep.employee_title} &middot; {dep.employee_department}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <span className={`badge ${statusColors[dep.status]}`}>
                    {statusLabels[dep.status]}
                  </span>

                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span className={daysLeft <= 7 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                        {daysLeft > 0 ? `${daysLeft}d left` : dep.status === 'completed' ? 'Completed' : 'Overdue'}
                      </span>
                    </div>
                  </div>

                  <RiskBadge score={dep.overall_risk_score} size="sm" />

                  <div className="w-20">
                    <div className="text-xs text-gray-500 mb-1">Captured</div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${
                          dep.knowledge_capture_score >= 70 ? 'bg-green-500' :
                          dep.knowledge_capture_score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${dep.knowledge_capture_score}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
