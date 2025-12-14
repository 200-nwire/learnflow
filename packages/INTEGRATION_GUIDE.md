# Adaptivity Packages Integration Guide

This guide shows how to use the three production packages together: `@amit/player-signals`, `@amit/player-session`, and `@amit/player-variants`.

## Package Overview

1. **@amit/player-signals** - UI API for signals (emits/subscribes), internally manages worker for outbox + xAPI
2. **@amit/player-session** - Reactive event-sourced read model (no hydrate/getSnapshot required)
3. **@amit/player-variants** - Variant selection and scoring

## Complete Integration Example

```typescript
import { useSignals } from '@amit/player-signals';
import { useSession } from '@amit/player-session';
import { useVariants, scoreVariant } from '@amit/player-variants';

// 1. Create signals instance
const signals = useSignals({
  config: {
    outbox: { enabled: true },
    xapi: {
      enabled: true,
      endpoint: 'https://lrs.example.com/xapi',
      auth: { kind: 'basic', token: btoa('user:pass') },
    },
  },
});

// 2. Create session instance
const session = useSession({
  policyVersion: 'v1.0.0',
});

// 3. Bind session as subscriber to signals (outside, explicit)
signals.onAny((signal) => {
  session.apply(signal);
});

// 4. Create variants selector
const variants = useVariants({
  getLesson: () => lessonContent,
  getSession: () => session.session.value,
  scoreVariant: scoreVariant, // or custom function
});

// 5. Meta builder (keep in your page/component)
function meta(): SignalMeta {
  return {
    userId: user.value.id,
    courseId: route.params.course,
    lessonId: route.params.lesson,
    attemptId: String(route.query.attemptId ?? ''),
    pageId: currentPageId.value,
    lang: locale.value,
    device: 'desktop',
    online: navigator.onLine,
  };
}

// 6. On slide/page change
onSlide(async ({ context }) => {
  const pageId = context.getId();

  // Record experienced signal
  signals.experienced({ pageId }, meta());

  // Select variants for this page
  const { selections } = variants.selectForPage(pageId, { trace: true });
  
  // Record selected signals
  selections.forEach((sel) => {
    signals.selected(
      {
        pageId,
        slotId: sel.slotId,
        variantId: sel.variantId,
        score: sel.score,
        trace: sel.trace,
      },
      meta()
    );
  });

  // Handle slide logic...
  await handleSlide(context);
});

// 7. On answer submission
onSubmit(async ({ block, context }) => {
  // ... your recordSubmission logic

  signals.answered(
    {
      pageId: context.getId(),
      blockId: block.id,
      questionId: block.id,
      correct: submission?.result?.correct,
      latencyMs: submission?.result?.latencyMs,
      score: submission?.result?.score,
      attempts: submission?.result?.attempts,
    },
    meta()
  );
});

// 8. On lesson completion
signals.completed({ success: true }, meta());
```

## Signal Vocabulary

The packages use a minimal signal vocabulary:

- **started** - Lesson/attempt started
- **experienced** - Page viewed
- **answered** - Question answered
- **selected** - Variant selected
- **completed** - Lesson completed

## Worker Responsibilities (Hidden)

The worker (internal to `@amit/player-signals`) handles:

1. Appending raw signals to IndexedDB outbox (optional)
2. Mapping signals → xAPI statements
3. Sending statements via fetch to LRS
4. Retry/queue via PQueue
5. Exposing stats/flush via worker messages (optional)

The UI never imports/instantiates the worker directly.

## Key Design Principles

1. **Separation of Concerns**: Signals, session, and variants are separate packages
2. **Explicit Binding**: Session subscribes to signals outside (not inside useSignals)
3. **Event Sourcing**: Session is built by applying signals/records
4. **Reactive**: Session state is reactive (Vue Ref)
5. **No CMI5**: Worker is internal to useSignals, session is separate

## Type Safety

All packages export TypeScript types:

```typescript
import type { Signal, SignalMeta } from '@amit/player-signals';
import type { SessionSnapshot, SessionRecord } from '@amit/player-session';
import type { PlayContent, Slot, Variant } from '@amit/player-variants';
```

