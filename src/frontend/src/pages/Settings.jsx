import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your organization and integrations</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-48 space-y-1">
          {[
            { id: 'general', label: 'General' },
            { id: 'integrations', label: 'Integrations' },
            { id: 'notifications', label: 'Notifications' },
            { id: 'team', label: 'Team' },
            { id: 'billing', label: 'Billing' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 max-w-2xl">
          {activeTab === 'general' && (
            <div className="card space-y-6">
              <h2 className="text-lg font-semibold">Organization Settings</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                <input type="text" className="input" defaultValue="Acme Corp" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <select className="input">
                  <option>Technology</option>
                  <option>Finance</option>
                  <option>Healthcare</option>
                  <option>Manufacturing</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Offboarding Window (days)</label>
                <input type="number" className="input w-32" defaultValue={14} />
                <p className="text-xs text-gray-500 mt-1">The default number of days between resignation and last working day</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Knowledge Capture Target (%)</label>
                <input type="number" className="input w-32" defaultValue={70} />
                <p className="text-xs text-gray-500 mt-1">Target knowledge capture percentage before departure</p>
              </div>

              <button className="btn-primary">Save Changes</button>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Integrations</h2>

              {[
                { name: 'Slack', description: 'Send notifications and reminders to Slack channels', connected: true },
                { name: 'BambooHR', description: 'Auto-trigger offboarding from resignation events', connected: false },
                { name: 'Workday', description: 'Sync employee data and departure events', connected: false },
                { name: 'Google Calendar', description: 'Auto-schedule interview and handoff sessions', connected: true },
                { name: 'Jira', description: 'Track knowledge transfer tasks alongside project work', connected: false },
                { name: 'Confluence', description: 'Export captured knowledge to Confluence pages', connected: false },
              ].map((integration) => (
                <div key={integration.name} className="card flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{integration.name}</h3>
                    <p className="text-sm text-gray-500">{integration.description}</p>
                  </div>
                  <button className={integration.connected ? 'btn-secondary' : 'btn-primary'}>
                    {integration.connected ? 'Connected' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card space-y-6">
              <h2 className="text-lg font-semibold">Notification Preferences</h2>
              {[
                { label: 'New departure initiated', desc: 'When a new offboarding case is created' },
                { label: 'Risk score alerts', desc: 'When a departure risk score exceeds threshold' },
                { label: 'Task overdue', desc: 'When a transfer task passes its due date' },
                { label: 'Interview reminders', desc: '24 hours before scheduled interviews' },
                { label: 'Knowledge gap detected', desc: 'When AI identifies critical uncaptured knowledge' },
                { label: 'Weekly digest', desc: 'Summary of all active departures and progress' },
              ].map((pref) => (
                <div key={pref.label} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{pref.label}</p>
                    <p className="text-xs text-gray-500">{pref.desc}</p>
                  </div>
                  <div className="flex gap-4">
                    {['Email', 'Slack', 'In-app'].map((channel) => (
                      <label key={channel} className="flex items-center gap-1.5 text-sm">
                        <input type="checkbox" defaultChecked className="rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                        {channel}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <button className="btn-primary">Save Preferences</button>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Team Members</h2>
              <p className="text-sm text-gray-500 mb-4">Manage who has access to OffboardIQ in your organization.</p>
              <button className="btn-primary mb-6">Invite Member</button>
              <div className="divide-y">
                {[
                  { name: 'Jordan Lee', email: 'jordan@acme.com', role: 'Admin' },
                  { name: 'Alex Thompson', email: 'alex@acme.com', role: 'Manager' },
                  { name: 'Casey Morgan', email: 'casey@acme.com', role: 'HR Manager' },
                ].map((member) => (
                  <div key={member.email} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-medium">
                        {member.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                    </div>
                    <span className="badge badge-neutral">{member.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Billing</h2>
              <div className="bg-brand-50 rounded-lg p-4 mb-6">
                <p className="font-medium text-brand-700">Growth Plan — $149/departure</p>
                <p className="text-sm text-brand-600 mt-1">14-day free trial (8 days remaining)</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Departures this billing period</span>
                  <span className="font-medium">4</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Current charges</span>
                  <span className="font-medium">$596.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Next billing date</span>
                  <span className="font-medium">April 1, 2026</span>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button className="btn-secondary">Update Payment Method</button>
                <button className="btn-secondary">View Invoices</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
