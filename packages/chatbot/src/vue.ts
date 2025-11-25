/**
 * Vue composables and components for @amit/chatbot
 */

// Core chat interface (transport-agnostic)
export { useChat } from './composables/useChat.js';
export type { ChatTransport } from './composables/useChat.js';

// Transport implementations
export { HTTPTransport, WebSocketTransport, SimulationTransport } from './composables/transports/index.js';

// Legacy composables (for backward compatibility)
export { useChatbot } from './composables/useChatbot.js';
export { useChatbotWebSocket } from './composables/useChatbotWebSocket.js';

// Components
export { ChatMessage, ChatInput, ChatContainer, ChatbotStats, FloatingChatbot } from './components/index.js';

// Types
export type * from './types.js';

