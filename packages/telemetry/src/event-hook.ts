/**
 * Event Hook System
 * VueUse-style createEventHook for signal subscriptions
 */

export interface EventHook<T = any> {
  on: (callback: (data: T) => void) => () => void;
  off: (callback: (data: T) => void) => void;
  trigger: (data: T) => void;
  reset: () => void;
}

/**
 * Create an event hook (similar to VueUse's createEventHook)
 */
export function createEventHook<T = any>(): EventHook<T> {
  const callbacks = new Set<(data: T) => void>();

  return {
    on: (callback: (data: T) => void) => {
      callbacks.add(callback);
      // Return unsubscribe function
      return () => {
        callbacks.delete(callback);
      };
    },
    off: (callback: (data: T) => void) => {
      callbacks.delete(callback);
    },
    trigger: (data: T) => {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error("Error in event hook callback:", error);
        }
      });
    },
    reset: () => {
      callbacks.clear();
    },
  };
}

