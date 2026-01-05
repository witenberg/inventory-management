import { EventBus } from '../core/events';

// Import event handlers from all modules
import { CustomersSeededEventHandler } from '../modules/customers/events/customers-seeded.handler';
import { ProductCreatedEventHandler } from '../modules/inventory/events/product-created.handler';
import { ProductRestockedEventHandler } from '../modules/inventory/events/product-restocked.handler';
import { ProductSoldEventHandler } from '../modules/inventory/events/product-sold.handler';
import { ProductsSeededEventHandler } from '../modules/inventory/events/products-seeded.handler';
import { OrderCreatedEventHandler } from '../modules/orders/events/order-created.handler';

/**
 * Bootstrap event handlers by subscribing them to the EventBus.
 * This should be called once when the application starts.
 * 
 * Event-Driven Architecture Benefits:
 * - Loose coupling between modules
 * - Easy to add new event handlers without modifying existing code
 * - Better scalability and maintainability
 * - Clear separation of concerns
 */
export function bootstrapEventHandlers(): void {
    const eventBus = EventBus.getInstance();

    console.log('[EventBus] Bootstrapping event handlers...');

    // Subscribe Customers module event handlers
    eventBus.subscribe('customers.seeded', new CustomersSeededEventHandler());

    // Subscribe Inventory module event handlers
    eventBus.subscribe('inventory.product.created', new ProductCreatedEventHandler());
    eventBus.subscribe('inventory.product.restocked', new ProductRestockedEventHandler());
    eventBus.subscribe('inventory.product.sold', new ProductSoldEventHandler());
    eventBus.subscribe('inventory.products.seeded', new ProductsSeededEventHandler());

    // Subscribe Orders module event handlers
    eventBus.subscribe('orders.order.created', new OrderCreatedEventHandler());

    console.log('[EventBus] All event handlers registered successfully');
}

