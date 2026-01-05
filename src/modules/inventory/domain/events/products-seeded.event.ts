import { IDomainEvent } from '../../../../core/events';

/**
 * Event published when products are seeded into the system.
 */
export class ProductsSeededEvent implements IDomainEvent {
    readonly eventType = 'inventory.products.seeded';
    readonly occurredAt: Date;

    constructor(
        public readonly count: number,
        public readonly productIds: string[]
    ) {
        this.occurredAt = new Date();
    }
}

