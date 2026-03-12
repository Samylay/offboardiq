'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/utils/api';
import { Send, CheckCircle, Brain } from 'lucide-react';

export default function InterviewSessionPage({ params }) {
  const { id: departureId } = use(params);
  const searchParams = useSearchParams();
  const isNew = searchParams.get('new') === 'true';

  const [interview, setInterview] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [extractedCount, setExtractedCount] = useState(0);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isNew) {
      startInterview();
    } else {
      loadInterview();
    }
  }, [departureId, isNew]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startInterview = async () => {
    try {
      const data = await api.post('/interviews', { departureId, phase: 'role_mapping' });
      setInterview(data);
      setMessages(data.messages || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadInterview = async () => {
    try {
      const data = await api.get(`/interviews/${departureId}`);
      setInterview(data);
      setMessages(data.messages || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !interview) return;

    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setSending(true);

    try {
      const res = await api.post(`/interviews/${interview.id}/messages`, { message: userMsg });
      setMessages((prev) => [...prev, res.message]);
      if (res.extractedItems > 0) setExtractedCount((c) => c + res.extractedItems);
    } catch (err) { console.error(err); }
    finally { setSending(false); }
  };

  const completeInterview = async () => {
    if (!interview) return;
    try {
      await api.post(`/interviews/${interview.id}/complete`);
      setInterview((prev) => ({ ...prev, status: 'completed' }));
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" /></div>;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Brain className="h-5 w-5 text-brand-600" />
            Knowledge Capture Interview
          </h1>
          <p className="text-sm text-gray-500">Phase: {interview?.phase?.replace('_', ' ') || 'Role Mapping'}</p>
        </div>
        <div className="flex items-center gap-4">
          {extractedCount > 0 && (
            <span className="badge bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" /> {extractedCount} items captured
            </span>
          )}
          {interview?.status !== 'completed' && (
            <button onClick={completeInterview} className="btn-secondary text-sm">
              Complete Interview
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto card p-6 mb-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-800'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {interview?.status !== 'completed' ? (
        <form onSubmit={sendMessage} className="flex gap-3">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your response..."
            className="input flex-1" disabled={sending} autoFocus />
          <button type="submit" disabled={sending || !input.trim()} className="btn-primary px-6">
            <Send className="h-4 w-4" />
          </button>
        </form>
      ) : (
        <div className="text-center py-4 text-sm text-gray-500">
          <CheckCircle className="h-5 w-5 text-green-500 inline mr-1" />
          Interview completed. {extractedCount} knowledge items were captured.
        </div>
      )}
    </div>
  );
}
