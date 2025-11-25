# xAPI Integration

This module provides xAPI (Experience API) integration for the AMIT Adaptivity platform.

## Implementation

We use the **official [@xapi/xapi](https://www.npmjs.com/package/@xapi/xapi) library** for LRS communication, which provides:

- ✅ Full xAPI 1.0.3 compliance
- ✅ Strong TypeScript typing
- ✅ Well-tested and maintained
- ✅ Handles authentication, retries, and error handling

## Components

### Statement Converter (`statement-converter.ts`)
Converts internal signals to xAPI-compliant statements. This is our custom implementation that maps our signal types to xAPI verbs and activities.

### LRS Client (`lrs-client-xapi.ts`)
Wrapper around `@xapi/xapi` that provides:
- Configuration management
- Retry logic with exponential backoff
- Connection testing
- Batch statement submission

### Configuration (`config.ts`)
LocalStorage-based configuration for LRS settings.

## Usage

```typescript
import { LRSClientXAPI } from "@amit/adaptivity/xapi";

const client = new LRSClientXAPI({
  endpoint: "https://lrs.example.com/xapi",
  username: "user",
  password: "pass",
});

// Test connection
const result = await client.testConnection();

// Send statements
await client.sendStatements(statements);
```

## Installation

The `@xapi/xapi` package is included as a dependency. Install with:

```bash
pnpm install
```

## Migration from Custom Implementation

The old `lrs-client.ts` has been replaced with `lrs-client-xapi.ts` which uses the official library. The API remains the same, so no code changes are needed.

