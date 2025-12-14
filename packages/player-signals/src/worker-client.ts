/**
 * @package @amit/player-signals
 * Worker client - manages communication with signals worker
 */

import type { SignalsConfig } from './index.js';
import type { Signal } from './types.js';

type WorkerMessage = 
  | { type: 'signal'; signal: Signal }
  | { type: 'flush' };

/**
 * Create and manage worker instance
 */
export function createWorker(config: SignalsConfig) {
  // In browser environment, create actual worker
  // In Node/test, return mock
  if (typeof window === 'undefined' || typeof Worker === 'undefined') {
    return createMockWorker();
  }

  // Create worker from bundled worker file
  // In production build, this will be a .js file
  // The build system should handle creating the worker bundle
  let worker: Worker;
  try {
    const workerUrl = new URL('./worker/index.js', import.meta.url);
    worker = new Worker(workerUrl, { type: 'module' });
  } catch (error) {
    // Fallback for development - create inline worker
    console.warn('Worker file not found, using inline worker');
    const workerCode = `
      import { expose } from 'comlink';
      import { SignalsWorker } from './signals-worker.js';
      
      const worker = new SignalsWorker();
      expose(worker);
      
      self.addEventListener('message', (event) => {
        if (event.data?.type === 'config') {
          worker.configure(event.data.config);
        } else if (event.data?.type === 'signal') {
          worker.handleSignal(event.data.signal);
        } else if (event.data?.type === 'flush') {
          worker.flush();
        }
      });
    `;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);
    worker = new Worker(blobUrl, { type: 'module' });
  }

  // Send initial config
  worker.postMessage({ type: 'config', config });

  return {
    postMessage: (msg: WorkerMessage) => {
      worker.postMessage(msg);
    },
    terminate: () => {
      worker.terminate();
    },
  };
}

/**
 * Mock worker for testing/Node environments
 */
function createMockWorker() {
  return {
    postMessage: (_msg: WorkerMessage) => {
      // No-op in non-browser environment
    },
    terminate: () => {
      // No-op
    },
  };
}

