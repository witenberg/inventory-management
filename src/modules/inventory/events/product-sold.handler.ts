import { IDomainEventHandler } from '../../../core/events';
import { ProductSoldEvent } from '../domain/events';

/**
 * Example event handler that reacts to ProductSoldEvent.
 * In a real application, this could trigger actions like:
 * - Checking for low stock and triggering alerts
 * - Updating sales analytics
 * - Notifying warehouse to prepare for reorder
 * - Updating product recommendations
 */
export class ProductSoldEventHandler implements IDomainEventHandler<ProductSoldEvent> {
    async handle(event: ProductSoldEvent): Promise<void> {
        console.log(
            `[ProductSoldEventHandler] Product sold`,
            {
                productId: event.aggregateId,
                quantitySold: event.quantity,
                remainingStock: event.remainingStock,
                occurredAt: event.occurredAt,
            }
        );

        // Check for low stock
        if (event.remainingStock < 10) {
            console.warn(
                `[ProductSoldEventHandler] Low stock alert for product ${event.aggregateId}`,
                { remainingStock: event.remainingStock }
            );
        }
    }
}

