/**
 * AIProvider — Unified interface for AI model interactions.
 * Supports Anthropic (Claude) with streaming for interviews.
 */

export async function chat(messages, options = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return mockResponse(messages);

  const systemMessages = messages.filter((m) => m.role === 'system');
  const conversationMessages = messages.filter((m) => m.role !== 'system');

  const body = {
    model: options.model || process.env.AI_MODEL || 'claude-sonnet-4-6',
    max_tokens: options.maxTokens || 2048,
    temperature: options.temperature ?? 0.7,
    messages: conversationMessages,
  };

  if (systemMessages.length > 0) {
    body.system = systemMessages.map((m) => m.content).join('\n\n');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(`AI provider error: ${response.status}`);
  const data = await response.json();
  return data.content[0].text;
}

export async function streamChat(messages, options = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { text: mockResponse(messages), stream: null };

  const systemMessages = messages.filter((m) => m.role === 'system');
  const conversationMessages = messages.filter((m) => m.role !== 'system');

  const body = {
    model: options.model || process.env.AI_MODEL || 'claude-sonnet-4-6',
    max_tokens: options.maxTokens || 2048,
    temperature: options.temperature ?? 0.7,
    stream: true,
    messages: conversationMessages,
  };

  if (systemMessages.length > 0) {
    body.system = systemMessages.map((m) => m.content).join('\n\n');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(`AI provider error: ${response.status}`);
  return { stream: response.body, text: null };
}

function mockResponse(messages) {
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
  if (!lastUserMessage) return "Let's begin. Can you walk me through your typical responsibilities?";
  return `Thank you for sharing that. That's very helpful context. Can you walk me through the exact steps, including any edge cases or workarounds you've developed over time?`;
}
