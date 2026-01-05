import { IDomainEventHandler } from '../../../core/events';
import { ProductRestockedEvent } from '../domain/events';

/**
 * Example event handler that reacts to ProductRestockedEvent.
 * In a real application, this could trigger actions like:
 * - Notifying warehouse management
 * - Updating inventory reports
 * - Triggering low-stock alerts cancellation
 * - Updating analytics dashboards
 */
export class ProductRestockedEventHandler implements IDomainEventHandler<ProductRestockedEvent> {
    async handle(event: ProductRestockedEvent): Promise<void> {
        console.log(
            `[ProductRestockedEventHandler] Product restocked`,
            {
                productId: event.aggregateId,
                quantity: event.quantity,
                newStock: event.newStock,
                occurredAt: event.occurredAt,
            }
        );
    }
}

