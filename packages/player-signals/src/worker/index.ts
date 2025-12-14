/**
 * @package @amit/player-signals/worker
 * Worker entry point - handles outbox and xAPI
 */

import { expose } from 'comlink';
import { SignalsWorker } from './signals-worker.js';

const worker = new SignalsWorker();
expose(worker);

// Listen for messages from main thread
self.addEventListener('message', (event: MessageEvent) => {
  if (event.data?.type === 'config') {
    worker.configure(event.data.config);
  } else if (event.data?.type === 'signal') {
    worker.handleSignal(event.data.signal);
  } else if (event.data?.type === 'flush') {
    worker.flush();
  }
});

