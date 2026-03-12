import { useState } from 'react';
import { Search, Filter, BookOpen, Tag, CheckCircle, Clock, User } from 'lucide-react';

const mockItems = [
  { id: '1', title: 'Stripe Custom Integration Architecture', type: 'codebase', category: 'technical', department: 'Engineering', source: 'Sarah Chen', createdAt: '2026-03-10', isVerified: true, qualityScore: 9, preview: 'Custom Stripe payment processing integration built ~2 years ago. Handles retry logic, webhook processing, and subscription lifecycle management...' },
  { id: '2', title: 'Billing Webhook Retry Loop Workaround', type: 'workaround', category: 'tribal', department: 'Engineering', source: 'Sarah Chen', createdAt: '2026-03-10', isVerified: true, qualityScore: 8, preview: 'Known issue where webhook retry logic enters infinite loop when response time exceeds 30 seconds. Fix script in ops repo at scripts/fix-webhook-loop.sh...' },
  { id: '3', title: 'Enterprise Client Escalation Protocol', type: 'escalation_path', category: 'process', department: 'Customer Success', source: 'Priya Patel', createdAt: '2026-03-08', isVerified: false, qualityScore: 7, preview: 'For enterprise clients (ARR > $100k), escalations go directly to VP of CS, not through the standard support queue. Contact list and SLA exceptions...' },
  { id: '4', title: 'Q4 Revenue Recognition Rules', type: 'procedure', category: 'process', department: 'Finance', source: 'James Rivera', createdAt: '2026-03-12', isVerified: false, qualityScore: 6, preview: 'Multi-year contracts require specific rev rec treatment. The ASC 606 compliance spreadsheet is in the Finance shared drive, but the actual calculations...' },
  { id: '5', title: 'AWS Cost Optimization Tricks', type: 'unwritten_rule', category: 'institutional', department: 'Engineering', source: 'Lisa Kim', createdAt: '2026-02-10', isVerified: true, qualityScore: 8, preview: 'Reserved instances for us-east-1 expire in July. The production database runs on r6g.2xlarge but could be downsized to r6g.xlarge during off-peak...' },
  { id: '6', title: 'Vendor Relationship: DataDog Account Rep', type: 'contact', category: 'relationship', department: 'Engineering', source: 'Lisa Kim', createdAt: '2026-02-12', isVerified: true, qualityScore: 7, preview: 'Primary contact: Jamie Torres (jamie.t@datadog.com). Has given us 20% discount renewal rate — mention "Lisa Kim" and contract #DD-2024-1847...' },
];

const knowledgeTypes = [
  'all', 'procedure', 'document', 'workaround', 'unwritten_rule',
  'contact', 'escalation_path', 'codebase', 'decision_context', 'vendor_relationship',
];

const categories = ['all', 'technical', 'process', 'relationship', 'institutional', 'tribal'];

export default function KnowledgeBase() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filtered = mockItems.filter((item) => {
    const matchesSearch = !search || item.title.toLowerCase().includes(search.toLowerCase())
      || item.preview.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesType && matchesCategory;
  });

  const typeColors = {
    codebase: 'bg-blue-100 text-blue-800',
    workaround: 'bg-red-100 text-red-800',
    procedure: 'bg-purple-100 text-purple-800',
    escalation_path: 'bg-orange-100 text-orange-800',
    contact: 'bg-green-100 text-green-800',
    unwritten_rule: 'bg-amber-100 text-amber-800',
    decision_context: 'bg-teal-100 text-teal-800',
    vendor_relationship: 'bg-cyan-100 text-cyan-800',
    document: 'bg-gray-100 text-gray-800',
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-brand-600" />
          Knowledge Base
        </h1>
        <p className="text-gray-600 mt-1">
          Search across all captured organizational knowledge — your company's second brain.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="card mb-6">
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search knowledge items (e.g., 'webhook retry', 'vendor contact')"
              className="input pl-11 text-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-4 flex-wrap">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Type</label>
            <select className="input w-auto text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              {knowledgeTypes.map((t) => (
                <option key={t} value={t}>{t === 'all' ? 'All types' : t.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Category</label>
            <select className="input w-auto text-sm" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              {categories.map((c) => (
                <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <p className="text-sm text-gray-500">{filtered.length} results</p>

        {filtered.map((item) => (
          <div key={item.id} className="card hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{item.title}</h3>
                {item.isVerified && (
                  <CheckCircle className="w-4 h-4 text-green-500" title="Verified" />
                )}
              </div>
              <span className={`badge ${typeColors[item.type] || 'badge-neutral'}`}>
                {item.type.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.preview}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><User className="w-3 h-3" /> {item.source}</span>
              <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {item.category}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {item.createdAt}</span>
              <span>{item.department}</span>
              <span>Quality: {item.qualityScore}/10</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
