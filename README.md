# Amit Adaptivity - Personalized Learning Platform

> A comprehensive personalized learning experience engine with real-time adaptive content selection, explainable AI decisions, and offline-first signal tracking.

![Platform Overview](https://img.shields.io/badge/TypeScript-100%25-blue)
![Test Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 Vision

Deliver **contextual lesson experiences per learner** through simple, explainable decisions. Students feel more engaged and supported as lessons branch based on mastery, preferences, device context, and real-time performance.

## ✨ Key Features

### 🧠 **Runtime Personalization Engine**
- Runs entirely in the browser for instant decisions
- No API latency - sub-millisecond variant selection
- Context-aware: performance, preferences, device, accessibility needs
- Full TypeScript with comprehensive type safety

### 🎨 **Block Variants (Slots)**
- Any content block can have multiple versions
- Examples: easier/harder, video/text, themed variations
- Seamless swapping based on learner context
- Fallback support for graceful degradation

### 🔍 **Explainable Decisions**
- Every selection includes detailed reasoning
- "Why this variant?" transparency for QA and trust
- Guard evaluation results, scores, and context
- Perfect for teacher dashboards and debugging

### 📡 **Learning Signals**
- All actions and choices logged automatically
- Variant selections, answers, navigation, preferences
- Offline-first with IndexedDB persistence
- Background sync to backend for analytics
- Retry logic with exponential backoff

### 🛡️ **CEL-Based Rules**
- Safe, powerful guard expressions
- Common Expression Language for complex conditions
- Pre-built templates for common scenarios
- Runtime validation and compilation

### ⚡ **Edge-First Architecture**
- Web Worker for background processing
- IndexedDB signal outbox for reliability
- Session state management in worker
- Optimized for low-end devices

## 📦 Monorepo Structure

```
amit-adaptivity/
├── packages/
│   └── adaptivity/          # Core engine library
│       ├── src/
│       │   ├── index.ts          # Main exports
│       │   ├── types.ts          # Type definitions
│       │   ├── select.ts         # Selection algorithm
│       │   ├── guard.ts          # Guard evaluation
│       │   ├── cel-guard.ts      # CEL support
│       │   ├── score.ts          # Scoring system
│       │   ├── session.ts        # Session management
│       │   ├── sticky.ts         # Sticky behavior
│       │   ├── signals.ts        # Signal system
│       │   └── worker/           # Worker implementation
│       │       ├── signal-outbox.ts
│       │       └── session-worker.ts
│       ├── tests/                # Comprehensive tests
│       └── README.md            # Library docs
│
├── playground/              # Vue 3 simulator app
│   ├── src/
│   │   ├── App.vue               # Main simulator
│   │   ├── components/
│   │   │   ├── SettingsDrawer.vue      # Session config
│   │   │   ├── EventDispatcher.vue     # Event simulator
│   │   │   ├── BlockVariant.vue        # Variant display
│   │   │   ├── PageNavigation.vue      # Page system
│   │   │   └── SignalMonitor.vue       # Signal tracking
│   │   ├── composables/
│   │   │   └── useSessionWorker.ts     # Worker integration
│   │   └── services/
│   │       └── mockApi.ts              # API simulation
│   └── README.md
│
└── storybook/              # Interactive documentation
    ├── stories/
    │   ├── AdaptiveSelection.stories.ts
    │   └── CELGuards.stories.ts
    └── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
# Install all dependencies
pnpm install

# Build the core package
pnpm build
```

### Run the Playground

The playground is a **comprehensive simulator** showcasing all engine capabilities:

```bash
# Start the Vue 3 playground
pnpm dev:play
```

Open [http://localhost:5173](http://localhost:5173)

### Features Available in Playground

#### 1. **Settings Drawer**
- Adjust user ID, language, preferences
- Modify performance metrics (accuracy, streak, fatigue)
- Change device and environment settings
- Toggle accessibility options
- See real-time re-evaluation of content

#### 2. **Event Dispatcher**
- Quick actions: correct answer, wrong answer, theme switch
- Custom event builder with JSON payload
- Event history with timestamps
- Visual feedback for all dispatched events

#### 3. **Block Variant Visualization**
- See all available variants for each slot
- View selected variant with full metadata
- Understand "Why this variant?" with detailed explanation
- Guard evaluation results and variant scores
- Re-evaluate selection on demand

#### 4. **Page Navigation**
- Navigate through lesson pages (next/prev)
- Test sticky behavior across pages
- Track time spent on each page
- Visual progress indicator
- Page history tracking

#### 5. **Signal Monitor**
- Real-time signal statistics
- View synced vs. unsynced signals
- Force sync to mock backend
- Signal breakdown by type
- Current session overview

### Run Storybook

Interactive documentation with live examples:

```bash
# Start Storybook
pnpm dev:storybook
```

Open [http://localhost:6006](http://localhost:6006)

#### Available Stories

- **Adaptive Selection**: Basic selection, struggling learner, high performer
- **CEL Guards**: Templates, conditions, complex logic
- **Theme Personalization**: Preference matching
- **Device Adaptation**: Mobile/desktop optimization
- **Guard Failures**: Fallback scenarios

### Run Tests

```bash
# Run all tests with coverage
pnpm test
```

## 🎮 Dual Simulator Interface

The playground includes **two powerful simulators**:

### 1. **Session Simulator** (Route: `/`)
Test adaptive content selection at the page level:
- Adjust session parameters in real-time
- Dispatch learning events
- Watch variants adapt instantly
- Monitor signal tracking
- Test sticky behavior across pages

### 2. **Flow Simulator** (Route: `/flow`) ✨ NEW!
Visualize and simulate complete learning paths:
- **Visual flow graph** with nodes and conditional edges
- **Branching logic** based on track, performance, engagement
- **Student journey simulation** step-by-step
- **Path replay** with decision tracking
- **Rule testing** with configurable context
- Inspired by visual course builders

---

## 🎮 Playground Walkthrough

### Session Simulator

#### Scenario 1: Struggling Learner

1. Open Settings Drawer
2. Set Accuracy to 45%
3. Set Attempts to 8
4. Set Streak to 0
5. Apply Changes

**Result**: Engine automatically selects easier variants with hints

### Scenario 2: Theme Preference

1. Set Preferred Theme to "soccer"
2. Dispatch "Theme Switch" event
3. Observe variant re-evaluation

**Result**: Content switches to soccer-themed variants

### Scenario 3: Device Adaptation

1. Change Device to "mobile"
2. Observe variant changes
3. Note mobile-optimized shorter duration content

**Result**: Mobile-friendly variants selected automatically

### Scenario 4: Sticky Behavior Test

1. Navigate to Page 2
2. Note selected variants
3. Navigate back to Page 1
4. Navigate forward to Page 2 again

**Result**: Same variants retained (sticky behavior)

### Scenario 5: Signal Flow

1. Dispatch multiple events
2. Watch Signal Monitor update
3. Click "Sync now"
4. Observe signals marked as synced

**Result**: Signals flow to IndexedDB and sync to mock API

---

### Flow Simulator ✨ NEW!

#### Scenario 1: Track-Based Branching

1. Open Flow Simulator tab
2. Set Track to "Project" in left sidebar
3. Click "Start Simulation"
4. Click "Step Forward"

**Result**: Student follows project track branch (P1 → P2 → P3a → P4)

#### Scenario 2: Performance-Based Skip

1. Set Track to "Core"
2. Set Accuracy to 90%
3. Start Simulation
4. Step Forward from P2

**Result**: High performer skips optional content (P1 → P2 → P4)

#### Scenario 3: Enrichment Path

1. Set Track to "Enrichment"
2. Set Engagement to 75%
3. Start Simulation
4. Step through path

**Result**: Engaged student gets enrichment content (P1 → P2 → P3b → P4)

#### Scenario 4: Path Replay

1. Complete any simulation
2. View right sidebar
3. See step-by-step journey
4. Click "Export Path"

**Result**: Complete path exported with decisions and statistics

## 🏗️ Architecture

### Selection Algorithm

```
┌─────────────────────────────────────────┐
│ 1. Policy Constraints                    │
│    ↓ Hard constraints from backend      │
├─────────────────────────────────────────┤
│ 2. Overrides                            │
│    ↓ Teacher/system forced choices      │
├─────────────────────────────────────────┤
│ 3. Sticky Check                         │
│    ↓ Previous choice if still valid     │
├─────────────────────────────────────────┤
│ 4. Label Filtering                      │
│    ↓ Language, device, track match      │
├─────────────────────────────────────────┤
│ 5. Guard Evaluation                     │
│    ↓ CEL expression checks              │
├─────────────────────────────────────────┤
│ 6. Scoring                              │
│    ↓ Weighted scoring by context        │
├─────────────────────────────────────────┤
│ 7. Selection                            │
│    → Highest scoring variant            │
└─────────────────────────────────────────┘
```

### Data Flow

```
┌──────────────┐
│  User Action │
└──────┬───────┘
       │
       ↓
┌──────────────┐     ┌──────────────┐
│ Update       │────→│ Re-evaluate  │
│ Session      │     │ Variants     │
└──────────────┘     └──────┬───────┘
                            │
                            ↓
                     ┌──────────────┐
                     │ Log Signal   │
                     └──────┬───────┘
                            │
                            ↓
                     ┌──────────────┐
                     │ IndexedDB    │
                     │ (Outbox)     │
                     └──────┬───────┘
                            │
                            ↓ (Background)
                     ┌──────────────┐
                     │ Sync to API  │
                     └──────────────┘
```

## 📊 Example Use Cases

### 1. Math Lesson - Fractions

```typescript
const slot: Slot = {
  id: 'fraction_intro',
  variants: [
    {
      id: 'easy_video_soccer',
      meta: { difficulty: 'easy', modality: 'video', theme: 'soccer' },
      guard: 'ctx.metrics.accEWMA < 0.7',
      scoreWeights: { preferLowAcc: 0.6, preferThemeMatch: 0.3 },
    },
    {
      id: 'standard_interactive',
      meta: { difficulty: 'std', modality: 'interactive' },
      guard: 'ctx.metrics.accEWMA >= 0.7 && ctx.metrics.accEWMA < 0.9',
    },
    {
      id: 'challenge_simulation',
      meta: { difficulty: 'hard', modality: 'simulation' },
      guard: 'ctx.metrics.accEWMA >= 0.9 && ctx.metrics.streak >= 5',
    },
  ],
};
```

### 2. Reading Comprehension

```typescript
const slot: Slot = {
  id: 'reading_passage',
  variants: [
    {
      id: 'simplified_text',
      meta: { 
        difficulty: 'easy', 
        cognitiveLoad: 'low',
        accessibility: { dyslexicFont: true }
      },
      guard: 'ctx.user.a11y.dyslexicFont === true || ctx.metrics.accEWMA < 0.6',
    },
    {
      id: 'standard_passage',
      meta: { difficulty: 'std', cognitiveLoad: 'med' },
      guard: 'true',
    },
  ],
};
```

### 3. Mobile Optimization

```typescript
const slot: Slot = {
  id: 'science_experiment',
  variants: [
    {
      id: 'mobile_short_video',
      meta: { 
        deviceFit: ['mobile'],
        durationSec: 90,
        modality: 'video'
      },
      guard: 'ctx.env.device === "mobile"',
    },
    {
      id: 'desktop_full_sim',
      meta: { 
        deviceFit: ['desktop'],
        durationSec: 300,
        modality: 'simulation'
      },
      guard: 'ctx.env.device === "desktop"',
    },
  ],
};
```

## 🧪 Testing Philosophy

- **100% Coverage**: All critical paths tested
- **Integration Tests**: Real-world scenarios
- **Edge Cases**: Malformed inputs, empty variants, guard failures
- **Performance**: Benchmarked selection speed
- **Type Safety**: No `any` types in production code

## 🎯 Roadmap

- [x] Core selection engine
- [x] CEL guard support
- [x] Signal system
- [x] Web Worker integration
- [x] IndexedDB persistence
- [x] Vue 3 simulator
- [x] Storybook documentation
- [x] Comprehensive tests
- [ ] Real backend integration
- [ ] A/B testing framework
- [ ] ML-based scoring
- [ ] Teacher analytics dashboard
- [ ] Mobile app (React Native)

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📜 License

MIT © 2024

## 🙏 Acknowledgments

Built with:
- [Vue 3](https://vuejs.org/) - Reactive UI framework
- [PrimeVue](https://primevue.org/) - UI component library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Vite](https://vitejs.dev/) - Build tool
- [Vitest](https://vitest.dev/) - Testing framework
- [Storybook](https://storybook.js.org/) - Component documentation
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Comlink](https://github.com/GoogleChromeLabs/comlink) - Web Worker RPC
- [idb](https://github.com/jakearchibald/idb) - IndexedDB wrapper

---

**Built with ❤️ for personalized learning**
