import { IDomainEventHandler } from '../../../core/events';
import { ProductCreatedEvent } from '../domain/events';

/**
 * Example event handler that reacts to ProductCreatedEvent.
 * In a real application, this could trigger actions like:
 * - Updating search indexes
 * - Notifying warehouse systems
 * - Sending notifications to admin dashboard
 * - Creating audit logs
 */
export class ProductCreatedEventHandler implements IDomainEventHandler<ProductCreatedEvent> {
    async handle(event: ProductCreatedEvent): Promise<void> {
        console.log(
            `[ProductCreatedEventHandler] Product created: ${event.name}`,
            {
                productId: event.aggregateId,
                price: event.price,
                stock: event.stock,
                occurredAt: event.occurredAt,
            }
        );
    }
}

