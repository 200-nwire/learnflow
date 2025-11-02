/**
 * Signal system for tracking all learning events and decisions.
 * Signals are logged locally and synced to backend for analytics.
 */
import type { SessionSnapshot, SelectionResult, SlotId, VariantId } from "./types.js";

export type SignalType =
  | "variant_selected"
  | "variant_shown"
  | "user_interaction"
  | "answer_submitted"
  | "page_navigated"
  | "session_started"
  | "session_ended"
  | "preference_changed"
  | "override_applied"
  | "error_occurred";

export type Signal = {
  id: string;
  type: SignalType;
  timestamp: number;
  sessionIds: {
    userId: string;
    courseId: string;
    lessonId: string;
    pageId: string;
    attemptId?: string;
  };
  payload: Record<string, any>;
  context?: Partial<SessionSnapshot>;
  synced: boolean;
  syncAttempts: number;
};

export type VariantSelectedSignal = Signal & {
  type: "variant_selected";
  payload: {
    slotId: SlotId;
    variantId: VariantId;
    reason: string;
    selectionResult: SelectionResult;
    alternatives: Array<{ variantId: string; score: number; guardPassed: boolean }>;
  };
};

export type AnswerSubmittedSignal = Signal & {
  type: "answer_submitted";
  payload: {
    slotId: SlotId;
    variantId: VariantId;
    questionId: string;
    correct: boolean;
    timeTakenMs: number;
    attempts: number;
    answer: any;
  };
};

export type PageNavigatedSignal = Signal & {
  type: "page_navigated";
  payload: {
    fromPageId: string;
    toPageId: string;
    direction: "next" | "prev" | "jump";
    timeOnPageMs: number;
  };
};

/**
 * Signal factory - create typed signals with proper structure
 */
export class SignalFactory {
  private generateId(): string {
    return `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  createVariantSelectedSignal(
    ctx: SessionSnapshot,
    result: SelectionResult,
    alternatives: Array<{ variantId: string; score: number; guardPassed: boolean }>
  ): VariantSelectedSignal {
    return {
      id: this.generateId(),
      type: "variant_selected",
      timestamp: Date.now(),
      sessionIds: {
        userId: ctx.ids.userId,
        courseId: ctx.ids.courseId,
        lessonId: ctx.ids.lessonId,
        pageId: ctx.ids.pageId,
        attemptId: ctx.ids.attemptId,
      },
      payload: {
        slotId: result.slotId,
        variantId: result.variantId,
        reason: this.determineReason(result),
        selectionResult: result,
        alternatives,
      },
      synced: false,
      syncAttempts: 0,
    };
  }

  createAnswerSubmittedSignal(
    ctx: SessionSnapshot,
    slotId: SlotId,
    variantId: VariantId,
    questionId: string,
    correct: boolean,
    timeTakenMs: number,
    attempts: number,
    answer: any
  ): AnswerSubmittedSignal {
    return {
      id: this.generateId(),
      type: "answer_submitted",
      timestamp: Date.now(),
      sessionIds: {
        userId: ctx.ids.userId,
        courseId: ctx.ids.courseId,
        lessonId: ctx.ids.lessonId,
        pageId: ctx.ids.pageId,
        attemptId: ctx.ids.attemptId,
      },
      payload: {
        slotId,
        variantId,
        questionId,
        correct,
        timeTakenMs,
        attempts,
        answer,
      },
      synced: false,
      syncAttempts: 0,
    };
  }

  createPageNavigatedSignal(
    ctx: SessionSnapshot,
    fromPageId: string,
    toPageId: string,
    direction: "next" | "prev" | "jump",
    timeOnPageMs: number
  ): PageNavigatedSignal {
    return {
      id: this.generateId(),
      type: "page_navigated",
      timestamp: Date.now(),
      sessionIds: {
        userId: ctx.ids.userId,
        courseId: ctx.ids.courseId,
        lessonId: ctx.ids.lessonId,
        pageId: toPageId,
        attemptId: ctx.ids.attemptId,
      },
      payload: {
        fromPageId,
        toPageId,
        direction,
        timeOnPageMs,
      },
      synced: false,
      syncAttempts: 0,
    };
  }

  createGenericSignal(
    type: SignalType,
    ctx: SessionSnapshot,
    payload: Record<string, any>
  ): Signal {
    return {
      id: this.generateId(),
      type,
      timestamp: Date.now(),
      sessionIds: {
        userId: ctx.ids.userId,
        courseId: ctx.ids.courseId,
        lessonId: ctx.ids.lessonId,
        pageId: ctx.ids.pageId,
        attemptId: ctx.ids.attemptId,
      },
      payload,
      synced: false,
      syncAttempts: 0,
    };
  }

  private determineReason(result: SelectionResult): string {
    if (result.why.overridesUsed) return "Teacher/system override applied";
    if (result.why.stickyUsed) return "Previous choice retained (sticky)";
    
    const scores = Object.entries(result.why.score);
    if (scores.length === 0) return "Fallback variant";
    
    const topScore = Math.max(...scores.map(([, s]) => s));
    const topVariant = scores.find(([, s]) => s === topScore)?.[0];
    
    if (topVariant === result.variantId) {
      return `Highest score (${topScore.toFixed(2)}) - best match for learner context`;
    }
    
    return "Selected by adaptivity engine";
  }
}

/**
 * In-memory signal buffer with size limits
 */
export class SignalBuffer {
  private signals: Signal[] = [];
  private readonly maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  push(signal: Signal): void {
    this.signals.push(signal);
    if (this.signals.length > this.maxSize) {
      this.signals.shift();
    }
  }

  getUnsynced(): Signal[] {
    return this.signals.filter(s => !s.synced);
  }

  getAll(): Signal[] {
    return [...this.signals];
  }

  markSynced(signalId: string): void {
    const signal = this.signals.find(s => s.id === signalId);
    if (signal) {
      signal.synced = true;
    }
  }

  incrementSyncAttempt(signalId: string): void {
    const signal = this.signals.find(s => s.id === signalId);
    if (signal) {
      signal.syncAttempts++;
    }
  }

  clear(): void {
    this.signals = [];
  }

  getSummary() {
    return {
      total: this.signals.length,
      synced: this.signals.filter(s => s.synced).length,
      unsynced: this.signals.filter(s => !s.synced).length,
      byType: this.signals.reduce((acc, s) => {
        acc[s.type] = (acc[s.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

