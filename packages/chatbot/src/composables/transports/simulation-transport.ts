/**
 * Simulation Transport for Chat
 * Allows sending messages without any actual transport
 * Useful for testing and demos
 */

import type { ChatTransport } from '../useChat.js';

export class SimulationTransport implements ChatTransport {
  private messageHandlers: Array<(message: string, metadata?: Record<string, any>) => void> = [];
  private streamChunkHandlers: Array<(chunk: string, end: boolean) => void> = [];
  private errorHandlers: Array<(error: Error) => void> = [];

  sendMessage(message: string, responseType: 'text' | 'video' | 'voice' = 'text'): void {
    // Simulation transport does nothing - messages are injected directly via useChat
  }

  onMessage(handler: (message: string, metadata?: Record<string, any>) => void): void {
    this.messageHandlers.push(handler);
  }

  onStreamChunk(handler: (chunk: string, end: boolean) => void): void {
    this.streamChunkHandlers.push(handler);
  }

  onError(handler: (error: Error) => void): void {
    this.errorHandlers.push(handler);
  }

  // Helper to trigger a simulated response
  triggerResponse(content: string, streaming: boolean = false, metadata?: Record<string, any>): void {
    if (streaming) {
      // Simulate streaming
      let index = 0;
      const interval = setInterval(() => {
        if (index < content.length) {
          this.streamChunkHandlers.forEach(handler => {
            handler(content[index], false);
          });
          index++;
        } else {
          clearInterval(interval);
          this.streamChunkHandlers.forEach(handler => {
            handler('', true);
          });
        }
      }, 20);
    } else {
      this.messageHandlers.forEach(handler => {
        handler(content, metadata);
      });
    }
  }
}

