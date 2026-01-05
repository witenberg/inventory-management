import { IDomainEvent } from '../../../../core/events';

/**
 * Event published when a new product is created.
 */
export class ProductCreatedEvent implements IDomainEvent {
    readonly eventType = 'inventory.product.created';
    readonly occurredAt: Date;

    constructor(
        public readonly aggregateId: string,
        public readonly name: string,
        public readonly price: number,
        public readonly stock: number
    ) {
        this.occurredAt = new Date();
    }
}

