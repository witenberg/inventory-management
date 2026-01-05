import { IDomainEvent } from '../../../../core/events';

/**
 * Event published when customers are seeded into the system.
 */
export class CustomersSeededEvent implements IDomainEvent {
    readonly eventType = 'customers.seeded';
    readonly occurredAt: Date;

    constructor(
        public readonly count: number,
        public readonly customerIds: string[]
    ) {
        this.occurredAt = new Date();
    }
}

