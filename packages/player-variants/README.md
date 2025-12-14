# @amit/player-variants

Variant selection and scoring for adaptive content.

## Usage

```typescript
import { useVariants } from '@amit/player-variants';
import { useSession } from '@amit/player-session';
import { scoreVariant } from '@amit/player-variants';

const session = useSession();
const variants = useVariants({
  getLesson: () => lessonContent,
  getSession: () => session.session.value,
  scoreVariant: scoreVariant, // or custom scoring function
});

// Select variants for a page
const { selections } = variants.selectForPage('page-1', { trace: true });

selections.forEach((sel) => {
  console.log(`Slot ${sel.slotId}: Variant ${sel.variantId} (score: ${sel.score})`);
});
```

## API

- `selectForPage(pageId, opts?)` - Select variants for all slots on a page
  - Returns: `{ selections: Array<{ slotId, variantId, score?, trace? }> }`

## Scoring

The default `scoreVariant` function considers:
- Difficulty (easy/std/hard) based on learner accuracy
- Theme matching
- Modality preferences
- Device suitability
- Cognitive load

You can provide a custom scoring function to override the default behavior.

