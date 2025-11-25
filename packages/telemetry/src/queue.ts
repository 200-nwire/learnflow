/**
 * Signal Queue
 * Manages queuing and batching of signals for worker processing
 */

import type { TelemetrySignal } from "./types.js";
import { SignalCollector } from "./signal-collector.js";

export interface QueueConfig {
  batchSize: number;
  flushInterval: number; // ms
  maxQueueSize: number;
}

export class SignalQueue {
  private queue: TelemetrySignal[] = [];
  private config: QueueConfig;
  private flushTimer: number | null = null;
  private collector: SignalCollector;
  private processor: ((signals: TelemetrySignal[]) => Promise<void>) | null = null;

  constructor(
    collector: SignalCollector,
    config: Partial<QueueConfig> = {}
  ) {
    this.collector = collector;
    this.config = {
      batchSize: config.batchSize || 50,
      flushInterval: config.flushInterval || 5000,
      maxQueueSize: config.maxQueueSize || 1000,
    };
  }

  /**
   * Set the processor function (called when queue is flushed)
   */
  setProcessor(processor: (signals: TelemetrySignal[]) => Promise<void>): void {
    this.processor = processor;
  }

  /**
   * Enqueue a signal
   */
  enqueue(signal: TelemetrySignal): void {
    // Check queue size limit
    if (this.queue.length >= this.config.maxQueueSize) {
      console.warn("Signal queue is full, dropping oldest signal");
      this.queue.shift();
    }

    this.queue.push(signal);

    // Auto-flush if batch size reached
    if (this.queue.length >= this.config.batchSize) {
      this.flush();
    } else {
      // Start flush timer if not already running
      this.startFlushTimer();
    }
  }

  /**
   * Flush queue (send all queued signals)
   */
  async flush(): Promise<void> {
    if (this.queue.length === 0) {
      return;
    }

    // Stop flush timer
    this.stopFlushTimer();

    // Get batch to process
    const batch = this.queue.splice(0, this.config.batchSize);

    if (this.processor) {
      try {
        await this.processor(batch);
      } catch (error) {
        console.error("Error processing signal batch:", error);
        // Re-queue on error (optional - might want to drop instead)
        // this.queue.unshift(...batch);
      }
    }
  }

  /**
   * Start automatic flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer !== null) {
      return; // Timer already running
    }

    this.flushTimer = self.setTimeout(() => {
      this.flush();
    }, this.config.flushInterval) as any;
  }

  /**
   * Stop automatic flush timer
   */
  private stopFlushTimer(): void {
    if (this.flushTimer !== null) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Get queue stats
   */
  getStats() {
    return {
      queued: this.queue.length,
      maxSize: this.config.maxQueueSize,
      batchSize: this.config.batchSize,
      flushInterval: this.config.flushInterval,
    };
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.stopFlushTimer();
    this.queue = [];
  }
}

