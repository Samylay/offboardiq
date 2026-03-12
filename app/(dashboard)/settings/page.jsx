'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/utils/api';
import { useAuth } from '@/hooks/useAuth';
import { Settings, Users, Webhook, Key, Save } from 'lucide-react';

export default function SettingsPage() {
  const { org } = useAuth();
  const [settings, setSettings] = useState({});
  const [members, setMembers] = useState([]);
  const [tab, setTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/organizations/settings'),
      api.get('/organizations/members'),
    ]).then(([s, m]) => { setSettings(s); setMembers(m); }).catch(console.error);
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const updated = await api.patch('/organizations/settings', settings);
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'integrations', label: 'Integrations', icon: Webhook },
    { id: 'api', label: 'API Keys', icon: Key },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Settings</h1>

      <div className="flex gap-8">
        {/* Sidebar tabs */}
        <div className="w-48 space-y-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${tab === id ? 'bg-brand-100 text-brand-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">
          {tab === 'general' && (
            <div className="card p-6 space-y-6">
              <h2 className="text-lg font-semibold">Organization Settings</h2>
              <div>
                <label className="block text-sm font-medium mb-1">Organization Name</label>
                <p className="input bg-gray-50">{org?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Default Interview Duration (minutes)</label>
                <input type="number" value={settings.interviewDefaultDuration || 60}
                  onChange={(e) => setSettings({ ...settings, interviewDefaultDuration: +e.target.value })}
                  className="input w-32" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Risk Thresholds</label>
                <div className="grid grid-cols-3 gap-4">
                  {['low', 'medium', 'high'].map((level) => (
                    <div key={level}>
                      <label className="text-xs text-gray-500 capitalize">{level} (max score)</label>
                      <input type="number" value={settings.riskThresholds?.[level] || (level === 'low' ? 30 : level === 'medium' ? 60 : 80)}
                        onChange={(e) => setSettings({ ...settings, riskThresholds: { ...settings.riskThresholds, [level]: +e.target.value } })}
                        className="input" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={saveSettings} disabled={saving} className="btn-primary">
                  <Save className="h-4 w-4 mr-1" />{saving ? 'Saving...' : 'Save Settings'}
                </button>
                {saved && <span className="text-sm text-green-600">Saved!</span>}
              </div>
            </div>
          )}

          {tab === 'team' && (
            <div className="card">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h2 className="font-semibold">Team Members</h2>
                <span className="text-sm text-gray-500">{members.length} members</span>
              </div>
              <div className="divide-y">
                {members.map((m) => (
                  <div key={m.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold">
                        {m.first_name[0]}{m.last_name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{m.first_name} {m.last_name}</p>
                        <p className="text-xs text-gray-500">{m.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="badge bg-gray-100 text-gray-600">{m.role}</span>
                      {m.department && <p className="text-xs text-gray-400 mt-1">{m.department}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'integrations' && (
            <div className="card p-6 space-y-6">
              <h2 className="text-lg font-semibold">HRIS Integrations</h2>
              <p className="text-sm text-gray-500">Connect your HRIS to auto-trigger offboarding when employees depart.</p>
              <div className="space-y-4">
                {['BambooHR', 'Workday', 'Rippling'].map((provider) => (
                  <div key={provider} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{provider}</p>
                      <p className="text-sm text-gray-500">Webhook URL: <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">/api/webhooks/hris/{org?.slug}/{provider.toLowerCase()}</code></p>
                    </div>
                    <span className="badge bg-gray-100 text-gray-600">Ready</span>
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Webhook Secret</label>
                <input type="password" placeholder="Enter webhook signing secret..."
                  onChange={(e) => setSettings({ ...settings, webhookSecrets: { ...settings.webhookSecrets, default: e.target.value } })}
                  className="input" />
              </div>
              <button onClick={saveSettings} disabled={saving} className="btn-primary">
                <Save className="h-4 w-4 mr-1" />{saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}

          {tab === 'api' && (
            <div className="card p-6 space-y-6">
              <h2 className="text-lg font-semibold">API Configuration</h2>
              <div>
                <label className="block text-sm font-medium mb-1">AI Provider API Key</label>
                <p className="text-sm text-gray-500 mb-2">Set via <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">ANTHROPIC_API_KEY</code> environment variable on Vercel.</p>
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                  {process.env.NEXT_PUBLIC_AI_CONFIGURED === 'true' ? 'AI provider configured' : 'Configure in Vercel environment variables'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
