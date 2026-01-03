import { ICommand } from '../../../core/cqrs';

/**
 * Query to retrieve products with pagination, sorting, and filtering.
 * 
 * Parameters:
 * - page: Current page number (starts from 1)
 * - limit: Number of items per page
 * - sortBy: Field to sort by (name, price, stock, createdAt)
 * - sortOrder: Sort direction (asc, desc)
 * - search: Search term for product name
 * - minPrice: Minimum price filter
 * - maxPrice: Maximum price filter
 * - minStock: Minimum stock filter
 */
export interface GetProductsQueryPayload {
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'price' | 'stock' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    minStock?: number;
}

export class GetProductsQuery implements ICommand {
    public readonly page: number;
    public readonly limit: number;
    public readonly sortBy: string;
    public readonly sortOrder: 'asc' | 'desc';
    public readonly search?: string;
    public readonly minPrice?: number;
    public readonly maxPrice?: number;
    public readonly minStock?: number;

    constructor(payload: GetProductsQueryPayload = {}) {
        this.page = payload.page && payload.page > 0 ? payload.page : 1;
        this.limit = payload.limit && payload.limit > 0 && payload.limit <= 100 ? payload.limit : 10;
        this.sortBy = payload.sortBy || 'createdAt';
        this.sortOrder = payload.sortOrder || 'desc';
        this.search = payload.search;
        this.minPrice = payload.minPrice;
        this.maxPrice = payload.maxPrice;
        this.minStock = payload.minStock;
    }
}

