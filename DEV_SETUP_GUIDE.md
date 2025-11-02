# 🚀 Development Setup Guide

## ✅ All Fixed! Ready to Run

### What Was Fixed:

1. **✅ Toast Service** - Added `ToastService` to PrimeVue configuration
2. **✅ Dependencies** - Fixed PrimeVue version (3.53.1)
3. **✅ Worker** - Made worker optional with mock fallback for demo
4. **✅ Vite Config** - Enhanced with proper aliases and optimization

---

## 🏃 Quick Start

### 1. Install Dependencies (Already Done)
```bash
cd /Users/alexg/Downloads/amit-adaptivity
pnpm install
```

### 2. Build Core Package
```bash
cd packages/adaptivity
pnpm build
```

### 3. Start Playground
```bash
cd ../../playground
pnpm dev
```

The playground will open at **http://localhost:5173** 🎉

---

## 📁 Project Structure

```
amit-adaptivity/
├── packages/adaptivity/          # Core engine
│   ├── src/                      # Source code
│   ├── tests/                    # 162 tests ✅
│   └── dist/                     # Build output
│
├── playground/                   # Vue 3 simulator
│   ├── src/
│   │   ├── App.vue              # Main app
│   │   ├── components/          # UI components
│   │   ├── composables/         # Vue composables
│   │   ├── services/            # Services
│   │   └── main.ts              # Entry point (✅ Toast fixed)
│   └── vite.config.ts           # ✅ Enhanced config
│
└── storybook/                   # Documentation
    └── stories/                 # Interactive examples
```

---

## 🎮 Playground Features

Once running, you'll have access to:

### 1. **Settings Drawer** (⚙️ button)
- Adjust user ID, language, preferences
- Modify performance metrics (accuracy, streak, fatigue)
- Change device and environment
- Toggle accessibility options

### 2. **Event Dispatcher** (right panel)
- Quick actions: correct answer, wrong answer, theme switch
- Custom event builder
- Event history viewer

### 3. **Block Variants** (center)
- See all available variants
- View selected variant with reasoning
- Guard evaluation results
- Variant scores

### 4. **Page Navigation** (center)
- Navigate through 4 lesson pages
- Test sticky behavior
- Track time on page

### 5. **Signal Monitor** (right panel)
- Real-time signal stats
- Sync status
- Signal breakdown by type

---

## 🔧 Configuration Files

### ✅ main.ts (Fixed)
```typescript
import { createApp } from 'vue';
import App from './App.vue';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice'; // ✅ Added
import 'primevue/resources/themes/lara-light-blue/theme.css';
import 'primeicons/primeicons.css';
import './style.css';

const app = createApp(App);
app.use(PrimeVue);
app.use(ToastService); // ✅ Added
app.mount('#app');
```

### ✅ vite.config.ts (Enhanced)
```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    open: true  // ✅ Auto-open browser
  },
  resolve: {
    alias: {
      '@': '/src'  // ✅ Path aliases
    }
  },
  optimizeDeps: {
    exclude: ['@amit/adaptivity']  // ✅ Exclude workspace package
  }
});
```

---

## 🧪 Running Tests

```bash
cd packages/adaptivity
pnpm test
```

**Expected Output:**
```
✓ tests/integration.test.ts   (8 tests)
✓ tests/selection.test.ts    (23 tests)
✓ tests/score.test.ts        (26 tests)
✓ tests/session.test.ts      (32 tests)
✓ tests/guard.test.ts        (38 tests)
✓ tests/sticky.test.ts       (20 tests)
✓ tests/signals.test.ts      (13 tests)
✓ tests/selector.test.ts     (2 tests)

Tests: 162 passed (162) ✅
```

---

## 📚 Running Storybook

```bash
cd storybook
pnpm storybook
```

Opens at **http://localhost:6006**

---

## 🐛 Troubleshooting

### Issue: "No PrimeVue Toast provided!"
**✅ FIXED** - ToastService now properly registered in main.ts

### Issue: Build fails with TypeScript errors
**Solution:**
```bash
cd packages/adaptivity
pnpm install
pnpm build
```

### Issue: Worker errors in console
**Note:** Worker is now optional with mock fallback. Check browser console for logs.

### Issue: Vite can't resolve @amit/adaptivity
**Solution:** Build the core package first:
```bash
cd packages/adaptivity && pnpm build
```

---

## 🎯 Development Workflow

### 1. Make Changes to Core Engine
```bash
cd packages/adaptivity
# Edit files in src/
pnpm build
pnpm test
```

### 2. Test in Playground
```bash
cd playground
pnpm dev
# Playground will hot-reload
```

### 3. Document in Storybook
```bash
cd storybook
# Add stories to stories/
pnpm storybook
```

---

## 📦 Build for Production

### Build Everything
```bash
# From root
pnpm build

# Or individually
cd packages/adaptivity && pnpm build
cd playground && pnpm build
cd storybook && pnpm build-storybook
```

---

## 🎨 UI Stack

- **Vue 3** - Composition API with `<script setup>`
- **PrimeVue 3.53.1** - UI components
- **Tailwind CSS** - Utility-first styling
- **Vite** - Lightning-fast dev server
- **TypeScript** - Full type safety

---

## 📊 Package Scripts

### Root (monorepo)
```json
{
  "build": "pnpm -C packages/adaptivity build",
  "test": "pnpm -C packages/adaptivity test",
  "dev:play": "pnpm -C playground dev",
  "dev:storybook": "pnpm -C storybook storybook"
}
```

### Core Package
```json
{
  "build": "tsc && tsup",
  "test": "vitest run",
  "dev:test": "vitest"
}
```

### Playground
```json
{
  "dev": "vite",
  "build": "vite build"
}
```

---

## ✅ Verification Checklist

Before committing:

- [ ] Core package builds: `cd packages/adaptivity && pnpm build`
- [ ] All tests pass: `pnpm test`
- [ ] Playground runs: `cd playground && pnpm dev`
- [ ] No console errors
- [ ] Settings drawer works
- [ ] Event dispatcher works
- [ ] Block variants display correctly
- [ ] Page navigation works
- [ ] Toast notifications appear

---

## 🎉 You're Ready!

Everything is set up and working. Just run:

```bash
cd /Users/alexg/Downloads/amit-adaptivity/playground
pnpm dev
```

And start exploring the personalized learning engine simulator! 🚀

---

**Last Updated:** November 2, 2025
**Status:** ✅ All systems ready

