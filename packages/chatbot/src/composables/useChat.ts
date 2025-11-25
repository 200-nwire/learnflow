/**
 * Unified chat composable - transport agnostic
 * This is the core chat interface that works with any transport layer
 */

import { ref, computed } from 'vue';
import type { ChatMessage, ChatbotStats } from '../types.js';

/**
 * Generate unique message ID
 */
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Transport interface - any transport must implement this
 */
export interface ChatTransport {
  sendMessage(message: string, responseType?: 'text' | 'video' | 'voice'): Promise<void> | void;
  connect?(): Promise<void> | void;
  disconnect?(): void;
  testConnection?(): Promise<{ success: boolean; error?: string }>;
  onMessage?: (handler: (message: string, metadata?: Record<string, any>) => void) => void;
  onStreamChunk?: (handler: (chunk: string, end: boolean, suggestions?: import('../types.js').Suggestion[]) => void) => void;
  onError?: (handler: (error: Error) => void) => void;
}

/**
 * useChat - Transport-agnostic chat composable
 * This is the core interface - transport is injected
 */
export function useChat(transport?: ChatTransport) {
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
  let currentStreamingMessage: ChatMessage | null = null;
  let streamBuffer = ''; // Accumulated text buffer (like textResponse.value.text in original)
  let messageStartTime: number | null = null; // Track when user message was sent

  /**
   * Add a message directly (for simulation or manual injection)
   */
  function addMessage(role: ChatMessage['role'], content: string, metadata?: Record<string, any>, suggestions?: import('../types.js').Suggestion[]): ChatMessage {
    const message: ChatMessage = {
      id: generateMessageId(),
      role,
      content,
      timestamp: new Date(),
      metadata,
      suggestions: suggestions && suggestions.length > 0 ? suggestions : undefined,
    };
    console.log('[useChat] addMessage called:', {
      role,
      contentLength: content.length,
      hasSuggestions: !!(suggestions && suggestions.length > 0),
      suggestionsCount: suggestions?.length || 0,
      messageSuggestions: message.suggestions?.length || 0,
    });
    messages.value.push(message);
    
    if (role === 'assistant') {
      stats.value.messagesReceived++;
      stats.value.tokensReceived += content.length;
      
      // Record response time if we have a start time (for non-streaming messages)
      if (messageStartTime !== null) {
        const responseTime = Date.now() - messageStartTime;
        recordResponseTime(responseTime);
        messageStartTime = null; // Reset after recording
      }
    }
    
    return message;
  }

  /**
   * Start streaming a message (for chunk-by-chunk updates)
   */
  function startStreamingMessage(metadata?: Record<string, any>): ChatMessage {
    currentStreamingMessage = {
      id: generateMessageId(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      streaming: true,
      metadata,
    };
    messages.value.push(currentStreamingMessage);
    isStreaming.value = true;
    streamBuffer = '';
    stats.value.isStreaming = true;
    stats.value.messagesReceived++;
    return currentStreamingMessage;
  }

  /**
   * Append chunk to streaming message
   * Handles both incremental (new text only) and cumulative (full text so far) chunks
   */
  function appendStreamChunk(chunk: string): void {
    // Skip null/undefined chunks
    if (chunk === undefined || chunk === null) {
      return;
    }
    
    // Initialize streaming message if needed
    if (!currentStreamingMessage) {
      console.log('[useChat] Starting new streaming message');
      startStreamingMessage();
    }
    
    // Detect if chunk is cumulative (contains full text so far) or incremental (new text only)
    // If chunk starts with current buffer, it's cumulative - replace buffer
    // Otherwise, it's incremental - append to buffer
    if (chunk && chunk.length > 0) {
      if (streamBuffer.length > 0 && chunk.startsWith(streamBuffer)) {
        // Cumulative chunk - replace buffer with new chunk
        const previousLength = streamBuffer.length;
        streamBuffer = chunk;
        const newContentLength = streamBuffer.length - previousLength;
        console.log('[useChat] Cumulative chunk detected - replaced buffer. Previous:', previousLength, 'New:', streamBuffer.length, 'Added:', newContentLength);
        // Only count new content for tokens
        if (newContentLength > 0) {
          stats.value.tokensReceived += newContentLength;
        }
      } else if (streamBuffer.length > 0 && streamBuffer.endsWith(chunk)) {
        // Chunk is duplicate of buffer end - skip it
        console.log('[useChat] Duplicate chunk detected - skipping:', JSON.stringify(chunk).substring(0, 30));
        return;
      } else {
        // Incremental chunk - append to buffer
        streamBuffer += chunk;
        console.log('[useChat] Incremental chunk - appended. Chunk:', JSON.stringify(chunk).substring(0, 50), 'Buffer length:', streamBuffer.length);
        stats.value.tokensReceived += chunk.length;
      }
    }
    
    // Update message content with accumulated buffer
    if (currentStreamingMessage) {
      const index = messages.value.findIndex(m => m.id === currentStreamingMessage!.id);
      if (index !== -1) {
        // Create new message object to ensure reactivity
        const updatedMessage = {
          ...currentStreamingMessage,
          content: streamBuffer, // Use accumulated buffer
          streaming: true,
        };
        messages.value[index] = updatedMessage;
        currentStreamingMessage = updatedMessage;
      } else {
        console.warn('[useChat] Could not find streaming message in array');
      }
      stats.value.streamPosition = streamBuffer.length;
    }
  }

  /**
   * End streaming message
   */
  function endStreamingMessage(suggestions?: import('../types.js').Suggestion[]): void {
    console.log('[useChat] endStreamingMessage called:', {
      hasCurrentMessage: !!currentStreamingMessage,
      hasSuggestions: !!(suggestions && suggestions.length > 0),
      suggestionsCount: suggestions?.length || 0,
    });
    if (currentStreamingMessage) {
      // Find the message in the array and update it
      const index = messages.value.findIndex(m => m.id === currentStreamingMessage!.id);
      if (index !== -1) {
        const updatedMessage = {
          ...currentStreamingMessage,
          content: streamBuffer,
          streaming: false,
          suggestions: suggestions && suggestions.length > 0 ? suggestions : undefined,
        };
        console.log('[useChat] Updating message at index', index, 'with suggestions:', updatedMessage.suggestions?.length || 0);
        messages.value[index] = updatedMessage;
        console.log('[useChat] Message after update:', messages.value[index]);
      }
      stats.value.messagesReceived++;
      stats.value.tokensReceived += streamBuffer.length;
      
      // Record response time if we have a start time
      if (messageStartTime !== null) {
        const responseTime = Date.now() - messageStartTime;
        recordResponseTime(responseTime);
        messageStartTime = null; // Reset after recording
      }
      
      currentStreamingMessage = null;
      streamBuffer = '';
    }
    isStreaming.value = false;
    stats.value.isStreaming = false;
    stats.value.streamPosition = 0;
    isLoading.value = false;
  }

  /**
   * Send a message via transport (or directly if no transport)
   */
  async function sendMessage(content: string, responseType: 'text' | 'video' | 'voice' = 'text'): Promise<void> {
    if (!content.trim()) return;

    // Add user message
    const userMessage = addMessage('user', content);
    stats.value.messagesSent++;
    stats.value.tokensSent += content.length;

    // Record start time for response time tracking
    messageStartTime = Date.now();

    // If transport is available, use it
    if (transport) {
      try {
        isLoading.value = true;
        error.value = null;

        // Send via transport
        // Handlers are already set up in setTransport()
        await transport.sendMessage(content, responseType);
        
        // Note: Response will come via onMessage or onStreamChunk handlers
        // which are set up in setTransport()
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        error.value = errorMessage;
        stats.value.errors++;
        isLoading.value = false;
        throw err;
      }
      // Don't set isLoading to false here - let handlers do it when response arrives
    } else {
      // No transport - just add user message (for simulation)
      isLoading.value = false;
    }
  }

  /**
   * Simulate a response (for testing without transport)
   */
  function simulateResponse(content: string, streaming: boolean = false, metadata?: Record<string, any>, suggestions?: import('../types.js').Suggestion[]): void {
    // Make sure we're not in a streaming state from a previous message
    if (currentStreamingMessage) {
      endStreamingMessage();
    }
    
    if (streaming) {
      startStreamingMessage(metadata);
      // Simulate streaming by chunks
      let index = 0;
      const interval = setInterval(() => {
        if (index < content.length) {
          appendStreamChunk(content[index]);
          index++;
        } else {
          clearInterval(interval);
          endStreamingMessage(suggestions);
        }
      }, 20); // 20ms per character
    } else {
      addMessage('assistant', content, metadata, suggestions);
    }
  }

  /**
   * Clear all messages
   */
  function clearMessages(): void {
    messages.value = [];
    currentStreamingMessage = null;
    streamBuffer = '';
    isStreaming.value = false;
    messageStartTime = null; // Reset start time
  }

  /**
   * Record response time
   */
  function recordResponseTime(timeMs: number): void {
    responseTimes.push(timeMs);
    const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    stats.value.lastResponseTime = timeMs;
    stats.value.avgResponseTime = avg;
  }

  /**
   * Update statistics
   */
  function updateStats(updates: Partial<ChatbotStats>): void {
    stats.value = { ...stats.value, ...updates };
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

  /**
   * Set transport (can be changed at runtime)
   */
  function setTransport(newTransport: ChatTransport | undefined): void {
    // Clean up old transport handlers if needed
    // Set new transport
    // @ts-ignore
    transport = newTransport;
    
    // Set up handlers for new transport
    if (newTransport) {
        if (newTransport.onStreamChunk) {
          newTransport.onStreamChunk((chunk: string, end: boolean, suggestions?: import('../types.js').Suggestion[]) => {
            if (!end && chunk) {
              if (!currentStreamingMessage) {
                startStreamingMessage();
              }
              appendStreamChunk(chunk);
              isLoading.value = false; // Clear loading when first chunk arrives
            } else if (end) {
              endStreamingMessage(suggestions);
              isLoading.value = false;
            }
          });
        }
      
      if (newTransport.onMessage) {
        newTransport.onMessage((message: string, metadata?: Record<string, any>) => {
          addMessage('assistant', message, metadata);
          isLoading.value = false;
        });
      }
      
      if (newTransport.onError) {
        newTransport.onError((err: Error) => {
          error.value = err.message;
          stats.value.errors++;
          isLoading.value = false;
        });
      }
    }
  }

  return {
    // State
    messages,
    isLoading,
    isStreaming,
    error,
    stats,

    // Methods
    addMessage,
    sendMessage,
    simulateResponse,
    startStreamingMessage,
    appendStreamChunk,
    endStreamingMessage,
    clearMessages,
    resetStats,
    updateStats,
    setTransport,
  };
}

