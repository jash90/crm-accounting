/**
 * Event Bus for inter-module communication
 * Enables loosely coupled communication between modules
 */

type EventCallback = (...args: unknown[]) => void;
type UnsubscribeFn = () => void;

class EventBus {
  private events: Map<string, Set<EventCallback>> = new Map();
  private eventHistory: Map<string, unknown[]> = new Map();
  private maxHistorySize = 10;

  /**
   * Subscribe to an event
   */
  on(event: string, callback: EventCallback): UnsubscribeFn {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }

    const callbacks = this.events.get(event)!;
    callbacks.add(callback);

    // Return unsubscribe function
    return () => {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.events.delete(event);
      }
    };
  }

  /**
   * Subscribe to an event once
   */
  once(event: string, callback: EventCallback): UnsubscribeFn {
    const wrappedCallback = (...args: unknown[]) => {
      callback(...args);
      this.off(event, wrappedCallback);
    };

    return this.on(event, wrappedCallback);
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, callback?: EventCallback) {
    if (!callback) {
      this.events.delete(event);
      return;
    }

    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.events.delete(event);
      }
    }
  }

  /**
   * Emit an event
   */
  emit(event: string, ...args: unknown[]) {
    // Store in history for late subscribers
    if (!this.eventHistory.has(event)) {
      this.eventHistory.set(event, []);
    }

    const history = this.eventHistory.get(event)!;
    history.push({ timestamp: Date.now(), args });

    // Limit history size
    if (history.length > this.maxHistorySize) {
      history.shift();
    }

    // Call all listeners
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[EventBus] ${event}`, ...args);
    }
  }

  /**
   * Get recent events for debugging
   */
  getEventHistory(event?: string): unknown[] {
    if (event) {
      return this.eventHistory.get(event) || [];
    }

    const allHistory: unknown[] = [];
    this.eventHistory.forEach((history, eventName) => {
      history.forEach((item) => {
        allHistory.push({ event: eventName, ...item });
      });
    });

    return allHistory.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Clear all events and listeners
   */
  clear() {
    this.events.clear();
    this.eventHistory.clear();
  }
}

// Export singleton instance
export const eventBus = new EventBus();

// Export types for module events
export interface ClientEvent {
  id: string;
  name: string;
  email?: string;
  [key: string]: any;
}

export interface ModuleEvent<T = unknown> {
  module: string;
  action: string;
  data: T;
  timestamp?: number;
}

// Typed event emitters for common module events
export const clientEvents = {
  created: (data: ClientEvent) => eventBus.emit('client:created', data),
  updated: (data: ClientEvent) => eventBus.emit('client:updated', data),
  deleted: (data: { id: string; name?: string }) =>
    eventBus.emit('client:deleted', data),
  statusChanged: (data: { id: string; status: string }) =>
    eventBus.emit('client:statusChanged', data),
};
