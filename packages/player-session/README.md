# @amit/player-session

Reactive event-sourced read model for session state. No hydrate/getSnapshot required.

## Usage

```typescript
import { useSession } from '@amit/player-session';
import { useSignals } from '@amit/player-signals';

const session = useSession({
  snapshot: initialSnapshot, // optional
  records: initialRecords,  // optional
  policyVersion: 'v1.0.0',
});

const signals = useSignals();

// Bind session as subscriber to signals
signals.onAny((signal) => {
  session.apply(signal);
});

// Access reactive session state
console.log(session.session.value.metrics.accEWMA);
```

## API

- `session: Readonly<Ref<SessionSnapshot>>` - Reactive session state
- `apply(input: Signal | Signal[] | SessionRecord[])` - Apply signals/records to update session
- `initFrom(input)` - Initialize from snapshot and/or records

## Event Sourcing

The session is built by applying signals/records in order. Each signal updates the session state reactively.

