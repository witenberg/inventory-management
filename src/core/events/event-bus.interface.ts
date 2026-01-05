/**
 * Base interface for all domain events.
 * Every domain event should have a timestamp and event type.
 */
export interface IDomainEvent {
    readonly eventType: string;
    readonly occurredAt: Date;
    readonly aggregateId?: string;
}

/**
 * Handler for domain events.
 */
export interface IDomainEventHandler<TEvent extends IDomainEvent> {
    handle(event: TEvent): Promise<void> | void;
}

/**
 * Event bus interface for publishing and subscribing to domain events.
 */
export interface IEventBus {
    /**
     * Publish a domain event to all registered handlers.
     */
    publish<TEvent extends IDomainEvent>(event: TEvent): Promise<void>;

    /**
     * Subscribe to a specific event type.
     */
    subscribe<TEvent extends IDomainEvent>(
        eventType: string,
        handler: IDomainEventHandler<TEvent>
    ): void;

    /**
     * Unsubscribe from a specific event type.
     */
    unsubscribe<TEvent extends IDomainEvent>(
        eventType: string,
        handler: IDomainEventHandler<TEvent>
    ): void;
}

