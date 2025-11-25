/**
 * Core types for @amit/chatbot package
 */

/**
 * Chat message role
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Suggestion action types
 */
export type SuggestionAction =
  | BotCommandAction
  | NavigateAction
  | ResourceAction;

export interface BotCommandAction {
  kind: 'botCommand';
  command: string;
  prompt?: string;
}

export interface NavigateAction {
  kind: 'navigate';
  target: 'lesson' | 'page';
  courseId?: string;
  lessonId?: string;
  pageId?: string;
}

export interface ResourceAction {
  kind: 'resource';
  url: string;
  openIn?: 'same_tab' | 'new_tab';
}

export interface Suggestion {
  label: string;
  action: SuggestionAction;
}

/**
 * Chat message
 */
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  streaming?: boolean;
  suggestions?: Suggestion[];
}

/**
 * UI configuration for chatbot
 */
export interface ChatbotUIConfig {
  /** Whether the UI supports markdown rendering */
  supportsMarkdown?: boolean;
}

/**
 * Chatbot configuration
 */
export interface ChatbotConfig {
  /** API endpoint URL */
  endpoint: string;
  /** Authentication token */
  token?: string;
  /** Additional headers */
  headers?: Record<string, string>;
  /** Request metadata (botId, courseId, lessonId, pageId, sttLang, etc.) */
  meta?: Record<string, any>;
  /** UI configuration */
  ui?: ChatbotUIConfig;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Enable streaming */
  streaming?: boolean;
  /** Use WebSocket instead of HTTP */
  useWebSocket?: boolean;
  /** Bot ID (required for WebSocket) */
  botId?: string;
}

/**
 * Stream chunk from API
 */
export interface StreamChunk {
  content?: string;
  done?: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Chatbot API response
 */
export interface ChatbotResponse {
  content: string;
  metadata?: Record<string, any>;
  error?: string;
}

/**
 * Chatbot statistics
 */
export interface ChatbotStats {
  /** Total messages sent */
  messagesSent: number;
  /** Total messages received */
  messagesReceived: number;
  /** Total tokens sent */
  tokensSent: number;
  /** Total tokens received */
  tokensReceived: number;
  /** Average response time in ms */
  avgResponseTime: number;
  /** Last response time in ms */
  lastResponseTime: number;
  /** Total errors */
  errors: number;
  /** Is currently streaming */
  isStreaming: boolean;
  /** Current stream position */
  streamPosition: number;
}

/**
 * Chatbot state
 */
export interface ChatbotState {
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  stats: ChatbotStats;
}

/**
 * Bot information from startSession
 */
export interface BotInfo {
  name: string;
  supportedResponseTypes: ('text' | 'video' | 'voice')[];
  idleVideo?: string;
  image?: string; // base64 or URL
  welcome_message?: string;
  language?: string;
  id?: string;
}

/**
 * Chat session response
 */
export interface ChatSessionResponse {
  chatId: string;
  bot: BotInfo;
  isResumed?: boolean;
}

