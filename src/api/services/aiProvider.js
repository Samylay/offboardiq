const config = require('../../config/env');
const logger = require('../utils/logger');

/**
 * AIProvider — Unified interface for AI model interactions.
 *
 * Supports Anthropic (Claude) as the primary provider.
 * Designed for streaming responses in interview contexts.
 */
class AIProvider {
  constructor() {
    this.provider = config.ai.provider;
    this.model = config.ai.model;
  }

  /**
   * Send a chat completion request.
   * @param {Array} messages - Array of {role, content} messages
   * @param {Object} options - Additional options (temperature, max_tokens, etc.)
   * @returns {Promise<string>} The AI response content
   */
  async chat(messages, options = {}) {
    if (this.provider === 'anthropic') {
      return this._chatAnthropic(messages, options);
    }
    throw new Error(`Unsupported AI provider: ${this.provider}`);
  }

  /**
   * Stream a chat completion for real-time interview responses.
   * @param {Array} messages - Array of {role, content} messages
   * @param {Function} onChunk - Callback for each text chunk
   * @param {Object} options - Additional options
   * @returns {Promise<string>} The complete response
   */
  async streamChat(messages, onChunk, options = {}) {
    if (this.provider === 'anthropic') {
      return this._streamAnthropic(messages, onChunk, options);
    }
    throw new Error(`Unsupported AI provider: ${this.provider}`);
  }

  async _chatAnthropic(messages, options) {
    const apiKey = config.ai.anthropicApiKey;
    if (!apiKey) {
      logger.warn('Anthropic API key not configured — returning mock response');
      return this._mockResponse(messages);
    }

    // Separate system messages from conversation
    const systemMessages = messages.filter((m) => m.role === 'system');
    const conversationMessages = messages.filter((m) => m.role !== 'system');

    const body = {
      model: options.model || this.model,
      max_tokens: options.maxTokens || 2048,
      temperature: options.temperature ?? 0.7,
      messages: conversationMessages,
    };

    if (systemMessages.length > 0) {
      body.system = systemMessages.map((m) => m.content).join('\n\n');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error(`Anthropic API error: ${response.status} ${error}`);
      throw new Error(`AI provider error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  async _streamAnthropic(messages, onChunk, options) {
    const apiKey = config.ai.anthropicApiKey;
    if (!apiKey) {
      const mock = this._mockResponse(messages);
      // Simulate streaming
      const words = mock.split(' ');
      for (const word of words) {
        onChunk(word + ' ');
        await new Promise((r) => setTimeout(r, 30));
      }
      return mock;
    }

    const systemMessages = messages.filter((m) => m.role === 'system');
    const conversationMessages = messages.filter((m) => m.role !== 'system');

    const body = {
      model: options.model || this.model,
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
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI provider error: ${response.status} - ${error}`);
    }

    let fullResponse = '';
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const event = JSON.parse(data);
            if (event.type === 'content_block_delta' && event.delta?.text) {
              fullResponse += event.delta.text;
              onChunk(event.delta.text);
            }
          } catch {
            // Skip malformed JSON in stream
          }
        }
      }
    }

    return fullResponse;
  }

  /**
   * Analyze text and extract structured data.
   * Used for post-interview knowledge item extraction and quality scoring.
   */
  async analyzeAndExtract(content, extractionSchema) {
    const messages = [
      {
        role: 'system',
        content: `You are a knowledge extraction specialist. Analyze the provided text and extract structured information according to the schema. Return ONLY valid JSON matching the schema. Do not include any other text.`,
      },
      {
        role: 'user',
        content: `Extract structured knowledge items from this interview transcript:\n\n${content}\n\nExtraction schema:\n${JSON.stringify(extractionSchema, null, 2)}`,
      },
    ];

    const response = await this.chat(messages, { temperature: 0.3 });

    try {
      return JSON.parse(response);
    } catch {
      logger.warn('Failed to parse AI extraction response as JSON');
      return null;
    }
  }

  _mockResponse(messages) {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMessage) {
      return "Let's begin. Can you walk me through your typical responsibilities?";
    }

    return `Thank you for sharing that. That's very helpful context. Let me follow up — you mentioned some specific processes. Can you walk me through the exact steps, including any edge cases or workarounds you've developed over time? I'm particularly interested in the things that aren't documented anywhere.`;
  }
}

module.exports = new AIProvider();
