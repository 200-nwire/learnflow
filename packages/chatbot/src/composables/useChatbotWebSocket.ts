/**
 * useChatbotWebSocket composable
 * WebSocket-based chatbot implementation using Socket.IO
 */

import { ref, computed, watch, onUnmounted } from 'vue';
import { WebSocketChatbotClient } from '../api/websocket-client.js';
import type {
  ChatbotConfig,
  ChatMessage,
  ChatbotState,
  ChatbotStats,
  BotInfo,
} from '../types.js';

/**
 * Generate unique message ID
 */
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * useChatbotWebSocket composable
 */
export function useChatbotWebSocket(config: ChatbotConfig) {
  const wsClient = ref<WebSocketChatbotClient | null>(null);
  const messages = ref<ChatMessage[]>([]);
  const isLoading = ref(false);
  const isStreaming = ref(false);
  const error = ref<string | null>(null);
  const isConnected = ref(false);

  // Statistics
  const stats = ref<ChatbotStats>({
    messagesSent: 0,
    messagesReceived: 0,
    tokensSent: 0,
    tokensReceived: 0,
    avgResponseTime: 0,
    lastResponseTime: 0,
    errors: 0,
    isStreaming: false,
    streamPosition: 0,
  });

  // Response time tracking
  const responseTimes: number[] = [];
  let currentStreamingMessage: ChatMessage | null = null;
  let textResponse = ref<{ text: string; end: boolean } | null>(null);

  /**
   * Update configuration
   */
  function updateConfig(newConfig: Partial<ChatbotConfig>): void {
    if (wsClient.value) {
      wsClient.value.updateConfig(newConfig);
    } else {
      wsClient.value = new WebSocketChatbotClient({ ...config, ...newConfig });
    }
  }

  /**
   * Get current configuration
   */
  function getConfig(): ChatbotConfig {
    return wsClient.value?.getConfig() || config;
  }

  /**
   * Add a message to the conversation
   */
  function addMessage(role: ChatMessage['role'], content: string, metadata?: Record<string, any>): ChatMessage {
    const message: ChatMessage = {
      id: generateMessageId(),
      role,
      content,
      timestamp: new Date(),
      metadata,
    };
    messages.value.push(message);
    return message;
  }

  /**
   * Clear all messages
   */
  function clearMessages(): void {
    messages.value = [];
    textResponse.value = null;
    currentStreamingMessage = null;
  }

  /**
   * Update statistics
   */
  function updateStats(updates: Partial<ChatbotStats>): void {
    stats.value = { ...stats.value, ...updates };
  }

  /**
   * Record response time
   */
  function recordResponseTime(timeMs: number): void {
    responseTimes.push(timeMs);
    const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    updateStats({
      lastResponseTime: timeMs,
      avgResponseTime: avg,
    });
  }

  /**
   * Initialize WebSocket connection
   */
  async function connect(): Promise<void> {
    if (!config.botId) {
      throw new Error('Bot ID is required for WebSocket connection');
    }

    // If already connected, don't reconnect
    if (wsClient.value?.connected && isConnected.value) {
      console.log('[Chatbot] Already connected, skipping reconnect');
      isLoading.value = false;
      isStreaming.value = false;
      return;
    }

    try {
      error.value = null;
      isLoading.value = true;
      console.log('[Chatbot] Starting connection, isLoading:', isLoading.value);

      if (!wsClient.value) {
        wsClient.value = new WebSocketChatbotClient(config);
      }

      // Create chat session
      const chatData = await wsClient.value.createChat(config.botId!);
      console.log('[Chatbot] Chat session created:', chatData.chatId);
      
      // Store bot info and add welcome message
      if (chatData.bot) {
        (wsClient.value as any).botInfo = chatData.bot;
        // Add welcome message if available
        if (chatData.bot.welcome_message) {
          addMessage('assistant', chatData.bot.welcome_message, {
            welcome: true,
            botId: chatData.bot.id,
          });
        }
      }
      
      // Set up event handlers BEFORE connecting
      wsClient.value.onConnect = () => {
        console.log('[Chatbot] WebSocket connected - clearing loading state');
        isConnected.value = true;
        isLoading.value = false;
        isStreaming.value = false;
        console.log('[Chatbot] State after connect:', { isConnected: isConnected.value, isLoading: isLoading.value, isStreaming: isStreaming.value });
      };

      wsClient.value.onDisconnect = () => {
        console.log('[Chatbot] WebSocket disconnected');
        isConnected.value = false;
        isLoading.value = false;
        isStreaming.value = false;
      };

      wsClient.value.onError = (err) => {
        console.error('[Chatbot] WebSocket error:', err);
        error.value = err instanceof Error ? err.message : String(err);
        stats.value.errors++;
        isLoading.value = false;
        isStreaming.value = false;
      };

      // Connect WebSocket FIRST
      console.log('[Chatbot] Connecting WebSocket...');
      wsClient.value.connect(chatData.chatId);
      
      // Set up message handlers AFTER socket is created (but handlers can be set up anytime)
      wsClient.value.onText((chunk) => {
        console.log('[Chatbot] onText callback triggered with:', chunk);
        handleTextChunk(chunk);
      });
      
      // Also set up direct socket listener as fallback
      setTimeout(() => {
        const socketInstance = (wsClient.value as any).socketInstance;
        if (socketInstance) {
          console.log('[Chatbot] Setting up direct socket listener as fallback');
          // Remove any existing listener to avoid duplicates
          socketInstance.off('text');
          socketInstance.on('text', (data: any) => {
            console.log('[Chatbot] Direct socket.text event (fallback):', data);
            handleTextChunk(data);
          });
        }
      }, 200);

      wsClient.value.onVideo((chunk) => {
        // Handle video chunks if needed
        console.log('Video chunk received:', chunk);
      });

      wsClient.value.onVoice((chunk) => {
        // Handle voice chunks if needed
        console.log('Voice chunk received:', chunk);
      });
      
      // Check if already connected (socket.io might connect immediately)
      // Use multiple checks to catch the connection
      const checkConnection = () => {
        const connected = wsClient.value?.connected ?? false;
        console.log('[Chatbot] Connection check:', { connected, isConnected: isConnected.value, isLoading: isLoading.value });
        
        if (connected) {
          // Socket connected - ensure our state matches
          if (!isConnected.value) {
            console.log('[Chatbot] Socket connected but state not updated - fixing');
            isConnected.value = true;
          }
          // Always clear loading state once connected
          isLoading.value = false;
          isStreaming.value = false;
          console.log('[Chatbot] Loading state cleared');
        } else if (isLoading.value) {
          // Still loading, check again
          setTimeout(checkConnection, 200);
        }
      };
      
      // Start checking immediately and then at intervals
      setTimeout(checkConnection, 100);
      setTimeout(checkConnection, 500);
      setTimeout(checkConnection, 1000);
      setTimeout(checkConnection, 2000);
      
      // Set a timeout to clear loading state if connection takes too long
      setTimeout(() => {
        if (isLoading.value && !isConnected.value) {
          // Connection might have failed silently
          console.warn('[Chatbot] Connection timeout - force clearing loading state');
          isLoading.value = false;
          isStreaming.value = false;
        }
      }, 5000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('[Chatbot] Connection error:', errorMessage);
      error.value = errorMessage;
      stats.value.errors++;
      isLoading.value = false;
      isStreaming.value = false;
      throw err;
    }
  }

  /**
   * Handle text chunks from WebSocket
   */
  function handleTextChunk(chunk: { text?: string; chunk?: string; end?: boolean }): void {
    console.log('[Chatbot] handleTextChunk called with:', chunk);
    
    // Handle different chunk formats
    const chunkText = chunk.chunk || chunk.text || '';
    const isEnd = chunk.end ?? false;
    
    if (!chunkText && !isEnd) {
      console.warn('[Chatbot] Received empty chunk:', chunk);
      return;
    }
    
    if (!textResponse.value) {
      textResponse.value = { text: '', end: false };
      
      // Create streaming message
      currentStreamingMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        streaming: true,
      };
      messages.value.push(currentStreamingMessage);
      isStreaming.value = true;
      isLoading.value = false; // Clear loading when first chunk arrives
      updateStats({ isStreaming: true, streamPosition: 0 });
      console.log('[Chatbot] Created streaming message');
    }

    if (chunkText) {
      textResponse.value.text += chunkText;
      textResponse.value.end = isEnd;

      if (currentStreamingMessage) {
        // Create a new object to trigger reactivity
        const index = messages.value.findIndex(m => m.id === currentStreamingMessage!.id);
        if (index !== -1) {
          messages.value[index] = {
            ...currentStreamingMessage,
            content: textResponse.value.text + (isEnd ? '' : ' ...'),
            streaming: !isEnd,
          };
          currentStreamingMessage = messages.value[index];
        }
        updateStats({ streamPosition: textResponse.value.text.length });
        console.log('[Chatbot] Updated message content, length:', textResponse.value.text.length, 'content:', textResponse.value.text.substring(0, 50));
      }
    }

    if (isEnd) {
      // Mark message as complete
      if (currentStreamingMessage) {
        currentStreamingMessage.streaming = false;
        currentStreamingMessage.content = textResponse.value.text;
        stats.value.messagesReceived++;
        stats.value.tokensReceived += textResponse.value.text.length;
        console.log('[Chatbot] Message complete, final length:', textResponse.value.text.length);
      }
      textResponse.value = null;
      currentStreamingMessage = null;
      isStreaming.value = false;
      isLoading.value = false;
      updateStats({ isStreaming: false });
    }
  }

  /**
   * Send a message via WebSocket
   */
  async function sendMessage(content: string, responseType: 'text' | 'video' | 'voice' = 'text'): Promise<void> {
    if (!content.trim()) return;

    if (!wsClient.value || !isConnected.value) {
      await connect();
    }

    error.value = null;
    // Don't set isLoading for WebSocket sends - it's async and handled by streaming state
    // isLoading.value = true; // Removed - WebSocket is async

    // Add user message
    addMessage('user', content);
    stats.value.messagesSent++;
    stats.value.tokensSent += content.length;

    try {
      wsClient.value!.sendMessage(content, responseType);
      
      // Response will come via WebSocket handlers
      // We don't wait for it here since it's async via WebSocket
      // isStreaming will be set when the first chunk arrives
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      error.value = errorMessage;
      stats.value.errors++;
      isLoading.value = false;
      isStreaming.value = false;
      throw err;
    }
  }

  /**
   * Disconnect from WebSocket
   */
  function disconnect(): void {
    if (wsClient.value) {
      wsClient.value.disconnect();
      isConnected.value = false;
    }
  }

  /**
   * Test connection
   */
  async function testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!config.botId) {
        return { success: false, error: 'Bot ID is required' };
      }

      const testClient = new WebSocketChatbotClient(config);
      const chatData = await testClient.createChat(config.botId);
      testClient.disconnect();
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Reset statistics
   */
  function resetStats(): void {
    stats.value = {
      messagesSent: 0,
      messagesReceived: 0,
      tokensSent: 0,
      tokensReceived: 0,
      avgResponseTime: 0,
      lastResponseTime: 0,
      errors: 0,
      isStreaming: false,
      streamPosition: 0,
    };
    responseTimes.length = 0;
  }

  // Cleanup on unmount
  onUnmounted(() => {
    disconnect();
  });

  const state = computed<ChatbotState>(() => ({
    messages: messages.value,
    isLoading: isLoading.value,
    isStreaming: isStreaming.value,
    error: error.value,
    stats: stats.value,
  }));

  // Get bot info from client
  const botInfo = computed<BotInfo | null>(() => {
    if (!wsClient.value) return null;
    return (wsClient.value as any).botInfo || null;
  });

  return {
    // State
    messages,
    isLoading,
    isStreaming,
    error,
    stats,
    state,
    isConnected,
    botInfo,

    // Methods
    updateConfig,
    getConfig,
    addMessage,
    clearMessages,
    sendMessage,
    connect,
    disconnect,
    testConnection,
    resetStats,
  };
}

