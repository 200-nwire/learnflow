/**
 * useChatbot composable
 * Main composable for chatbot functionality
 */

import { ref, computed, type Ref } from 'vue';
import { ChatbotAPIClient } from '../api/client.js';
import type {
  ChatbotConfig,
  ChatMessage,
  ChatbotState,
  ChatbotStats,
  StreamChunk,
} from '../types.js';

/**
 * Generate unique message ID
 */
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * useChatbot composable
 */
export function useChatbot(config: ChatbotConfig) {
  const client = ref<ChatbotAPIClient>(new ChatbotAPIClient(config));
  const messages = ref<ChatMessage[]>([]);
  const isLoading = ref(false);
  const isStreaming = ref(false);
  const error = ref<string | null>(null);

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

  /**
   * Update configuration
   */
  function updateConfig(newConfig: Partial<ChatbotConfig>): void {
    client.value.updateConfig(newConfig);
  }

  /**
   * Get current configuration
   */
  function getConfig(): ChatbotConfig {
    return client.value.getConfig();
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
   * Send a message (non-streaming)
   */
  async function sendMessage(content: string): Promise<void> {
    if (!content.trim()) return;

    error.value = null;
    isLoading.value = true;

    // Add user message
    const userMessage = addMessage('user', content);
    stats.value.messagesSent++;
    stats.value.tokensSent += content.length; // Rough estimate

    const startTime = Date.now();

    try {
      const conversationHistory = messages.value
        .filter((m) => !m.streaming)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const response = await client.value.sendMessage(content, conversationHistory);

      const responseTime = Date.now() - startTime;
      recordResponseTime(responseTime);

      // Add assistant response
      addMessage('assistant', response.content, response.metadata);
      stats.value.messagesReceived++;
      stats.value.tokensReceived += response.content.length; // Rough estimate
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      error.value = errorMessage;
      stats.value.errors++;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Send a message with streaming response
   */
  async function streamMessage(content: string): Promise<void> {
    if (!content.trim()) return;

    error.value = null;
    isStreaming.value = true;
    isLoading.value = true;

    // Add user message
    const userMessage = addMessage('user', content);
    stats.value.messagesSent++;
    stats.value.tokensSent += content.length; // Rough estimate

    // Create streaming assistant message
    const assistantMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      streaming: true,
    };
    messages.value.push(assistantMessage);

    const startTime = Date.now();
    let streamContent = '';

    try {
      const conversationHistory = messages.value
        .filter((m) => !m.streaming && m.id !== assistantMessage.id)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      updateStats({ isStreaming: true, streamPosition: 0 });

      for await (const chunk of client.value.streamMessage(content, conversationHistory)) {
        if (chunk.error) {
          error.value = chunk.error;
          stats.value.errors++;
          break;
        }

        if (chunk.content) {
          streamContent += chunk.content;
          assistantMessage.content = streamContent;
          updateStats({ streamPosition: streamContent.length });
        }

        if (chunk.done) {
          break;
        }
      }

      const responseTime = Date.now() - startTime;
      recordResponseTime(responseTime);

      // Mark message as complete
      assistantMessage.streaming = false;
      stats.value.messagesReceived++;
      stats.value.tokensReceived += streamContent.length;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      error.value = errorMessage;
      stats.value.errors++;
      // Remove incomplete message on error
      const index = messages.value.findIndex((m) => m.id === assistantMessage.id);
      if (index !== -1) {
        messages.value.splice(index, 1);
      }
      throw err;
    } finally {
      isStreaming.value = false;
      isLoading.value = false;
      updateStats({ isStreaming: false });
    }
  }

  /**
   * Test API connection
   */
  async function testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await client.value.testConnection();
      if (!result.success) {
        error.value = result.error || 'Connection failed';
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      error.value = errorMessage;
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

  const state = computed<ChatbotState>(() => ({
    messages: messages.value,
    isLoading: isLoading.value,
    isStreaming: isStreaming.value,
    error: error.value,
    stats: stats.value,
  }));

  return {
    // State
    messages,
    isLoading,
    isStreaming,
    error,
    stats,
    state,

    // Methods
    updateConfig,
    getConfig,
    addMessage,
    clearMessages,
    sendMessage,
    streamMessage,
    testConnection,
    resetStats,
  };
}

