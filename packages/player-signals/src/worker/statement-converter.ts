/**
 * @package @amit/player-signals/worker
 * Convert signals to xAPI statements
 */

import type { Signal, Started, Experienced, Answered, Selected, Completed } from '../types.js';
import type { Statement } from '@xapi/xapi';

const BASE_IRI = 'https://amit.lemida.org/xapi';

/**
 * Convert signal to xAPI statement
 */
export function convertSignalToStatement(signal: Signal): Statement {
  const actor = createActor(signal.meta);
  const timestamp = new Date(signal.meta.ts ?? Date.now()).toISOString();

  switch (signal.type) {
    case 'started':
      return convertStarted(signal, actor, timestamp);
    case 'experienced':
      return convertExperienced(signal, actor, timestamp);
    case 'answered':
      return convertAnswered(signal, actor, timestamp);
    case 'selected':
      return convertSelected(signal, actor, timestamp);
    case 'completed':
      return convertCompleted(signal, actor, timestamp);
    default:
      throw new Error(`Unknown signal type: ${(signal as any).type}`);
  }
}

function createActor(meta: Signal['meta']): Statement['actor'] {
  return {
    objectType: 'Agent',
    account: {
      homePage: BASE_IRI,
      name: meta.userId,
    },
  };
}

function convertStarted(signal: Started, actor: Statement['actor'], timestamp: string): Statement {
  return {
    id: generateStatementId(),
    actor,
    verb: {
      id: 'http://adlnet.gov/expapi/verbs/initialized',
      display: { 'en-US': 'initialized' },
    },
    object: {
      objectType: 'Activity',
      id: `${BASE_IRI}/activities/attempt/${signal.payload.attemptId}`,
      definition: {
        name: { 'en-US': `Attempt: ${signal.payload.attemptId}` },
        type: `${BASE_IRI}/activity-types/attempt`,
      },
    },
    context: createContext(signal.meta),
    timestamp,
    version: '1.0.3',
  };
}

function convertExperienced(signal: Experienced, actor: Statement['actor'], timestamp: string): Statement {
  return {
    id: generateStatementId(),
    actor,
    verb: {
      id: 'http://adlnet.gov/expapi/verbs/experienced',
      display: { 'en-US': 'experienced' },
    },
    object: {
      objectType: 'Activity',
      id: `${BASE_IRI}/activities/page/${signal.payload.pageId}`,
      definition: {
        name: { 'en-US': `Page: ${signal.payload.pageId}` },
        type: `${BASE_IRI}/activity-types/page`,
      },
    },
    context: createContext(signal.meta, {
      fromPageId: signal.payload.fromPageId,
    }),
    timestamp,
    version: '1.0.3',
  };
}

function convertAnswered(signal: Answered, actor: Statement['actor'], timestamp: string): Statement {
  return {
    id: generateStatementId(),
    actor,
    verb: {
      id: 'http://adlnet.gov/expapi/verbs/answered',
      display: { 'en-US': 'answered' },
    },
    object: {
      objectType: 'Activity',
      id: `${BASE_IRI}/activities/question/${signal.payload.questionId ?? signal.payload.blockId}`,
      definition: {
        name: { 'en-US': `Question: ${signal.payload.questionId ?? signal.payload.blockId}` },
        type: 'http://adlnet.gov/expapi/activities/question',
      },
    },
    result: {
      success: signal.payload.correct,
      score: signal.payload.score && typeof signal.payload.score === 'number'
        ? {
            scaled: signal.payload.score,
            raw: signal.payload.score,
          }
        : undefined,
      duration: signal.payload.latencyMs ? formatDuration(signal.payload.latencyMs) : undefined,
    },
    context: createContext(signal.meta, {
      pageId: signal.payload.pageId,
      blockId: signal.payload.blockId,
    }),
    timestamp,
    version: '1.0.3',
  };
}

function convertSelected(signal: Selected, actor: Statement['actor'], timestamp: string): Statement {
  return {
    id: generateStatementId(),
    actor,
    verb: {
      id: `${BASE_IRI}/verbs/selected`,
      display: { 'en-US': 'selected' },
    },
    object: {
      objectType: 'Activity',
      id: `${BASE_IRI}/activities/variant/${signal.payload.variantId}`,
      definition: {
        name: { 'en-US': `Variant: ${signal.payload.variantId}` },
        type: `${BASE_IRI}/activity-types/variant`,
      },
    },
    result: signal.payload.score
      ? {
          score: {
            scaled: signal.payload.score,
          },
        }
      : undefined,
    context: createContext(signal.meta, {
      pageId: signal.payload.pageId,
      slotId: signal.payload.slotId,
      trace: signal.payload.trace,
    }),
    timestamp,
    version: '1.0.3',
  };
}

function convertCompleted(signal: Completed, actor: Statement['actor'], timestamp: string): Statement {
  return {
    id: generateStatementId(),
    actor,
    verb: {
      id: 'http://adlnet.gov/expapi/verbs/completed',
      display: { 'en-US': 'completed' },
    },
    object: {
      objectType: 'Activity',
      id: `${BASE_IRI}/activities/lesson/${signal.meta.lessonId}`,
      definition: {
        name: { 'en-US': `Lesson: ${signal.meta.lessonId}` },
        type: `${BASE_IRI}/activity-types/lesson`,
      },
    },
    result: {
      completion: true,
      success: signal.payload.success,
      score: signal.payload.score && typeof signal.payload.score === 'number'
        ? {
            scaled: signal.payload.score,
            raw: signal.payload.score,
          }
        : undefined,
    },
    context: createContext(signal.meta),
    timestamp,
    version: '1.0.3',
  };
}

function createContext(meta: Signal['meta'], extensions?: Record<string, any>): Statement['context'] {
  return {
    platform: 'AMIT Adaptivity Platform',
    language: meta.lang === 'he' ? 'he-IL' : 'en-US',
    extensions: {
      [`${BASE_IRI}/extensions/user-id`]: meta.userId,
      [`${BASE_IRI}/extensions/course-id`]: meta.courseId,
      [`${BASE_IRI}/extensions/lesson-id`]: meta.lessonId,
      [`${BASE_IRI}/extensions/page-id`]: meta.pageId,
      [`${BASE_IRI}/extensions/device`]: meta.device,
      [`${BASE_IRI}/extensions/online`]: meta.online,
      ...(extensions
        ? Object.fromEntries(
            Object.entries(extensions).map(([k, v]) => [`${BASE_IRI}/extensions/${k}`, v])
          )
        : {}),
    },
    contextActivities: {
      grouping: [
        {
          objectType: 'Activity',
          id: `${BASE_IRI}/activities/course/${meta.courseId}`,
        },
        {
          objectType: 'Activity',
          id: `${BASE_IRI}/activities/lesson/${meta.lessonId}`,
        },
      ],
    },
  };
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}H`);
  if (minutes % 60 > 0) parts.push(`${minutes % 60}M`);
  if (seconds % 60 > 0) parts.push(`${seconds % 60}S`);

  return parts.length > 0 ? `PT${parts.join('')}` : 'PT0S';
}

function generateStatementId(): string {
  return `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

