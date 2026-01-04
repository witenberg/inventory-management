import { ICommand } from '../../../core/cqrs';

/**
 * Payload definition for selling a product.
 */
export interface SellProductPayload {
    productId: string;
    quantity: number;
}

/**
 * Command to decrease the stock level of a product.
 * Uses atomic operations with conditional updates to prevent race conditions
 * and ensure stock never goes below zero.
 */
export class SellProductCommand implements ICommand {
    constructor(public readonly payload: SellProductPayload) { }
}

