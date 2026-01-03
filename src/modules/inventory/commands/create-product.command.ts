import { ICommand } from '../../../core/cqrs';

/**
 * Payload definition for creating a product.
 */
export interface CreateProductPayload {
    name: string;
    description?: string;
    price: number;
    stock: number;
}

/**
 * Command to create a new product.
 * Returns the ID of the created product as a string.
 */
export class CreateProductCommand implements ICommand {
    constructor(public readonly payload: CreateProductPayload) { }
}