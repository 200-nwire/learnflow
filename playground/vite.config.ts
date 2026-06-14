import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [
    vue(),
    // Plugin to redirect talkinghead.mjs imports to CDN
    {
      name: 'redirect-talkinghead',
      resolveId(id, importer) {
        // Redirect any talkinghead.mjs imports (from any path) to the CDN
        if (
          id.includes('talkinghead.mjs') || 
          id.endsWith('talkinghead') ||
          id.includes('/talkinghead') ||
          (importer && importer.includes('chat-vue') && id.includes('talkinghead'))
        ) {
          return {
            id: 'https://cdn.jsdelivr.net/gh/amit-org-il/public@main/modules/talkinghead.mjs',
            external: true
          };
        }
        return null;
      },
      load(id) {
        // If Vite tries to load talkinghead from node_modules, redirect to CDN
        if (id.includes('talkinghead.mjs') || id.includes('/talkinghead')) {
          return {
            code: `export * from 'https://cdn.jsdelivr.net/gh/amit-org-il/public@main/modules/talkinghead.mjs';`,
            moduleSideEffects: false
          };
        }
        return null;
      }
    }
  ],
  server: {
    port: 5173,
    open: true
  },
  resolve: {
    alias: {
      // Stub the private @amit-org-il/chat-vue so the playground builds token-free.
      // (style.css must precede the package alias so the more specific id wins.)
      '@amit-org-il/chat-vue/style.css': path.resolve(__dirname, './src/stubs/chat-vue.css'),
      '@amit-org-il/chat-vue': path.resolve(__dirname, './src/stubs/chat-vue.ts'),
      '@': path.resolve(__dirname, './src'),
      '@amit/rules-builder': path.resolve(__dirname, '../packages/rules-builder/src'),
      '@amit/chatbot/vue': path.resolve(__dirname, '../packages/chatbot/src/vue.ts'),
      '@amit/chatbot': path.resolve(__dirname, '../packages/chatbot/src'),
      '@amit/copilot/vue': path.resolve(__dirname, '../packages/copilot/src/vue.ts'),
      '@amit/copilot': path.resolve(__dirname, '../packages/copilot/src'),
    }
  },
  optimizeDeps: {
    exclude: [
      '@amit/rules-builder',
      '@amit/chatbot',
      '@amit/copilot',
      'talkinghead.mjs',
      'elkjs' // Exclude elkjs from optimization to avoid web-worker dependency issue
    ],
    include: ['vue-renderer-markdown']
  },
  build: {
    rollupOptions: {
      external: (id) => {
        // Mark talkinghead.mjs as external so it's not bundled
        if (id.includes('talkinghead.mjs') || 
            id === 'https://cdn.jsdelivr.net/gh/amit-org-il/public@main/modules/talkinghead.mjs') {
          return true;
        }
        // Mark web-worker as external (for elkjs - not needed for browser)
        if (id === 'web-worker') {
          return true;
        }
        return false;
      }
    }
  }
});
