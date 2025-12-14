/**
 * @package @amit/player-signals/worker
 * Worker implementation - outbox + xAPI sender
 */

import PQueue from 'p-queue';
import type { Signal } from '../types.js';
import type { SignalsConfig } from '../index.js';
import { SignalOutbox } from './outbox.js';
import { xAPIClient } from './xapi-client.js';

export class SignalsWorker {
  private outbox: SignalOutbox | null = null;
  private xapiClient: xAPIClient | null = null;
  private config: SignalsConfig = {};
  private queue: PQueue;

  constructor() {
    // Queue for processing signals with concurrency control
    this.queue = new PQueue({ concurrency: 1 });
  }

  /**
   * Configure worker with settings
   */
  async configure(config: SignalsConfig): Promise<void> {
    this.config = config;

    // Initialize outbox if enabled
    if (config.outbox?.enabled !== false) {
      this.outbox = new SignalOutbox();
      await this.outbox.init();
    }

    // Initialize xAPI client if enabled
    if (config.xapi?.enabled && config.xapi.endpoint) {
      const endpoint = config.xapi.endpoint.endsWith('/statements')
        ? config.xapi.endpoint
        : `${config.xapi.endpoint}/statements`;
      
      this.xapiClient = new xAPIClient({
        endpoint,
        auth: config.xapi.auth,
      });
    }
  }

  /**
   * Handle incoming signal
   */
  async handleSignal(signal: Signal): Promise<void> {
    await this.queue.add(async () => {
      // 1) Append to outbox (if enabled)
      if (this.outbox) {
        await this.outbox.addSignal(signal);
      }

      // 2) Convert to xAPI and send (if enabled)
      if (this.xapiClient) {
        await this.xapiClient.sendSignal(signal);
      }
    });
  }

  /**
   * Flush queues
   */
  async flush(): Promise<void> {
    await this.queue.onIdle();
    
    // Retry any failed xAPI sends
    if (this.xapiClient) {
      await this.xapiClient.flush();
    }
  }
}

