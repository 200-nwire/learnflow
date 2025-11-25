/**
 * WebSocket Transport for Chat
 * Wraps the WebSocket client as a transport
 */

import { ref, type Ref } from 'vue';
import { WebSocketChatbotClient } from '../../api/websocket-client.js';
import type { ChatbotConfig, BotInfo } from '../../types.js';
import type { ChatTransport } from '../useChat.js';

export class WebSocketTransport implements ChatTransport {
  private client: WebSocketChatbotClient;
  private messageHandlers: Array<(message: string, metadata?: Record<string, any>) => void> = [];
  private streamChunkHandlers: Array<(chunk: string, end: boolean, suggestions?: import('../../types.js').Suggestion[]) => void> = [];
  private errorHandlers: Array<(error: Error) => void> = [];
  public botInfo: Ref<BotInfo | null> = ref<BotInfo | null>(null);
  public isConnected: Ref<boolean> = ref(false);

  constructor(config: ChatbotConfig) {
    this.client = new WebSocketChatbotClient(config);
    this.setupErrorHandler();
  }

  private setupErrorHandler(): void {
    this.client.onError = (error) => {
      this.errorHandlers.forEach(handler => handler(error));
    };
  }

  private setupTextHandler(): void {
    // Set up text handler - must be called after socket is connected
    // Following original pattern: on('text', message => appendMessage(message))
    // Original: textResponse.value.text += message?.chunk
    this.client.onText((message) => {
      // Extract chunk and end from message (original: message?.chunk, message?.end)
      let chunk = '';
      let isEnd = false;
      let suggestions: import('../../types.js').Suggestion[] | undefined = undefined;
      
      if (typeof message === 'string') {
        chunk = message;
        isEnd = false;
      } else if (message && typeof message === 'object') {
        // Extract chunk and end (original: message?.chunk, message?.end)
        chunk = message.chunk || message.text || '';
        isEnd = message.end || false;
        // Extract suggestions if text_complete is true
        if (message.text_complete && message.suggestions && Array.isArray(message.suggestions)) {
          suggestions = message.suggestions;
        }
      }
      
      // Process the chunk (following original: textResponse.value.text += message?.chunk)
      // Only process if we have a chunk or it's an end marker
      if (chunk || isEnd) {
        console.log('[WebSocketTransport] Processing - chunk length:', chunk.length, 'isEnd:', isEnd, 'chunk preview:', JSON.stringify(chunk).substring(0, 30));
        this.streamChunkHandlers.forEach(handler => {
          try {
            handler(chunk, isEnd, isEnd ? suggestions : undefined);
          } catch (err) {
            console.error('[WebSocketTransport] Error in stream chunk handler:', err);
          }
        });
      }
    });
  }

  async connect(): Promise<void> {
    // If already connected, return
    if (this.client.connected) {
      this.isConnected.value = true;
      return;
    }

    // Create chat session if needed
    if (!this.client.currentChatId) {
      const config = this.client.getConfig();
      if (!config.botId) {
        throw new Error('Bot ID is required for WebSocket connection');
      }
      const chatData = await this.client.createChat(config.botId);
      // Bot info is now stored in client.botInfo after createChat
      console.log('[WebSocketTransport] createChat response:', chatData);
      console.log('[WebSocketTransport] client.botInfo after createChat:', this.client.botInfo);
      
      // Update botInfo - prefer chatData.bot, fallback to client.botInfo
      const newBotInfo = chatData.bot || this.client.botInfo;
      if (newBotInfo) {
        this.botInfo.value = newBotInfo;
        console.log('[WebSocketTransport] Bot info set in transport:', this.botInfo.value);
        console.log('[WebSocketTransport] Bot name:', this.botInfo.value.name);
        console.log('[WebSocketTransport] Bot image:', this.botInfo.value.image ? 'present' : 'missing');
        console.log('[WebSocketTransport] Welcome message:', this.botInfo.value.welcome_message ? 'present' : 'missing');
      } else {
        console.warn('[WebSocketTransport] No bot info found in chatData or client');
      }
    }

    // Set up connection state handlers BEFORE connecting
    this.client.onConnect = () => {
      this.isConnected.value = true;
      console.log('[WebSocketTransport] Connection state updated: connected');
    };
    
    this.client.onDisconnect = () => {
      this.isConnected.value = false;
      console.log('[WebSocketTransport] Connection state updated: disconnected');
    };

    // Connect WebSocket and wait for connection
    await this.client.connect();
    
    // Update connection state after connect
    this.isConnected.value = this.client.connected;
    
    // Set up text handler AFTER connection is established
    this.setupTextHandler();
  }

  disconnect(): void {
    this.client.disconnect();
    this.isConnected.value = false;
  }

  async sendMessage(message: string, responseType: 'text' | 'video' | 'voice' = 'text'): Promise<void> {
    // Auto-connect if not connected
    if (!this.client.connected) {
      console.log('[WebSocketTransport] Auto-connecting before sending message');
      await this.connect();
    }
    this.client.sendMessage(message, responseType);
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const config = this.client.getConfig();
      if (!config.botId) {
        return { success: false, error: 'Bot ID is required' };
      }
      // Use the same client to test, so botInfo is set on the main client
      if (!this.client.currentChatId) {
        const chatData = await this.client.createChat(config.botId);
        // Update botInfo from the test connection
        if (chatData.bot) {
          this.botInfo.value = chatData.bot;
          console.log('[WebSocketTransport] Bot info updated from testConnection:', this.botInfo.value);
        } else if (this.client.botInfo) {
          this.botInfo.value = this.client.botInfo;
          console.log('[WebSocketTransport] Bot info updated from client.botInfo in testConnection:', this.botInfo.value);
        }
      }
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

  // isConnected is now a reactive ref, accessed via .value

  getConfig(): ChatbotConfig {
    return this.client.getConfig();
  }

  updateConfig(config: Partial<ChatbotConfig>): void {
    this.client.updateConfig(config);
  }
}

