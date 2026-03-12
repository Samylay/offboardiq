import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, Brain, Tag, Sparkles } from 'lucide-react';

const mockMessages = [
  {
    id: '1', role: 'assistant', content: `Hi Sarah! Thanks for taking the time to do this. I know transitions can be hectic, and I want to make sure the knowledge you've built here doesn't walk out the door with you — it's valuable and your team will benefit from capturing it.\n\nLet's start broad: Can you walk me through what a typical week looks like for you? I'm interested in everything — the obvious stuff and especially the things that might not show up on any org chart or job description.`,
  },
  {
    id: '2', role: 'user', content: `Sure. So a typical week... Monday I usually start by checking our payment processing dashboards — we use Stripe and have a custom integration that I built about 2 years ago. Nobody else really knows how it works. I also check the error logs for our billing service because there's a known issue where the webhook retry logic can get stuck in a loop if the response time exceeds 30 seconds. I wrote a workaround script for that.`,
  },
  {
    id: '3', role: 'assistant', content: `That's already incredibly valuable — two critical items right there. Let me capture those:\n\n[KNOWLEDGE_ITEM]\ntitle: Stripe Custom Integration Architecture\ntype: codebase\ncategory: technical\ncriticality: 9\ncontent: Custom Stripe payment processing integration built ~2 years ago. Sole maintainer is Sarah Chen. No documentation exists. Integration handles core payment processing workflows.\n[/KNOWLEDGE_ITEM]\n\n[KNOWLEDGE_ITEM]\ntitle: Billing Webhook Retry Loop Workaround\ntype: workaround\ncategory: tribal\ncriticality: 8\ncontent: Known issue where webhook retry logic enters infinite loop when response time exceeds 30 seconds. Sarah has a workaround script. This is undocumented and only Sarah knows about it.\n[/KNOWLEDGE_ITEM]\n\nThat webhook workaround is exactly the kind of thing that would cause a production incident if nobody knew about it. Can you tell me more about that script? Where does it live, how do you trigger it, and what exactly does it do?`,
  },
  {
    id: '4', role: 'user', content: `The script is in our ops repo under scripts/fix-webhook-loop.sh. Basically what happens is when the retry counter exceeds 50 for a single webhook event, the exponential backoff calculation overflows and it starts retrying every millisecond. The script queries the webhook_events table for any events with retry_count > 50, marks them as failed, and sends a Slack notification to #billing-alerts. I run it manually when I see the error rate spike on the dashboard, usually happens once or twice a month.\n\nThe real fix would be to cap the retry count in the code, but we never prioritized it because I just handle it manually.`,
  },
];

export default function InterviewSession() {
  const { id } = useParams();
  const [messages, setMessages] = useState(mockMessages);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { id: Date.now().toString(), role: 'user', content: input }]);
    setInput('');
  };

  const extractedItems = messages.flatMap((msg) => {
    const items = [];
    const regex = /\[KNOWLEDGE_ITEM\]([\s\S]*?)\[\/KNOWLEDGE_ITEM\]/g;
    let match;
    while ((match = regex.exec(msg.content)) !== null) {
      const block = match[1];
      const titleMatch = block.match(/title:\s*(.+)/);
      const typeMatch = block.match(/type:\s*(.+)/);
      const criticalityMatch = block.match(/criticality:\s*(\d+)/);
      if (titleMatch) {
        items.push({
          title: titleMatch[1].trim(),
          type: typeMatch?.[1].trim() || 'document',
          criticality: parseInt(criticalityMatch?.[1]) || 5,
        });
      }
    }
    return items;
  });

  const renderMessage = (content) => {
    // Strip knowledge item blocks for display and render the rest
    const cleaned = content.replace(/\[KNOWLEDGE_ITEM\][\s\S]*?\[\/KNOWLEDGE_ITEM\]/g, '').trim();
    const hasKnowledgeItems = content.includes('[KNOWLEDGE_ITEM]');

    return (
      <div>
        <p className="whitespace-pre-wrap">{cleaned}</p>
        {hasKnowledgeItems && (
          <div className="mt-3 p-3 bg-brand-50 rounded-lg border border-brand-200">
            <div className="flex items-center gap-1 text-brand-700 text-sm font-medium mb-1">
              <Sparkles className="w-4 h-4" />
              Knowledge items extracted
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-4">
          <Link to="/departures/1" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold">Knowledge Interview: Sarah Chen</h1>
            <p className="text-sm text-gray-500">Deep Dive — Payment Systems</p>
          </div>
        </div>

        {/* Extracted items sidebar toggle */}
        <div className="flex items-center gap-2">
          <span className="badge badge-success">{extractedItems.length} items captured</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden mt-4 gap-4">
        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-4 pb-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-brand-600 text-white'
                    : 'bg-white border border-gray-200'
                }`}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1 text-xs text-brand-600 font-medium mb-2">
                      <Brain className="w-3.5 h-3.5" /> OffboardIQ AI
                    </div>
                  )}
                  {renderMessage(msg.content)}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="border-t pt-4">
            <div className="flex gap-3">
              <input
                type="text"
                className="input flex-1"
                placeholder="Share your knowledge..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button onClick={handleSend} className="btn-primary flex items-center gap-2">
                <Send className="w-4 h-4" /> Send
              </button>
            </div>
          </div>
        </div>

        {/* Extracted items panel */}
        <div className="w-72 bg-white rounded-xl border border-gray-200 p-4 overflow-y-auto hidden lg:block">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Tag className="w-4 h-4 text-brand-600" />
            Captured Items
          </h3>
          <div className="space-y-2">
            {extractedItems.map((item, i) => (
              <div key={i} className="p-2 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">{item.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="badge badge-info text-xs">{item.type}</span>
                  <span className={`text-xs font-medium ${
                    item.criticality >= 8 ? 'text-red-600' : item.criticality >= 5 ? 'text-yellow-600' : 'text-green-600'
                  }`}>Criticality: {item.criticality}/10</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
