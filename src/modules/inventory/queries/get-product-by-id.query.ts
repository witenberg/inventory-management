import { ICommand } from '../../../core/cqrs';

/**
 * Query to retrieve a single product by ID.
 */
export interface GetProductByIdQueryPayload {
    productId: string;
}

export class GetProductByIdQuery implements ICommand {
    public readonly productId: string;

    constructor(payload: GetProductByIdQueryPayload) {
        if (!payload.productId) {
            throw new Error('Product ID is required');
        }
        this.productId = payload.productId;
    }
}

