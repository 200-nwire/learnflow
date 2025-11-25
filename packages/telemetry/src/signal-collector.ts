/**
 * Signal Collector
 * Collects signals from all sources and manages subscriptions
 */

import type { TelemetrySignal, SignalSubscription, SignalSource, SignalPriority } from "./types.js";
import { createEventHook, type EventHook } from "./event-hook.js";

export class SignalCollector {
  private signals: TelemetrySignal[] = [];
  private subscriptions: Map<string, SignalSubscription> = new Map();
  private globalHook: EventHook<TelemetrySignal>;
  private typeHooks: Map<string, EventHook<TelemetrySignal>> = new Map();
  private sourceHooks: Map<SignalSource, EventHook<TelemetrySignal>> = new Map();
  private maxHistory: number = 1000;

  constructor(maxHistory: number = 1000) {
    this.maxHistory = maxHistory;
    this.globalHook = createEventHook<TelemetrySignal>();
  }

  /**
   * Record a signal (producer)
   * Triggers all relevant subscriptions and hooks
   */
  recordSignal(signal: TelemetrySignal): void {
    // Add to history
    this.signals.push(signal);
    if (this.signals.length > this.maxHistory) {
      this.signals.shift();
    }

    // Trigger global hook
    this.globalHook.trigger(signal);

    // Trigger type-specific hook
    const typeHook = this.typeHooks.get(signal.type);
    if (typeHook) {
      typeHook.trigger(signal);
    }

    // Trigger source-specific hook
    const sourceHook = this.sourceHooks.get(signal.source);
    if (sourceHook) {
      sourceHook.trigger(signal);
    }

    // Trigger filtered subscriptions
    this.subscriptions.forEach((subscription) => {
      if (this.matchesFilters(signal, subscription.filters)) {
        try {
          subscription.callback(signal);
        } catch (error) {
          console.error(`Error in subscription ${subscription.id}:`, error);
        }
      }
    });
  }

  /**
   * Subscribe to signals (subscriber)
   */
  subscribe(
    callback: (signal: TelemetrySignal) => void,
    filters?: SignalSubscription["filters"]
  ): () => void {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const subscription: SignalSubscription = {
      id,
      callback,
      filters,
    };

    this.subscriptions.set(id, subscription);

    // Return unsubscribe function
    return () => {
      this.subscriptions.delete(id);
    };
  }

  /**
   * Get global event hook for all signals
   */
  getGlobalHook(): EventHook<TelemetrySignal> {
    return this.globalHook;
  }

  /**
   * Get or create type-specific hook
   */
  getTypeHook(type: string): EventHook<TelemetrySignal> {
    if (!this.typeHooks.has(type)) {
      this.typeHooks.set(type, createEventHook<TelemetrySignal>());
    }
    return this.typeHooks.get(type)!;
  }

  /**
   * Get or create source-specific hook
   */
  getSourceHook(source: SignalSource): EventHook<TelemetrySignal> {
    if (!this.sourceHooks.has(source)) {
      this.sourceHooks.set(source, createEventHook<TelemetrySignal>());
    }
    return this.sourceHooks.get(source)!;
  }

  /**
   * Get signal history
   */
  getHistory(filters?: {
    type?: string;
    source?: SignalSource;
    limit?: number;
  }): TelemetrySignal[] {
    let filtered = [...this.signals];

    if (filters?.type) {
      filtered = filtered.filter(s => s.type === filters.type);
    }

    if (filters?.source) {
      filtered = filtered.filter(s => s.source === filters.source);
    }

    if (filters?.limit) {
      filtered = filtered.slice(-filters.limit);
    }

    return filtered;
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.signals = [];
  }

  /**
   * Get stats
   */
  getStats() {
    const byType = new Map<string, number>();
    const bySource = new Map<SignalSource, number>();
    const byPriority = new Map<SignalPriority, number>();

    this.signals.forEach(signal => {
      byType.set(signal.type, (byType.get(signal.type) || 0) + 1);
      bySource.set(signal.source, (bySource.get(signal.source) || 0) + 1);
      byPriority.set(signal.priority, (byPriority.get(signal.priority) || 0) + 1);
    });

    return {
      total: this.signals.length,
      subscriptions: this.subscriptions.size,
      byType: Object.fromEntries(byType),
      bySource: Object.fromEntries(bySource),
      byPriority: Object.fromEntries(byPriority),
    };
  }

  /**
   * Check if signal matches filters
   */
  private matchesFilters(
    signal: TelemetrySignal,
    filters?: SignalSubscription["filters"]
  ): boolean {
    if (!filters) return true;

    if (filters.type) {
      const types = Array.isArray(filters.type) ? filters.type : [filters.type];
      if (!types.includes(signal.type)) return false;
    }

    if (filters.source) {
      const sources = Array.isArray(filters.source) ? filters.source : [filters.source];
      if (!sources.includes(signal.source)) return false;
    }

    if (filters.priority) {
      const priorities = Array.isArray(filters.priority) ? filters.priority : [filters.priority];
      if (!priorities.includes(signal.priority)) return false;
    }

    if (filters.tags && filters.tags.length > 0) {
      if (!signal.tags || !filters.tags.some(tag => signal.tags!.includes(tag))) {
        return false;
      }
    }

    return true;
  }
}

// Global singleton instance
let globalCollector: SignalCollector | null = null;

export function getSignalCollector(): SignalCollector {
  if (!globalCollector) {
    globalCollector = new SignalCollector();
  }
  return globalCollector;
}

export function setSignalCollector(collector: SignalCollector): void {
  globalCollector = collector;
}

