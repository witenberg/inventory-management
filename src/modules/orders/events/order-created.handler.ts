import { IDomainEventHandler } from '../../../core/events';
import { OrderCreatedEvent } from '../domain/events';

/**
 * Example event handler that reacts to OrderCreatedEvent.
 * In a real application, this could trigger actions like:
 * - Sending order confirmation emails
 * - Notifying warehouse for fulfillment
 * - Updating sales analytics
 * - Creating invoice documents
 * - Triggering payment processing
 */
export class OrderCreatedEventHandler implements IDomainEventHandler<OrderCreatedEvent> {
    async handle(event: OrderCreatedEvent): Promise<void> {
        console.log(
            `[OrderCreatedEventHandler] Order created: ${event.orderNumber}`,
            {
                orderId: event.aggregateId,
                customerId: event.customerId,
                totalAmount: event.totalAmount,
                productCount: event.productCount,
                occurredAt: event.occurredAt,
            }
        );
    }
}

