/**
 * @package @amit/player-signals/worker
 * xAPI client - converts signals to xAPI statements and sends to LRS
 */

import XAPI from '@xapi/xapi';
import type { Signal } from '../types.js';
import type { SignalsConfig } from '../index.js';
import { convertSignalToStatement } from './statement-converter.js';

export class xAPIClient {
  private xapi: XAPI | null = null;
  private endpoint: string;
  private auth: string;

  constructor(config: { endpoint: string; auth?: { kind: 'basic'; token: string } | { kind: 'bearer'; token: string } }) {
    this.endpoint = config.endpoint;
    
    // Build auth string
    if (config.auth?.kind === 'bearer') {
      this.auth = config.auth.token;
    } else if (config.auth?.kind === 'basic') {
      this.auth = config.auth.token; // Assume token is already base64 encoded
    } else {
      throw new Error('xAPI auth required');
    }

    // Initialize XAPI client
    try {
      this.xapi = new XAPI({
        endpoint: this.endpoint,
        auth: this.auth,
      });
    } catch (error) {
      console.error('Failed to initialize xAPI client:', error);
      this.xapi = null;
    }
  }

  /**
   * Convert signal to xAPI statement and send
   */
  async sendSignal(signal: Signal): Promise<void> {
    if (!this.xapi) {
      console.warn('xAPI client not initialized, skipping signal');
      return;
    }

    try {
      // Convert signal to xAPI statement
      const statement = convertSignalToStatement(signal);
      
      // Send to LRS
      await this.xapi.sendStatement({ statement });
    } catch (error) {
      console.error('Failed to send xAPI statement:', error);
      // In production, you might want to queue for retry
    }
  }

  /**
   * Flush any pending statements
   */
  async flush(): Promise<void> {
    // Implementation for retrying failed sends
    // This would read from outbox and retry
  }
}

