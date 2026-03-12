'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/utils/api';
import RiskBadge from '@/components/common/RiskBadge';
import { Plus, Search, Filter } from 'lucide-react';

const statusColors = {
  initiated: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  interview_phase: 'bg-purple-100 text-purple-800',
  transfer_phase: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-600',
};

export default function DeparturesListPage() {
  const [departures, setDepartures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadDepartures();
  }, [statusFilter]);

  const loadDepartures = () => {
    const params = statusFilter ? `?status=${statusFilter}` : '';
    api.get(`/departures${params}`).then((data) => setDepartures(data.departures || [])).catch(console.error).finally(() => setLoading(false));
  };

  const filtered = departures.filter((d) =>
    !search || d.employee_name?.toLowerCase().includes(search.toLowerCase()) || d.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Departures</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">
          <Plus className="h-4 w-4 mr-1" /> New Departure
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or department..." className="input pl-10" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-48">
          <option value="">All statuses</option>
          <option value="initiated">Initiated</option>
          <option value="in_progress">In Progress</option>
          <option value="interview_phase">Interview Phase</option>
          <option value="transfer_phase">Transfer Phase</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <p className="mb-2">No departures found</p>
          <button onClick={() => setShowCreate(true)} className="text-brand-600 text-sm">Create one now</button>
        </div>
      ) : (
        <div className="card divide-y">
          {filtered.map((d) => (
            <Link key={d.id} href={`/departures/${d.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <p className="font-medium">{d.employee_name}</p>
                  <span className={`badge ${statusColors[d.status] || 'bg-gray-100 text-gray-600'}`}>
                    {d.status?.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{d.title} &middot; {d.department}</p>
              </div>
              <div className="flex items-center gap-6 text-right">
                {d.overall_risk_score != null && <RiskBadge score={d.overall_risk_score} size="sm" />}
                <div>
                  <p className="text-sm font-medium">Last Day</p>
                  <p className="text-sm text-gray-500">{new Date(d.last_working_day).toLocaleDateString()}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreate && <CreateDepartureModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); loadDepartures(); }} />}
    </div>
  );
}

function CreateDepartureModal({ onClose, onCreated }) {
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({ employeeId: '', resignationDate: '', lastWorkingDay: '', departureReason: 'voluntary', departureNotes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { api.get('/organizations/members').then(setMembers).catch(console.error); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/departures', form);
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold mb-4">New Departure</h2>
        {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Employee</label>
            <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="input" required>
              <option value="">Select employee...</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.first_name} {m.last_name} — {m.title}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Resignation Date</label>
              <input type="date" value={form.resignationDate} onChange={(e) => setForm({ ...form, resignationDate: e.target.value })} className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Working Day</label>
              <input type="date" value={form.lastWorkingDay} onChange={(e) => setForm({ ...form, lastWorkingDay: e.target.value })} className="input" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reason</label>
            <select value={form.departureReason} onChange={(e) => setForm({ ...form, departureReason: e.target.value })} className="input">
              <option value="voluntary">Voluntary</option>
              <option value="involuntary">Involuntary</option>
              <option value="retirement">Retirement</option>
              <option value="contract_end">Contract End</option>
              <option value="mutual">Mutual</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea value={form.departureNotes} onChange={(e) => setForm({ ...form, departureNotes: e.target.value })} className="input" rows={3} />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Creating...' : 'Create Departure'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
