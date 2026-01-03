import { ICommand } from '../../../core/cqrs';

/**
 * Command to seed the database with test products.
 * Options:
 * - clearExisting: If true, removes all existing products before seeding
 * - count: Number of products to create (optional, uses default test data if not specified)
 */
export interface SeedProductsCommandPayload {
    clearExisting?: boolean;
    count?: number;
}

export class SeedProductsCommand implements ICommand {
    public readonly clearExisting: boolean;
    public readonly count?: number;

    constructor(payload: SeedProductsCommandPayload = {}) {
        this.clearExisting = payload.clearExisting ?? true;
        this.count = payload.count;
    }
}

