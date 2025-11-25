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

// Types
export type * from './types.js';

// Note: Components are exported separately via the "./components" export path
// Import them like: import { ChatMessage } from '@amit/chatbot/components'

