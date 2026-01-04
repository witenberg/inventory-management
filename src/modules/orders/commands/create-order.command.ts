import { ICommand } from '../../../core/cqrs';

/**
 * Product item in order creation request.
 */
export interface OrderProductInput {
    productId: string;
    quantity: number;
}

/**
 * Payload definition for creating an order.
 */
export interface CreateOrderPayload {
    customerId: string;
    products: OrderProductInput[];
}

/**
 * Command to create a new order.
 * 
 * This command will:
 * 1. Validate customer exists
 * 2. Validate all products exist and have sufficient stock
 * 3. Calculate pricing with location adjustments
 * 4. Calculate and apply best discount
 * 5. Atomically update stock levels
 * 6. Create order record
 * 
 * Returns the order ID as a string.
 */
export class CreateOrderCommand implements ICommand {
    constructor(public readonly payload: CreateOrderPayload) { }
}

