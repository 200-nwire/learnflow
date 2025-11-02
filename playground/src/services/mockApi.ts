/**
 * Mock API service for simulating backend signal syncing
 */
import type { Signal } from "@amit/adaptivity";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface SyncResponse {
  received: number;
  processed: number;
  failed: string[];
}

/**
 * Mock API client that simulates network requests and responses
 */
export class MockApiClient {
  private endpoint: string;
  private latencyMs: number;
  private failureRate: number;
  private receivedSignals: Signal[] = [];

  constructor(
    endpoint: string = "/api/signals",
    latencyMs: number = 100,
    failureRate: number = 0.1
  ) {
    this.endpoint = endpoint;
    this.latencyMs = latencyMs;
    this.failureRate = failureRate;
  }

  /**
   * Simulate syncing signals to backend
   */
  async syncSignals(signals: Signal[]): Promise<ApiResponse<SyncResponse>> {
    console.log(`[Mock API] POST ${this.endpoint}`, signals);

    // Simulate network latency
    await this.simulateNetworkDelay();

    // Simulate occasional failures
    if (Math.random() < this.failureRate) {
      return {
        success: false,
        error: "Network error or rate limit exceeded",
        timestamp: Date.now(),
      };
    }

    // Store received signals
    this.receivedSignals.push(...signals);

    return {
      success: true,
      data: {
        received: signals.length,
        processed: signals.length,
        failed: [],
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Get all received signals (for debugging/visualization)
   */
  getReceivedSignals(): Signal[] {
    return [...this.receivedSignals];
  }

  /**
   * Clear received signals
   */
  clearReceivedSignals(): void {
    this.receivedSignals = [];
  }

  /**
   * Get stats about received signals
   */
  getStats() {
    const byType = this.receivedSignals.reduce((acc, signal) => {
      acc[signal.type] = (acc[signal.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byUser = this.receivedSignals.reduce((acc, signal) => {
      const userId = signal.sessionIds.userId;
      acc[userId] = (acc[userId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.receivedSignals.length,
      byType,
      byUser,
      oldest: this.receivedSignals[0]?.timestamp,
      newest: this.receivedSignals[this.receivedSignals.length - 1]?.timestamp,
    };
  }

  /**
   * Configure mock API behavior
   */
  configure(options: { latencyMs?: number; failureRate?: number }) {
    if (options.latencyMs !== undefined) this.latencyMs = options.latencyMs;
    if (options.failureRate !== undefined) this.failureRate = options.failureRate;
  }

  private async simulateNetworkDelay(): Promise<void> {
    const jitter = Math.random() * 50; // Add some jitter
    const delay = this.latencyMs + jitter;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

/**
 * Global mock API instance
 */
export const mockApi = new MockApiClient();

