/**
 * Chatbot API Client
 * Handles communication with the chatbot API endpoint
 */

import type { ChatbotConfig, ChatbotResponse, StreamChunk, ChatbotUIConfig } from '../types.js';

export class ChatbotAPIClient {
  private config: Required<Omit<ChatbotConfig, 'meta' | 'ui' | 'useWebSocket' | 'botId'>> & { 
    meta?: Record<string, any>; 
    ui?: ChatbotUIConfig;
    useWebSocket?: boolean;
    botId?: string;
  };

  constructor(config: ChatbotConfig) {
    this.config = {
      endpoint: config.endpoint || '',
      token: config.token || '',
      headers: config.headers || {},
      timeout: config.timeout || 30000,
      streaming: config.streaming ?? true,
      meta: config.meta,
      ui: config.ui,
    };

    if (!this.config.endpoint) {
      throw new Error('Chatbot endpoint is required');
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ChatbotConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      headers: { ...this.config.headers, ...(config.headers || {}) },
      meta: { ...this.config.meta, ...(config.meta || {}) },
      ui: { ...this.config.ui, ...(config.ui || {}) },
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): ChatbotConfig {
    return { ...this.config };
  }

  /**
   * Send a message and get response (non-streaming)
   */
  async sendMessage(
    message: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<ChatbotResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.token && { Authorization: `Bearer ${this.config.token}` }),
          ...this.config.headers,
        },
        body: JSON.stringify({
          message,
          history: conversationHistory || [],
          meta: this.config.meta,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return {
        content: data.content || data.message || '',
        metadata: data.metadata,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.config.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Send a message and stream response
   */
  async *streamMessage(
    message: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.token && { Authorization: `Bearer ${this.config.token}` }),
          ...this.config.headers,
        },
        body: JSON.stringify({
          message,
          history: conversationHistory || [],
          meta: this.config.meta,
          stream: true,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // Process any remaining buffer
          if (buffer.trim()) {
            try {
              const chunk = JSON.parse(buffer);
              yield chunk;
            } catch {
              // If buffer doesn't parse, yield as content
              yield { content: buffer, done: true };
            }
          } else {
            yield { done: true };
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              // Try to parse as JSON (SSE format: "data: {...}")
              const jsonMatch = line.match(/^data:\s*(.+)$/);
              if (jsonMatch) {
                const chunk = JSON.parse(jsonMatch[1]);
                yield chunk;
              } else {
                // Try direct JSON parse
                const chunk = JSON.parse(line);
                yield chunk;
              }
            } catch {
              // If not JSON, treat as plain text content
              yield { content: line };
            }
          }
        }
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        yield { error: `Request timeout after ${this.config.timeout}ms`, done: true };
      } else {
        yield {
          error: error instanceof Error ? error.message : String(error),
          done: true,
        };
      }
    }
  }

  /**
   * Test connection to the API
   */
  async testConnection(): Promise<{ success: boolean; error?: string; statusCode?: number }> {
    try {
      const response = await fetch(this.config.endpoint, {
        method: 'OPTIONS',
        headers: {
          ...(this.config.token && { Authorization: `Bearer ${this.config.token}` }),
          ...this.config.headers,
        },
      });

      return {
        success: response.ok || response.status === 405, // 405 Method Not Allowed is OK for OPTIONS
        statusCode: response.status,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

