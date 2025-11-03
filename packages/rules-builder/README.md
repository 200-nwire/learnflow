# @amit/rules-builder

Visual rule builder for json-rules-engine with Vue 3 and TypeScript.

## Features

- 🎨 **Visual Interface**: Build complex rules with drag-and-drop
- 🔄 **Vue 3 Composition API**: Modern, reactive, and composable
- 📘 **TypeScript**: Fully typed for better DX
- 🎯 **json-rules-engine Compatible**: Works seamlessly with json-rules-engine
- 🧪 **Well Tested**: Comprehensive test coverage with Vitest
- 🎨 **Customizable**: Bring your own UI components

## Installation

```bash
pnpm add @amit/rules-builder json-rules-engine
```

## Quick Start

```vue
<script setup>
import { RuleBuilder } from '@amit/rules-builder';

const config = {
  facts: [
    { name: 'accuracy', label: 'Accuracy', type: 'number' },
    { name: 'streak', label: 'Streak', type: 'number' },
  ],
  events: [
    { type: 'show_hint', label: 'Show Hint' },
  ],
};
</script>

<template>
  <RuleBuilder :config="config" />
</template>
```

## Composables

### `useRuleBuilder(config)`

Manages rule state and operations.

```typescript
const {
  rule,              // Current rule
  nodes,             // Flattened node list
  addCondition,      // Add a condition to a group
  addGroup,          // Add a nested group
  removeNode,        // Remove a node
  updateCondition,   // Update condition values
  toggleGroupOperator, // Switch between AND/OR
  toJSON,            // Export as JSON
  fromJSON,          // Import from JSON
} = useRuleBuilder(config);
```

### `useRuleEngine()`

Evaluates rules against facts.

```typescript
const {
  runRule,           // Run a single rule
  runRules,          // Run multiple rules
  validateRule,      // Validate rule structure
  lastResult,        // Last simulation result
  isRunning,         // Running state
} = useRuleEngine();

const result = await runRule(rule, { accuracy: 0.85 });
```

## Configuration

```typescript
interface RuleBuilderConfig {
  facts: FactDefinition[];       // Available facts
  operators?: OperatorDefinition[]; // Custom operators
  events: EventDefinition[];     // Possible events
  maxDepth?: number;            // Max nesting (default: 5)
  colors?: string[];            // Group colors
}
```

## Rule Structure

Compatible with json-rules-engine:

```json
{
  "conditions": {
    "all": [
      {
        "fact": "accuracy",
        "operator": "greaterThan",
        "value": 0.7
      }
    ]
  },
  "event": {
    "type": "show_hint",
    "params": { "level": 1 }
  }
}
```

## Testing

```bash
pnpm test          # Run tests
pnpm test:coverage # With coverage
```

## License

MIT

