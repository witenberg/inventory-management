import { IDomainEvent } from '../../../../core/events';

/**
 * Event published when a product is restocked.
 */
export class ProductRestockedEvent implements IDomainEvent {
    readonly eventType = 'inventory.product.restocked';
    readonly occurredAt: Date;

    constructor(
        public readonly aggregateId: string,
        public readonly quantity: number,
        public readonly newStock: number
    ) {
        this.occurredAt = new Date();
    }
}

