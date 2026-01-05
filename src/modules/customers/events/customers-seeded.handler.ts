import { IDomainEventHandler } from '../../../core/events';
import { CustomersSeededEvent } from '../domain/events';

/**
 * Example event handler that reacts to CustomersSeededEvent.
 * In a real application, this could trigger actions like:
 * - Sending welcome emails
 * - Creating user accounts
 * - Notifying analytics systems
 * - Updating search indexes
 */
export class CustomersSeededEventHandler implements IDomainEventHandler<CustomersSeededEvent> {
    async handle(event: CustomersSeededEvent): Promise<void> {
        console.log(
            `[CustomersSeededEventHandler] ${event.count} customers seeded`,
            { customerIds: event.customerIds, occurredAt: event.occurredAt }
        );
    }
}

