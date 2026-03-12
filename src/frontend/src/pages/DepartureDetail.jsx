import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Brain, Shield, ClipboardList, MessageSquare, Users, Clock,
  AlertTriangle, CheckCircle, ChevronRight, Plus, ArrowLeft,
} from 'lucide-react';
import RiskBadge from '../components/common/RiskBadge';
import ProgressRing from '../components/common/ProgressRing';

// Mock detailed departure data
const mockDeparture = {
  id: '1',
  employee: { name: 'Sarah Chen', title: 'Senior Backend Engineer', department: 'Engineering', email: 'sarah.chen@company.com' },
  manager: { name: 'Alex Thompson' },
  hrOwner: { name: 'Jordan Lee' },
  status: 'in_progress',
  resignationDate: '2026-03-01',
  lastWorkingDay: '2026-03-28',
  departureReason: 'voluntary',
  overallRiskScore: 82,
  knowledgeCaptureScore: 35,
  domains: [
    { id: 'd1', name: 'Payment Gateway Integration', category: 'technical', criticality: 9, replaceability: 3, status: 'in_progress', captureCompleteness: 25, successor: 'Mike Santos' },
    { id: 'd2', name: 'CI/CD Pipeline Architecture', category: 'technical', criticality: 8, replaceability: 5, status: 'identified', captureCompleteness: 10, successor: null },
    { id: 'd3', name: 'Stripe Vendor Relationship', category: 'relationship', criticality: 7, replaceability: 2, status: 'in_progress', captureCompleteness: 40, successor: 'Mike Santos' },
    { id: 'd4', name: 'Incident Response Procedures', category: 'process', criticality: 8, replaceability: 4, status: 'identified', captureCompleteness: 0, successor: null },
    { id: 'd5', name: 'Legacy Billing System Workarounds', category: 'tribal', criticality: 9, replaceability: 1, status: 'identified', captureCompleteness: 5, successor: null },
    { id: 'd6', name: 'Database Migration Patterns', category: 'technical', criticality: 6, replaceability: 6, status: 'captured', captureCompleteness: 75, successor: 'Emma Wilson' },
  ],
  interviews: [
    { id: 'i1', type: 'initial_mapping', status: 'completed', date: '2026-03-05', itemsCaptured: 14 },
    { id: 'i2', type: 'deep_dive', status: 'completed', date: '2026-03-10', itemsCaptured: 23 },
    { id: 'i3', type: 'deep_dive', status: 'scheduled', date: '2026-03-18', itemsCaptured: 0 },
  ],
  tasks: [
    { id: 't1', title: 'Document Payment Gateway Integration', type: 'document_review', status: 'in_progress', priority: 'critical', dueDate: '2026-03-20', assignee: 'Mike Santos' },
    { id: 't2', title: 'Shadow session: CI/CD Pipeline', type: 'shadow_session', status: 'pending', priority: 'high', dueDate: '2026-03-18', assignee: null },
    { id: 't3', title: 'Stripe relationship introduction', type: 'walkthrough', status: 'pending', priority: 'high', dueDate: '2026-03-22', assignee: 'Mike Santos' },
    { id: 't4', title: 'Formal handoff: Legacy Billing Workarounds', type: 'handoff_meeting', status: 'pending', priority: 'critical', dueDate: '2026-03-25', assignee: null },
    { id: 't5', title: 'Document Database Migration Patterns', type: 'document_review', status: 'completed', priority: 'medium', dueDate: '2026-03-12', assignee: 'Emma Wilson' },
  ],
  riskAssessment: {
    knowledgeConcentration: 85,
    projectImpact: 78,
    relationshipDependency: 65,
    timelinePressure: 72,
    replacementDifficulty: 80,
  },
};

const categoryColors = {
  technical: 'bg-blue-100 text-blue-800',
  process: 'bg-purple-100 text-purple-800',
  relationship: 'bg-green-100 text-green-800',
  institutional: 'bg-orange-100 text-orange-800',
  tribal: 'bg-red-100 text-red-800',
};

const tabs = [
  { id: 'overview', label: 'Overview', icon: Shield },
  { id: 'knowledge', label: 'Knowledge Map', icon: Brain },
  { id: 'tasks', label: 'Transfer Plan', icon: ClipboardList },
  { id: 'interviews', label: 'Interviews', icon: MessageSquare },
];

export default function DepartureDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const dep = mockDeparture;

  const daysLeft = Math.ceil((new Date(dep.lastWorkingDay) - new Date()) / (1000 * 60 * 60 * 24));
  const totalDays = Math.ceil((new Date(dep.lastWorkingDay) - new Date(dep.resignationDate)) / (1000 * 60 * 60 * 24));
  const daysPassed = totalDays - daysLeft;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link to="/departures" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to departures
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xl font-bold">
              SC
            </div>
            <div>
              <h1 className="text-2xl font-bold">{dep.employee.name}</h1>
              <p className="text-gray-600">{dep.employee.title} &middot; {dep.employee.department}</p>
              <div className="flex items-center gap-4 mt-2">
                <RiskBadge score={dep.overallRiskScore} />
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  {daysLeft > 0 ? `${daysLeft} days remaining` : 'Departure date passed'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="btn-secondary">Edit</button>
            <button className="btn-primary flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Start Interview
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Risk Breakdown */}
          <div className="lg:col-span-2 card">
            <h2 className="text-lg font-semibold mb-4">Risk Assessment</h2>
            <div className="space-y-4">
              {[
                { label: 'Knowledge Concentration', value: dep.riskAssessment.knowledgeConcentration, desc: 'How siloed is this person\'s knowledge' },
                { label: 'Project Impact', value: dep.riskAssessment.projectImpact, desc: 'Active projects and systems affected' },
                { label: 'Relationship Dependency', value: dep.riskAssessment.relationshipDependency, desc: 'Key vendor/client relationships at risk' },
                { label: 'Timeline Pressure', value: dep.riskAssessment.timelinePressure, desc: 'How compressed the offboarding window is' },
                { label: 'Replacement Difficulty', value: dep.riskAssessment.replacementDifficulty, desc: 'How hard it is to hire a replacement' },
              ].map(({ label, value, desc }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{label}</span>
                    <span className={`text-sm font-bold ${
                      value >= 75 ? 'text-red-600' : value >= 50 ? 'text-orange-600' : value >= 25 ? 'text-yellow-600' : 'text-green-600'
                    }`}>{value}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${
                      value >= 75 ? 'bg-red-500' : value >= 50 ? 'bg-orange-500' : value >= 25 ? 'bg-yellow-500' : 'bg-green-500'
                    }`} style={{ width: `${value}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-6">
            <div className="card text-center">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Knowledge Captured</h3>
              <ProgressRing
                value={dep.knowledgeCaptureScore}
                size={100}
                color={dep.knowledgeCaptureScore >= 70 ? '#40c057' : dep.knowledgeCaptureScore >= 40 ? '#fab005' : '#fa5252'}
              />
              <p className="text-sm text-gray-600 mt-3">
                {dep.knowledgeCaptureScore < 50 ? 'Critical gap — schedule more sessions' : 'On track'}
              </p>
            </div>

            <div className="card">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Timeline</h3>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div className="h-2 rounded-full bg-brand-600" style={{ width: `${(daysPassed / totalDays) * 100}%` }} />
              </div>
              <p className="text-xs text-gray-500">Day {daysPassed} of {totalDays}</p>
              <div className="mt-3 text-sm space-y-1">
                <p><span className="text-gray-500">Resignation:</span> {dep.resignationDate}</p>
                <p><span className="text-gray-500">Last day:</span> {dep.lastWorkingDay}</p>
                <p><span className="text-gray-500">Manager:</span> {dep.manager.name}</p>
                <p><span className="text-gray-500">HR owner:</span> {dep.hrOwner.name}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'knowledge' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Knowledge Domains ({dep.domains.length})</h2>
            <button className="btn-secondary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Domain
            </button>
          </div>
          <div className="grid gap-4">
            {dep.domains
              .sort((a, b) => b.criticality - a.criticality)
              .map((domain) => (
              <div key={domain.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{domain.name}</h3>
                      <span className={`badge ${categoryColors[domain.category]}`}>{domain.category}</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <span>Criticality: <strong className="text-gray-900">{domain.criticality}/10</strong></span>
                      <span>Replaceability: <strong className="text-gray-900">{domain.replaceability}/10</strong></span>
                      <span>Successor: <strong className={domain.successor ? 'text-gray-900' : 'text-red-600'}>{domain.successor || 'Unassigned'}</strong></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <ProgressRing
                      value={domain.captureCompleteness}
                      size={56}
                      strokeWidth={5}
                      color={domain.captureCompleteness >= 70 ? '#40c057' : domain.captureCompleteness >= 30 ? '#fab005' : '#fa5252'}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Transfer Tasks</h2>
            <div className="flex gap-3">
              <button className="btn-secondary">Generate Tasks</button>
              <button className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Task</button>
            </div>
          </div>
          <div className="space-y-3">
            {dep.tasks.map((task) => (
              <div key={task.id} className="card flex items-center gap-4">
                <button className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                  task.status === 'completed' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
                }`}>
                  {task.status === 'completed' && <CheckCircle className="w-3.5 h-3.5" />}
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}>{task.title}</span>
                    <span className={`badge ${
                      task.priority === 'critical' ? 'badge-danger' :
                      task.priority === 'high' ? 'badge-warning' : 'badge-neutral'
                    }`}>{task.priority}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {task.type.replace(/_/g, ' ')} &middot; {task.assignee || 'Unassigned'} &middot; Due {task.dueDate}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'interviews' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">AI Interview Sessions</h2>
            <button className="btn-primary flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> New Interview
            </button>
          </div>
          <div className="space-y-3">
            {dep.interviews.map((interview) => (
              <Link key={interview.id} to={`/interviews/${interview.id}`} className="card flex items-center justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    interview.status === 'completed' ? 'bg-green-100 text-green-700' :
                    interview.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium capitalize">{interview.type.replace(/_/g, ' ')}</h3>
                    <p className="text-sm text-gray-500">{interview.date} &middot; {interview.itemsCaptured} items captured</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${interview.status === 'completed' ? 'badge-success' : interview.status === 'scheduled' ? 'badge-info' : 'badge-warning'}`}>
                    {interview.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
