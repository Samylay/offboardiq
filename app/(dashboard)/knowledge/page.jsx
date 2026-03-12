'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/utils/api';
import { Search, Filter, CheckCircle, Book, FileText, Users, Code, Key } from 'lucide-react';

const typeIcons = {
  document: FileText, procedure: Book, contact: Users,
  codebase: Code, credential: Key, default: FileText,
};

export default function KnowledgeBasePage() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = () => {
    Promise.all([
      api.get('/search/stats'),
      api.get('/search'),
    ]).then(([statsData, searchData]) => {
      setStats(statsData);
      setItems(searchData.items || []);
    }).catch(console.error).finally(() => setLoading(false));
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (typeFilter) params.set('type', typeFilter);
      const data = await api.get(`/search?${params}`);
      setItems(data.items || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleVerify = async (itemId) => {
    try {
      await api.post(`/knowledge/items/${itemId}/verify`, { verified: true });
      setItems((prev) => prev.map((i) => i.id === itemId ? { ...i, is_verified: true } : i));
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Knowledge Base</h1>
        {stats && (
          <div className="flex gap-6 text-sm">
            <span className="text-gray-500">{stats.totalItems} items</span>
            <span className="text-green-600">{stats.verificationRate}% verified</span>
          </div>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(stats.byType || {}).slice(0, 4).map(([type, count]) => {
            const Icon = typeIcons[type] || typeIcons.default;
            return (
              <div key={type} className="card p-4 flex items-center gap-3">
                <Icon className="h-5 w-5 text-brand-600" />
                <div>
                  <p className="text-lg font-bold">{count}</p>
                  <p className="text-xs text-gray-500">{type.replace('_', ' ')}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Search */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search knowledge items..." className="input pl-10" />
        </div>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); }} className="input w-48">
          <option value="">All types</option>
          <option value="document">Document</option>
          <option value="procedure">Procedure</option>
          <option value="contact">Contact</option>
          <option value="workaround">Workaround</option>
          <option value="unwritten_rule">Unwritten Rule</option>
          <option value="decision_context">Decision Context</option>
        </select>
        <button onClick={handleSearch} className="btn-primary">Search</button>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" /></div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">No knowledge items found</div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const Icon = typeIcons[item.type] || typeIcons.default;
            return (
              <div key={item.id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <Icon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{item.title}</h3>
                        {item.is_verified && <CheckCircle className="h-4 w-4 text-green-500" />}
                      </div>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.content}</p>
                      <div className="flex gap-3 mt-2 text-xs text-gray-400">
                        <span>{item.type?.replace('_', ' ')}</span>
                        {item.domain_name && <span>&middot; {item.domain_name}</span>}
                        {item.source_first_name && <span>&middot; From: {item.source_first_name} {item.source_last_name}</span>}
                      </div>
                    </div>
                  </div>
                  {!item.is_verified && (
                    <button onClick={() => handleVerify(item.id)} className="btn-secondary text-xs">Verify</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
