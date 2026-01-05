import { EventEmitter } from 'events';
import { IEventBus, IDomainEvent, IDomainEventHandler } from './event-bus.interface';

/**
 * Simple EventBus implementation using Node.js EventEmitter.
 * Wraps EventEmitter to provide a domain-specific API for publishing domain events.
 * 
 * Design:
 * - Singleton pattern ensures one event bus instance
 * - Uses EventEmitter for reliable event handling
 * - Supports async event handlers
 * - Catches and logs handler errors to prevent cascading failures
 */
export class EventBus implements IEventBus {
    private static instance: EventBus;
    private emitter: EventEmitter;

    private constructor() {
        this.emitter = new EventEmitter();
        // Allow more than 10 listeners (default) for production systems
        this.emitter.setMaxListeners(100);
    }

    /**
     * Get the singleton instance of EventBus.
     */
    public static getInstance(): EventBus {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }

    /**
     * Publish a domain event to all registered handlers.
     * Errors in handlers are caught and logged to prevent cascading failures.
     */
    async publish<TEvent extends IDomainEvent>(event: TEvent): Promise<void> {
        console.log(`[EventBus] Publishing event: ${event.eventType}`, {
            aggregateId: event.aggregateId,
            occurredAt: event.occurredAt,
        });

        // Emit the event - handlers will be called synchronously or asynchronously
        const listeners = this.emitter.listeners(event.eventType);

        // Execute all handlers (supports both sync and async)
        const promises = listeners.map(async (listener) => {
            try {
                await listener(event);
            } catch (error) {
                console.error(
                    `[EventBus] Error in event handler for ${event.eventType}:`,
                    error
                );
                // Continue executing other handlers even if one fails
            }
        });

        await Promise.all(promises);
    }

    /**
     * Subscribe to a specific event type.
     */
    subscribe<TEvent extends IDomainEvent>(
        eventType: string,
        handler: IDomainEventHandler<TEvent>
    ): void {
        console.log(`[EventBus] Subscribing to event: ${eventType}`);
        this.emitter.on(eventType, (event: TEvent) => handler.handle(event));
    }

    /**
     * Unsubscribe from a specific event type.
     */
    unsubscribe<TEvent extends IDomainEvent>(
        eventType: string,
        handler: IDomainEventHandler<TEvent>
    ): void {
        console.log(`[EventBus] Unsubscribing from event: ${eventType}`);
        this.emitter.off(eventType, (event: TEvent) => handler.handle(event));
    }
}

