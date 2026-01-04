import { ICommand } from '../../../core/cqrs';

/**
 * Payload definition for restocking a product.
 */
export interface RestockProductPayload {
    productId: string;
    quantity: number;
}

/**
 * Command to increase the stock level of a product.
 * Uses atomic operations to prevent race conditions.
 */
export class RestockProductCommand implements ICommand {
    constructor(public readonly payload: RestockProductPayload) { }
}

