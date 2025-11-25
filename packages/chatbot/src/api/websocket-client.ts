/**
 * WebSocket Client for Chatbot
 * Handles real-time communication via Socket.IO
 */

import { io, Socket } from 'socket.io-client';
import type { ChatbotConfig, StreamChunk, BotInfo, ChatSessionResponse, ChatbotUIConfig } from '../types.js';

export interface WebSocketMessage {
  message: string;
  responseType: 'text' | 'video' | 'voice';
}

export interface WebSocketTextChunk {
  text?: string;
  chunk?: string;
  end?: boolean;
  text_complete?: boolean;
  suggestions?: import('../types.js').Suggestion[];
}

export interface WebSocketVideoChunk {
  text: string;
  video: string; // base64 encoded
  end: boolean;
}

export interface WebSocketVoiceChunk {
  voice: ArrayBuffer;
}

export class WebSocketChatbotClient {
  private config: Required<Omit<ChatbotConfig, 'meta' | 'ui' | 'useWebSocket'>> & { 
    meta?: Record<string, any>; 
    ui?: ChatbotUIConfig;
    useWebSocket?: boolean;
  };
  private socket: Socket | null = null;
  private chatId: string | null = null;
  private isConnected: boolean = false;
  public botInfo: BotInfo | null = null; // Public bot info from /chats response

  constructor(config: ChatbotConfig) {
    this.config = {
      endpoint: config.endpoint || '',
      token: config.token || '',
      headers: config.headers || {},
      timeout: config.timeout || 30000,
      streaming: config.streaming ?? true,
      useWebSocket: config.useWebSocket ?? true,
      botId: config.botId || '',
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
   * Create a new chat session
   */
  async createChat(botId: string): Promise<ChatSessionResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      // Build payload: botId at top level, then meta fields (excluding botId from meta), then ui
      const payload: Record<string, any> = {
        botId,
      };
      
      // Add meta fields (courseId, lessonId, pageId, sttLang) - always include sttLang
      if (this.config.meta) {
        // Extract meta fields to top level
        if (this.config.meta.courseId) payload.courseId = this.config.meta.courseId;
        if (this.config.meta.lessonId) payload.lessonId = this.config.meta.lessonId;
        if (this.config.meta.pageId) payload.pageId = this.config.meta.pageId;
      }
      
      // Always include sttLang (default to 'en-us')
      payload.sttLang = this.config.meta?.sttLang || 'en-us';
      
      // Add ui object if configured
      if (this.config.ui && Object.keys(this.config.ui).length > 0) {
        payload.ui = this.config.ui;
      }
      
      const response = await fetch(`${this.config.endpoint}/chats`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(this.config.token && { Authorization: `Bearer ${this.config.token}` }),
          ...this.config.headers,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      this.chatId = data.chatId;
      // Store bot info if available from /chats response
      if (data.bot) {
        this.botInfo = data.bot;
        console.log('[WebSocket] Bot info from /chats:', this.botInfo);
      }
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.config.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Connect to WebSocket
   * Returns a promise that resolves when connected
   */
  connect(chatId?: string): Promise<void> {
    if (this.socket?.connected) {
      this.isConnected = true;
      return Promise.resolve();
    }

    // Socket.IO can connect directly to HTTP/HTTPS endpoints
    // It will automatically use the correct protocol (ws/wss)
    // Build query parameters: chatId, courseId, lessonId, pageId
    const queryParams = new URLSearchParams();
    queryParams.set('chatId', chatId || this.chatId || '');
    
    // Add meta fields as query parameters
    if (this.config.meta?.courseId) {
      queryParams.set('courseId', this.config.meta.courseId);
    }
    if (this.config.meta?.lessonId) {
      queryParams.set('lessonId', this.config.meta.lessonId);
    }
    if (this.config.meta?.pageId) {
      queryParams.set('pageId', this.config.meta.pageId);
    }
    
    const socketUrl = `${this.config.endpoint}?${queryParams.toString()}`;
    console.log('[WebSocket] Connecting to:', socketUrl);

    this.socket = io(socketUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: this.config.token
        ? {
            token: this.config.token,
          }
        : undefined,
      extraHeaders: this.config.token
        ? {
            Authorization: `Bearer ${this.config.token}`,
          }
        : undefined,
    });

    // Set up all event handlers BEFORE connection completes
    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('[WebSocket] Connected');
      this.onConnect?.();
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('[WebSocket] Disconnected:', reason);
      this.onDisconnect?.();
    });

    this.socket.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
      this.onError?.(error);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);
      this.onError?.(error);
    });
    
    // Listen to all events for debugging
    this.socket.onAny((event, ...args) => {
      console.log('[WebSocket] Event received:', event, args);
    });

    // Return promise that resolves when connected
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, 10000);

      const cleanup = () => {
        clearTimeout(timeout);
        if (this.socket) {
          this.socket.off('connect', onConnect);
          this.socket.off('connect_error', onError);
        }
      };

      const onConnect = () => {
        cleanup();
        resolve();
      };

      const onError = (error: any) => {
        cleanup();
        reject(error instanceof Error ? error : new Error(String(error)));
      };

      if (this.socket) {
        this.socket.on('connect', onConnect);
        this.socket.on('connect_error', onError);
      }

      // If already connected, resolve immediately
      if (this.socket && this.socket.connected) {
        cleanup();
        resolve();
      }
    });
  }
  
  /**
   * Get the underlying socket instance (for debugging)
   */
  get socketInstance(): Socket | null {
    return this.socket;
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Send a message via WebSocket
   */
  sendMessage(message: string, responseType: 'text' | 'video' | 'voice' = 'text'): void {
    if (!this.socket || !this.isConnected) {
      throw new Error('WebSocket is not connected');
    }

    // Build meta object with botId, timestamp, courseId, lessonId, pageId, stt.lang
    const meta: Record<string, any> = {
      botId: this.config.botId,
      timestamp: Date.now(),
    };

    // Add meta fields if available
    if (this.config.meta?.courseId) {
      meta.courseId = this.config.meta.courseId;
    }
    if (this.config.meta?.lessonId) {
      meta.lessonId = this.config.meta.lessonId;
    }
    if (this.config.meta?.pageId) {
      meta.pageId = this.config.meta.pageId;
    }

    // Add stt.lang (default to 'en-us')
    const sttLang = this.config.meta?.sttLang || 'en-us';
    meta.stt = {
      lang: sttLang,
    };

    this.socket.emit('messages', {
      message,
      meta,
    });
  }

  /**
   * Listen for text chunks
   */
  onText(handler: (chunk: WebSocketTextChunk) => void): void {
    if (this.socket) {
      // Remove any existing listener first
      this.socket.off('text');
      // Set up new listener
      this.socket.on('text', (data: any) => {
        console.log('[WebSocket] Text event received:', data, 'type:', typeof data, 'isArray:', Array.isArray(data));
        // Following original pattern: on('text', message => appendMessage(message))
        // Pass the message directly to handler - let the transport layer handle it
        if (Array.isArray(data)) {
          // If array, process only the LAST item to avoid duplicates
          // Server might send multiple chunks in array, but we only want the latest
          const lastItem = data[data.length - 1];
          if (lastItem && typeof lastItem === 'object') {
            handler(lastItem);
          } else if (typeof lastItem === 'string') {
            // Direct string in array - wrap it
            handler({ chunk: lastItem, text: lastItem, end: false });
          }
        } else if (data && typeof data === 'object') {
          // Single object - pass directly (original: message?.chunk, message?.end)
          handler(data);
        } else if (typeof data === 'string') {
          // Direct string - wrap it
          handler({ chunk: data, text: data, end: false });
        } else {
          console.warn('[WebSocket] Unexpected text format:', data);
        }
      });
      console.log('[WebSocket] Text listener registered');
    } else {
      console.warn('[WebSocket] Cannot register text listener - socket not initialized');
    }
  }

  /**
   * Listen for video chunks
   */
  onVideo(handler: (chunk: WebSocketVideoChunk) => void): void {
    if (this.socket) {
      this.socket.on('video', handler);
    }
  }

  /**
   * Listen for voice chunks
   */
  onVoice(handler: (chunk: WebSocketVoiceChunk) => void): void {
    if (this.socket) {
      this.socket.on('voice', handler);
    }
  }

  /**
   * Remove event listeners
   */
  off(event: 'text' | 'video' | 'voice' | 'connect' | 'disconnect' | 'error'): void {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  /**
   * Get connection status
   */
  get connected(): boolean {
    return this.isConnected;
  }

  /**
   * Get chat ID
   */
  get currentChatId(): string | null {
    return this.chatId;
  }

  // Event handlers (can be set externally)
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

