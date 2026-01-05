import { IDomainEvent } from '../../../../core/events';

/**
 * Event published when a new order is created.
 */
export class OrderCreatedEvent implements IDomainEvent {
    readonly eventType = 'orders.order.created';
    readonly occurredAt: Date;

    constructor(
        public readonly aggregateId: string,
        public readonly orderNumber: string,
        public readonly customerId: string,
        public readonly totalAmount: number,
        public readonly productCount: number
    ) {
        this.occurredAt = new Date();
    }
}

