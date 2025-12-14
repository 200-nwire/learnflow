/**
 * @package @amit/player-signals
 * Zod schemas for signal validation
 */

import { z } from 'zod';

export const SignalMetaSchema = z.object({
  ts: z.number().optional(),
  userId: z.string(),
  courseId: z.string(),
  lessonId: z.string(),
  attemptId: z.string().optional(),
  pageId: z.string().optional(),
  lang: z.string().optional(),
  device: z.enum(['desktop', 'tablet', 'mobile']).optional(),
  online: z.boolean().optional(),
});

export const StartedSchema = z.object({
  type: z.literal('started'),
  payload: z.object({
    attemptId: z.string(),
    mode: z.enum(['standalone']).optional(),
  }),
  meta: SignalMetaSchema,
});

export const ExperiencedSchema = z.object({
  type: z.literal('experienced'),
  payload: z.object({
    pageId: z.string(),
    fromPageId: z.string().optional(),
  }),
  meta: SignalMetaSchema,
});

export const AnsweredSchema = z.object({
  type: z.literal('answered'),
  payload: z.object({
    pageId: z.string(),
    blockId: z.string(),
    questionId: z.string().optional(),
    correct: z.boolean().optional(),
    score: z.any().optional(),
    latencyMs: z.number().optional(),
    attempts: z.number().optional(),
  }),
  meta: SignalMetaSchema,
});

export const SelectedSchema = z.object({
  type: z.literal('selected'),
  payload: z.object({
    pageId: z.string(),
    slotId: z.string(),
    variantId: z.string(),
    score: z.number().optional(),
    trace: z.any().optional(),
  }),
  meta: SignalMetaSchema,
});

export const CompletedSchema = z.object({
  type: z.literal('completed'),
  payload: z.object({
    success: z.boolean().optional(),
    score: z.any().optional(),
  }),
  meta: SignalMetaSchema,
});

export const SignalSchema = z.discriminatedUnion('type', [
  StartedSchema,
  ExperiencedSchema,
  AnsweredSchema,
  SelectedSchema,
  CompletedSchema,
]);

// Type inference
export type SignalMeta = z.infer<typeof SignalMetaSchema>;
export type Started = z.infer<typeof StartedSchema>;
export type Experienced = z.infer<typeof ExperiencedSchema>;
export type Answered = z.infer<typeof AnsweredSchema>;
export type Selected = z.infer<typeof SelectedSchema>;
export type Completed = z.infer<typeof CompletedSchema>;
export type Signal = z.infer<typeof SignalSchema>;

