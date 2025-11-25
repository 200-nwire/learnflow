/**
 * HTTP Transport for Chat
 * Wraps the HTTP API client as a transport
 */

import { ChatbotAPIClient } from '../../api/client.js';
import type { ChatbotConfig } from '../../types.js';
import type { ChatTransport } from '../useChat.js';

export class HTTPTransport implements ChatTransport {
  private client: ChatbotAPIClient;
  private messageHandlers: Array<(message: string, metadata?: Record<string, any>) => void> = [];
  private streamChunkHandlers: Array<(chunk: string, end: boolean, suggestions?: import('../../types.js').Suggestion[]) => void> = [];
  private errorHandlers: Array<(error: Error) => void> = [];

  constructor(config: ChatbotConfig) {
    this.client = new ChatbotAPIClient(config);
  }

  updateConfig(config: Partial<ChatbotConfig>): void {
    this.client.updateConfig(config);
  }

  async sendMessage(message: string, responseType: 'text' | 'video' | 'voice' = 'text'): Promise<void> {
    try {
      const config = this.client.getConfig();
      if (config.streaming) {
        for await (const chunk of this.client.streamMessage(message)) {
          this.streamChunkHandlers.forEach(handler => {
            handler(chunk.content || '', chunk.done || false);
          });
          if (chunk.done) {
            // Final message
            this.messageHandlers.forEach(handler => {
              handler('', chunk.metadata);
            });
          }
        }
      } else {
        const response = await this.client.sendMessage(message);
        this.messageHandlers.forEach(handler => {
          handler(response.content, response.metadata);
        });
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.errorHandlers.forEach(handler => handler(err));
      throw err;
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.client.testConnection();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  onMessage(handler: (message: string, metadata?: Record<string, any>) => void): void {
    this.messageHandlers.push(handler);
  }

  onStreamChunk(handler: (chunk: string, end: boolean, suggestions?: import('../../types.js').Suggestion[]) => void): void {
    this.streamChunkHandlers.push(handler);
  }

  onError(handler: (error: Error) => void): void {
    this.errorHandlers.push(handler);
  }
}

