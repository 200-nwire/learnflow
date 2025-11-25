# @amit/telemetry

Telemetry package for collecting, processing, and sending learning analytics signals to xAPI LRS.

## Features

- 🎯 **Event-based architecture** - Producers and subscribers pattern
- 🔄 **Worker queue** - Background processing via Web Worker
- 📡 **xAPI integration** - Automatic statement generation and LRS sending
- 🎣 **Vue composables** - `onSignal()` and `recordSignal()` hooks
- 📊 **Signal aggregation** - Collects from all sources
- 🔔 **Real-time subscriptions** - Filter by type, source, priority, tags

## Installation

```bash
pnpm add @amit/telemetry
```

## Quick Start

### 1. Initialize Telemetry

```typescript
import { initTelemetry } from "@amit/telemetry/vue";

// In your app setup
await initTelemetry({
  workerPath: "../workers/telemetry-worker.js",
  queueConfig: {
    batchSize: 50,
    flushInterval: 5000,
    maxQueueSize: 1000,
  },
});
```

### 2. Record Signals (Producer)

```typescript
import { recordSignal } from "@amit/telemetry/vue";

// Record a signal
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
  },
  tags: ["assessment", "math"],
});
```

### 3. Subscribe to Signals (Subscriber)

```typescript
import { onSignal } from "@amit/telemetry/vue";

// Subscribe to all signals
const unsubscribe = onSignal((signal) => {
  console.log("Signal received:", signal);
});

// Subscribe with filters
const unsubscribeFiltered = onSignal(
  (signal) => {
    console.log("High priority signal:", signal);
  },
  {
    priority: "high",
    source: "adaptivity",
    tags: ["assessment"],
  }
);

// Cleanup
onUnmounted(() => {
  unsubscribe();
  unsubscribeFiltered();
});
```

### 4. Use Type-Specific Hooks

```typescript
import { useSignalType } from "@amit/telemetry/vue";

const answerHook = useSignalType("answer_submitted");

// Subscribe
answerHook.on((signal) => {
  console.log("Answer submitted:", signal);
});

// Trigger manually (if needed)
answerHook.trigger({
  id: "sig_123",
  type: "answer_submitted",
  // ... other fields
});
```

## Architecture

```
┌─────────────┐
│  Producers  │
│ recordSignal│
└──────┬──────┘
       │
       ▼
┌─────────────┐      ┌──────────────┐
│  Collector  │─────▶│  Subscribers │
│  (Aggregate)│      │   onSignal() │
└──────┬──────┘      └──────────────┘
       │
       ▼
┌─────────────┐
│    Queue    │
│  (Batch)    │
└──────┬──────┘
       │
       ▼
┌─────────────┐      ┌──────────────┐
│   Worker    │─────▶│  xAPI LRS    │
│ (Background)│      │  (Remote)    │
└─────────────┘      └──────────────┘
```

## API Reference

### `recordSignal(type, payload, options?)`

Record a signal (producer).

**Parameters:**
- `type: string` - Signal type
- `payload: Record<string, any>` - Signal data
- `options?: { source?, priority?, metadata?, tags? }` - Optional configuration

### `onSignal(callback, filters?)`

Subscribe to signals (subscriber).

**Parameters:**
- `callback: (signal: TelemetrySignal) => void` - Callback function
- `filters?: { type?, source?, priority?, tags? }` - Optional filters

**Returns:** Unsubscribe function

### `useSignalType(type)`

Get hook for specific signal type.

### `useSignalSource(source)`

Get hook for specific signal source.

### `useSignalHook()`

Get global signal hook.

### `useTelemetryStats()`

Get reactive telemetry statistics.

## Signal Sources

- `adaptivity` - From adaptivity engine
- `user_interaction` - User interactions
- `system` - System events
- `analytics` - Analytics events
- `custom` - Custom signals

## Signal Priorities

- `low` - Low priority
- `normal` - Normal priority (default)
- `high` - High priority
- `critical` - Critical priority

## Worker Configuration

The worker handles:
- Signal storage in IndexedDB
- xAPI statement generation
- LRS communication
- Background syncing

Configure via `initTelemetry()` options.

## LRS Configuration

Configure LRS via worker API:

```typescript
import { getTelemetryWorker } from "@amit/telemetry/vue";

const worker = getTelemetryWorker();
if (worker) {
  // Default test endpoint (pre-configured but disabled)
  await worker.configureLRS({
    enabled: true,
    endpoint: "http://127.0.0.1:8000/trax/api/gateway/clients/default/stores/default/xapi",
    username: "traxlrs",
    password: "aaaaaaaa",
  });
}
```

**Default Test Endpoint:**
- Endpoint: `http://127.0.0.1:8000/trax/api/gateway/clients/default/stores/default/xapi`
- Username: `traxlrs`
- Password: `aaaaaaaa`

