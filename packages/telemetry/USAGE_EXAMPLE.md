# Telemetry Package Usage Examples

## Basic Setup

```typescript
// main.ts or app setup
import { initTelemetry } from "@amit/telemetry/vue";

await initTelemetry({
  workerPath: "../workers/telemetry-worker.js",
  queueConfig: {
    batchSize: 50,
    flushInterval: 5000,
  },
});
```

## Recording Signals (Producer)

```typescript
import { recordSignal } from "@amit/telemetry/vue";

// Simple signal
recordSignal("page_view", {
  pageId: "lesson-1",
  duration: 5000,
});

// With metadata and tags
recordSignal("answer_submitted", {
  questionId: "q1",
  correct: true,
  timeTakenMs: 2500,
}, {
  source: "adaptivity",
  priority: "high",
  metadata: {
    userId: "user123",
    lessonId: "lesson1",
    courseId: "math101",
  },
  tags: ["assessment", "math"],
});
```

## Subscribing to Signals (Subscriber)

```typescript
import { onSignal } from "@amit/telemetry/vue";
import { onUnmounted } from "vue";

// Subscribe to all signals
const unsubscribe = onSignal((signal) => {
  console.log("Signal:", signal);
});

// Subscribe with filters
const unsubscribeFiltered = onSignal(
  (signal) => {
    console.log("High priority adaptivity signal:", signal);
  },
  {
    source: "adaptivity",
    priority: "high",
  }
);

onUnmounted(() => {
  unsubscribe();
  unsubscribeFiltered();
});
```

## Using Type-Specific Hooks

```typescript
import { useSignalType } from "@amit/telemetry/vue";

// In a component
const answerHook = useSignalType("answer_submitted");

answerHook.on((signal) => {
  console.log("Answer submitted:", signal.payload);
  
  // Update UI, analytics, etc.
  updateScore(signal.payload.correct);
});
```

## Using Source-Specific Hooks

```typescript
import { useSignalSource } from "@amit/telemetry/vue";

const adaptivityHook = useSignalSource("adaptivity");

adaptivityHook.on((signal) => {
  // Handle all adaptivity signals
  console.log("Adaptivity event:", signal.type);
});
```

## Global Hook

```typescript
import { useSignalHook } from "@amit/telemetry/vue";

const globalHook = useSignalHook();

globalHook.on((signal) => {
  // Handle all signals
  console.log("All signals:", signal);
});
```

## Getting Stats

```typescript
import { useTelemetryStats } from "@amit/telemetry/vue";

const stats = useTelemetryStats();

// Reactive stats
watch(stats, (newStats) => {
  console.log("Telemetry stats:", newStats);
});
```

## LRS Configuration

```typescript
import { getTelemetryWorker } from "@amit/telemetry/vue";

const worker = getTelemetryWorker();
if (worker) {
  // Configure LRS
  // Default test endpoint: http://127.0.0.1:8000/trax/api/gateway/clients/default/stores/default/xapi
  await worker.configureLRS({
    enabled: true,
    endpoint: "http://127.0.0.1:8000/trax/api/gateway/clients/default/stores/default/xapi",
    username: "traxlrs",
    password: "aaaaaaaa",
  });

  // Test connection
  const result = await worker.testLRSConnection();
  console.log("LRS connection:", result);
}
```

### Default Test Endpoint

The default xAPI endpoint for testing is:
- **Endpoint**: `http://127.0.0.1:8000/trax/api/gateway/clients/default/stores/default/xapi`
- **Username**: `traxlrs`
- **Password**: `aaaaaaaa`

These are pre-filled in the default configuration but disabled by default. Enable when ready to test.

## Integration with Adaptivity

```typescript
import { recordSignal } from "@amit/telemetry/vue";
import { useSessionWorker } from "@amit/adaptivity";

// When adaptivity selects a variant
const { logSignal } = useSessionWorker();

// Record to telemetry
recordSignal("variant_selected", {
  slotId: result.slotId,
  variantId: result.variantId,
  reason: result.why,
}, {
  source: "adaptivity",
  metadata: {
    userId: session.ids.userId,
    lessonId: session.ids.lessonId,
  },
});
```

## Custom Signal Sources

```typescript
// Record from custom source
recordSignal("custom_event", {
  action: "button_click",
  buttonId: "submit",
}, {
  source: "user_interaction",
  priority: "normal",
  tags: ["ui", "interaction"],
});
```

