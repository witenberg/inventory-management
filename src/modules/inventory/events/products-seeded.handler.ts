import { IDomainEventHandler } from '../../../core/events';
import { ProductsSeededEvent } from '../domain/events';

/**
 * Example event handler that reacts to ProductsSeededEvent.
 * In a real application, this could trigger actions like:
 * - Rebuilding search indexes
 * - Notifying admin dashboard
 * - Updating analytics
 */
export class ProductsSeededEventHandler implements IDomainEventHandler<ProductsSeededEvent> {
    async handle(event: ProductsSeededEvent): Promise<void> {
        console.log(
            `[ProductsSeededEventHandler] ${event.count} products seeded`,
            { productIds: event.productIds, occurredAt: event.occurredAt }
        );
    }
}

