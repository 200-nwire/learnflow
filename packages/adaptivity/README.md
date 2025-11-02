# @amit/adaptivity

> Runtime personalization engine for contextual learning experiences

A powerful, flexible engine for delivering adaptive learning content that responds to student performance, preferences, and context in real-time. All decisions are explainable, logged, and optimized for edge deployment.

## 🌟 Features

- **🎯 Context-Aware Selection**: Adapts content based on performance, preferences, device, and more
- **🔒 Sticky Sessions**: Maintains consistency across lesson/course scope
- **🛡️ CEL Guards**: Safe, powerful content gating with Common Expression Language
- **📊 Explainable Decisions**: Every selection includes detailed reasoning
- **📡 Signal System**: Comprehensive event tracking with offline-first persistence
- **⚡ Edge-First**: Runs entirely in the browser with Web Worker support
- **🔄 IndexedDB Outbox**: Reliable signal syncing with retry logic
- **🎨 TypeScript Native**: Full type safety and excellent DX

## 📦 Installation

```bash
pnpm add @amit/adaptivity
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { createSnapshot, selectVariant, type Slot, type Policy } from '@amit/adaptivity';

// Create a session snapshot
const session = createSnapshot({
  ids: { 
    userId: 'student_123', 
    courseId: 'math_101', 
    lessonId: 'fractions', 
    pageId: 'intro' 
  },
  user: { 
    lang: 'en',
    preferences: { 
      theme: { value: 'soccer', source: 'student' } 
    }
  },
  metrics: { 
    accEWMA: 0.75,  // 75% accuracy
    streak: 3,       // 3 correct in a row
    attempts: 10 
  },
});

// Define content variants
const slot: Slot = {
  id: 'intro_video',
  variants: [
    {
      id: 'easy_soccer_theme',
      meta: { 
        difficulty: 'easy', 
        theme: 'soccer',
        modality: 'video' 
      },
      guard: 'ctx.metrics.accEWMA < 0.7',
      scoreWeights: { 
        preferLowAcc: 0.6, 
        preferThemeMatch: 0.3 
      },
    },
    {
      id: 'standard_content',
      meta: { difficulty: 'std', modality: 'reading' },
      guard: 'ctx.metrics.accEWMA >= 0.7',
    },
  ],
  fallbackVariantId: 'standard_content',
};

// Policy version for tracking
const policy: Policy = { version: 'v1.0.0' };

// Select the best variant
const result = selectVariant(slot, session, policy, { trace: true });

console.log(result.variantId);  // 'standard_content'
console.log(result.why);        // Detailed explanation
```

## 📚 Core Concepts

### Session Snapshot

The `SessionSnapshot` contains all context needed for adaptive decisions:

```typescript
type SessionSnapshot = {
  ids: {
    userId: string;
    courseId: string;
    lessonId: string;
    pageId: string;
  };
  user: {
    lang: 'he' | 'en';
    preferences?: {
      theme?: { value: string; source: 'student' | 'system' };
      modalityBias?: { value: 'video' | 'reading' | 'interactive' };
    };
    a11y?: {
      captions: boolean;
      transcript: boolean;
      dyslexicFont?: boolean;
    };
  };
  env: {
    device: 'mobile' | 'desktop' | 'tablet';
    online: boolean;
    netType?: 'slow-2g' | '2g' | '3g' | '4g' | 'wifi';
  };
  metrics: {
    accEWMA: number;      // Exponentially weighted moving average accuracy (0-1)
    latencyEWMA: number;  // Response time in ms
    streak: number;       // Consecutive correct answers
    fatigue: number;      // 0-1, higher = more tired
    attempts: number;     // Total attempts in session
  };
  sticky: Record<SlotId, StickyRecord>;
  overrides?: Overrides;
};
```

### Variants & Slots

A **Slot** represents a content block with multiple **Variants** (different versions):

```typescript
type Variant = {
  id: string;
  meta: {
    difficulty?: 'easy' | 'std' | 'hard';
    modality?: 'video' | 'quiz' | 'reading' | 'interactive';
    theme?: string;
    language?: 'he' | 'en';
    deviceFit?: Array<'mobile' | 'desktop' | 'tablet'>;
    cognitiveLoad?: 'low' | 'med' | 'high';
  };
  guard?: string;  // CEL expression
  scoreWeights?: {
    preferLowAcc?: number;
    preferThemeMatch?: number;
    preferModality?: Record<string, number>;
  };
  sticky?: {
    scope?: 'session' | 'lesson' | 'course';
    strength?: 'weak' | 'strong';
  };
};
```

### Selection Process

The engine follows this priority order:

1. **Policy Constraints**: Hard constraints from backend
2. **Overrides**: Teacher/system forced choices
3. **Sticky**: Previously selected variants (if still valid)
4. **Label Filtering**: Quick filters (language, device, track)
5. **Guard Evaluation**: CEL expressions
6. **Scoring**: Weighted scoring based on context
7. **Fallback**: Default variant if needed

## 🛡️ CEL Guards

Guards use Common Expression Language for safe, powerful conditions:

```typescript
import { CEL_TEMPLATES } from '@amit/adaptivity';

// Pre-built templates
const lowAccuracyGuard = CEL_TEMPLATES.lowAccuracy;  
// 'ctx.metrics.accEWMA < 0.7'

const onStreakGuard = CEL_TEMPLATES.onStreak;  
// 'ctx.metrics.streak >= 3'

const strugglingMobile = CEL_TEMPLATES.strugglingMobileUser;  
// 'ctx.metrics.accEWMA < 0.6 && ctx.env.device == "mobile"'

// Custom guards
const customGuard = `
  ctx.metrics.accEWMA > 0.85 && 
  ctx.metrics.streak >= 5 && 
  ctx.env.device === "desktop"
`;

// Validate guard syntax
import { validateCelExpression } from '@amit/adaptivity';
const validation = validateCelExpression(customGuard);
if (!validation.valid) {
  console.error(validation.error);
}
```

### Available Context in Guards

```typescript
ctx.metrics.accEWMA       // 0-1 accuracy
ctx.metrics.attempts      // Total attempts
ctx.metrics.streak        // Current streak
ctx.metrics.fatigue       // 0-1 fatigue level

ctx.user.lang            // 'he' | 'en'
ctx.user.preferences.theme.value
ctx.user.a11y.captions

ctx.env.device           // 'mobile' | 'desktop' | 'tablet'
ctx.env.online           // boolean
ctx.env.netType          // 'wifi' | '4g' | etc

ctx.ids.userId
ctx.ids.courseId
ctx.ids.lessonId

slotId                   // Current slot ID
variant.id               // Variant being evaluated
variant.meta.difficulty  // 'easy' | 'std' | 'hard'
```

## 📊 Scoring System

Variants are scored based on learner context:

```typescript
{
  id: 'adaptive_variant',
  meta: { 
    difficulty: 'easy', 
    theme: 'soccer',
    modality: 'video'
  },
  scoreWeights: {
    preferLowAcc: 0.6,        // Boost for low-accuracy learners
    preferThemeMatch: 0.3,    // Boost for theme match
    preferModality: {          // Boost by modality
      video: 0.4,
      interactive: 0.2
    }
  }
}
```

The highest-scoring variant that passes guards is selected.

## 🔒 Sticky Behavior

Sticky choices maintain consistency across a scope:

```typescript
{
  id: 'consistent_theme',
  meta: { theme: 'soccer' },
  sticky: {
    scope: 'lesson',      // 'session' | 'lesson' | 'course'
    strength: 'strong',   // 'weak' | 'strong'
  }
}
```

- **Session**: Lasts until browser refresh
- **Lesson**: Persists across lesson pages
- **Course**: Persists across entire course
- **Weak**: Can be overridden by better matches
- **Strong**: Always retained in scope

## 📡 Signal System

Track all learning events for analytics:

```typescript
import { SignalFactory, SignalBuffer } from '@amit/adaptivity';

const factory = new SignalFactory();
const buffer = new SignalBuffer(100);  // Max 100 signals

// Variant selection
const selectionSignal = factory.createVariantSelectedSignal(
  session,
  result,
  alternatives
);
buffer.push(selectionSignal);

// Answer submission
const answerSignal = factory.createAnswerSubmittedSignal(
  session,
  'quiz_slot',
  'easy_variant',
  'question_1',
  true,        // correct
  2500,        // time taken (ms)
  1,           // attempts
  { answer: 'A' }
);
buffer.push(answerSignal);

// Page navigation
const navSignal = factory.createPageNavigatedSignal(
  session,
  'page_1',
  'page_2',
  'next',
  15000  // time on page (ms)
);
buffer.push(navSignal);

// Get stats
const stats = buffer.getSummary();
console.log(stats);
// { total: 3, synced: 0, unsynced: 3, byType: {...} }
```

## 🔧 Session Updates

Update session metrics as learners progress:

```typescript
import { updateAccuracyEWMA, setPreferenceTheme, bumpIdle } from '@amit/adaptivity';

// After correct answer
updateAccuracyEWMA(session, true);
// Updates: accEWMA ↑, streak ↑, attempts ↑

// After wrong answer
updateAccuracyEWMA(session, false);
// Updates: accEWMA ↓, streak = 0, attempts ↑

// Set theme preference
setPreferenceTheme(session, 'soccer', 'student');

// Track idle time
bumpIdle(session, 30);  // 30 seconds idle
```

## 🌐 Web Worker Integration

Offload signal management to a worker:

```typescript
import { useSessionWorker } from './composables/useSessionWorker';

const { 
  isReady, 
  updateSession, 
  logSignal, 
  syncSignals, 
  getStats 
} = useSessionWorker();

// Initialize worker
await updateSession(session);

// Log signals in background
await logSignal(signal);

// Periodic sync
setInterval(async () => {
  const result = await syncSignals();
  console.log(`Synced ${result.synced} signals`);
}, 5000);

// Get worker stats
const stats = await getStats();
console.log(stats.outbox.unsynced);
```

## 🎮 Complete Example

```typescript
import { 
  createSnapshot, 
  selectVariant,
  updateAccuracyEWMA,
  SignalFactory,
  CEL_TEMPLATES,
  type Slot,
  type Policy 
} from '@amit/adaptivity';

// Initialize
const session = createSnapshot({
  ids: { userId: 'u1', courseId: 'math', lessonId: 'fractions', pageId: 'p1' },
  metrics: { accEWMA: 0.6, streak: 0, attempts: 3, latencyEWMA: 2000, idleSec: 0, fatigue: 0 },
});

const factory = new SignalFactory();
const policy: Policy = { version: 'v1.0' };

// Define adaptive content
const slot: Slot = {
  id: 'practice_problems',
  variants: [
    {
      id: 'easy_with_hints',
      meta: { difficulty: 'easy', modality: 'quiz', theme: 'soccer' },
      guard: CEL_TEMPLATES.lowAccuracy,
      scoreWeights: { preferLowAcc: 0.8, preferThemeMatch: 0.3 },
      sticky: { scope: 'lesson', strength: 'weak' },
    },
    {
      id: 'standard_practice',
      meta: { difficulty: 'std', modality: 'quiz' },
      guard: 'ctx.metrics.accEWMA >= 0.7',
    },
    {
      id: 'challenge_mode',
      meta: { difficulty: 'hard', modality: 'quiz' },
      guard: CEL_TEMPLATES.highAccuracy,
    },
  ],
  fallbackVariantId: 'standard_practice',
};

// Select variant
const result = selectVariant(slot, session, policy, { trace: true });
console.log(`Selected: ${result.variantId}`);  // 'easy_with_hints'

// Log the selection
const signal = factory.createVariantSelectedSignal(session, result, [
  { variantId: 'easy_with_hints', score: 0.95, guardPassed: true },
  { variantId: 'standard_practice', score: 0.2, guardPassed: false },
]);

// Student answers correctly
updateAccuracyEWMA(session, true);
console.log(`New accuracy: ${(session.metrics.accEWMA * 100).toFixed(0)}%`);

// Re-evaluate (might upgrade difficulty)
const result2 = selectVariant(slot, session, policy);
console.log(`Re-selected: ${result2.variantId}`);
```

## 🎨 Vue Integration

Full Vue 3 simulator with PrimeVue components included in the monorepo:

```bash
cd playground
pnpm dev
```

Features:
- **Settings Drawer**: Adjust session parameters in real-time
- **Event Dispatcher**: Simulate learning events
- **Block Visualization**: See all variants and selection reasoning
- **Page Navigation**: Test sticky behavior across pages
- **Signal Monitor**: Watch signals flow to IndexedDB and sync

## 📖 Storybook

Interactive documentation with live examples:

```bash
cd storybook
pnpm storybook
```

Stories include:
- Basic adaptive selection
- Struggling learner adaptation
- High performer challenges
- Theme personalization
- Device adaptation
- CEL guard demonstrations
- Complex multi-criteria scenarios

## 🧪 Testing

Comprehensive test coverage:

```bash
cd packages/adaptivity
pnpm test
```

Tests cover:
- Selection logic
- Guard evaluation
- Scoring system
- Sticky behavior
- Session updates
- Signal creation
- Edge cases
- Integration scenarios

## 🏗️ Architecture

```
┌─────────────┐
│   Browser   │
├─────────────┤
│ Vue App     │  ← User interaction
│ ├─Settings  │
│ ├─Events    │
│ └─Blocks    │
├─────────────┤
│ Engine      │  ← Selection logic
│ ├─Guards    │
│ ├─Scoring   │
│ └─Sticky    │
├─────────────┤
│ Worker      │  ← Background processing
│ ├─IndexedDB │
│ └─Sync      │
└─────────────┘
      ↓
   Backend API  ← Analytics & policy
```

## 🎯 Use Cases

### 1. Struggling Learner Support

```typescript
// Detect struggling and provide scaffolding
{
  id: 'remedial_with_hints',
  meta: { difficulty: 'easy', cognitiveLoad: 'low' },
  guard: 'ctx.metrics.attempts > 3 && ctx.metrics.streak === 0',
  scoreWeights: { preferLowAcc: 0.9 }
}
```

### 2. Challenge High Performers

```typescript
// Keep top students engaged
{
  id: 'advanced_challenge',
  meta: { difficulty: 'hard', cognitiveLoad: 'high' },
  guard: 'ctx.metrics.accEWMA > 0.9 && ctx.metrics.streak >= 5',
}
```

### 3. Personalize Themes

```typescript
// Match student interests
{
  id: 'soccer_themed',
  meta: { theme: 'soccer' },
  scoreWeights: { preferThemeMatch: 0.8 },
  sticky: { scope: 'course', strength: 'strong' }
}
```

### 4. Mobile Optimization

```typescript
// Adapt to device constraints
{
  id: 'mobile_short_form',
  meta: { 
    deviceFit: ['mobile'], 
    durationSec: 60,
    modality: 'interactive' 
  },
  guard: 'ctx.env.device === "mobile"'
}
```

### 5. Accessibility Support

```typescript
// Ensure accessible content
{
  id: 'captioned_video',
  meta: { 
    modality: 'video',
    accessibility: { captions: true, transcript: true }
  },
  guard: 'ctx.user.a11y.captions === true'
}
```

## 📜 License

MIT

## 🤝 Contributing

Issues and PRs welcome!

## 🔗 Links

- [Playground Demo](http://localhost:5173)
- [Storybook](http://localhost:6006)
- [API Documentation](./docs/api.md)

---

Built with ❤️ for personalized learning

