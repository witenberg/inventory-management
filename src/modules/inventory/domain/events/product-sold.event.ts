import { IDomainEvent } from '../../../../core/events';

/**
 * Event published when a product is sold (stock decreased).
 */
export class ProductSoldEvent implements IDomainEvent {
    readonly eventType = 'inventory.product.sold';
    readonly occurredAt: Date;

    constructor(
        public readonly aggregateId: string,
        public readonly quantity: number,
        public readonly remainingStock: number
    ) {
        this.occurredAt = new Date();
    }
}

