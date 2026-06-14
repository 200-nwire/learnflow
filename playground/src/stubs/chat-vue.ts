/**
 * Local stub for @amit-org-il/chat-vue (private GitHub Packages dep).
 * Aliased in vite.config so the playground builds token-free; the chatbot
 * views render an inert placeholder instead of the real avatar chat.
 */
import { defineComponent, h, type Plugin } from 'vue';

const placeholder = (name: string) =>
  defineComponent({
    name,
    setup: () => () =>
      h(
        'div',
        {
          style:
            'padding:16px;border:1px dashed #cbd5e1;border-radius:10px;color:#94a3b8;' +
            'font:13px/1.4 system-ui,sans-serif;text-align:center;background:#f8fafc',
        },
        'Chat is unavailable in this build',
      ),
  });

export const AvatarChat = placeholder('AvatarChat');
export const ChatBubble = placeholder('ChatBubble');
export const AmitChatPlugin: Plugin = { install() { /* no-op */ } };

export default { AvatarChat, ChatBubble, AmitChatPlugin };
