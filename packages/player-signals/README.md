# @amit/player-signals

UI API for signals - emits/subscribes, internally manages worker for outbox and xAPI.

## Usage

```typescript
import { useSignals } from '@amit/player-signals';

const signals = useSignals({
  config: {
    outbox: { enabled: true },
    xapi: {
      enabled: true,
      endpoint: 'https://lrs.example.com/xapi',
      auth: { kind: 'basic', token: 'base64-encoded-credentials' },
    },
  },
});

// Subscribe to signals
signals.onAny((signal) => {
  console.log('Signal:', signal);
});

// Record signals
signals.started({ attemptId: 'attempt-123' }, meta());
signals.experienced({ pageId: 'page-1' }, meta());
signals.answered({ pageId: 'page-1', blockId: 'block-1', correct: true }, meta());
signals.selected({ pageId: 'page-1', slotId: 'slot-1', variantId: 'variant-1' }, meta());
signals.completed({ success: true }, meta());
```

## API

- `record(signal: Signal)` - Record a signal
- `on(type, cb)` - Subscribe to specific signal types
- `onAny(cb)` - Subscribe to all signals
- `started(payload, meta)` - Convenience method for started signals
- `experienced(payload, meta)` - Convenience method for experienced signals
- `answered(payload, meta)` - Convenience method for answered signals
- `selected(payload, meta)` - Convenience method for selected signals
- `completed(payload, meta)` - Convenience method for completed signals
- `flush()` - Flush queues in worker

## Worker

The worker is internal and handles:
- IndexedDB outbox for offline-first signal storage
- xAPI statement conversion and sending to LRS
- Retry logic and queue management

