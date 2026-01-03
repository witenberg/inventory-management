import { ICommandHandler } from '../../../../core/cqrs';
import { GetProductsQuery } from '../get-products.query';
import { ProductModel, ProductData } from '../../domain/product.model';
import { AppError } from '../../../../core/errors/AppError';

/**
 * Response interface for paginated products
 */
export interface GetProductsResponse {
    products: ProductData[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

/**
 * Handler for retrieving products with pagination, sorting, and filtering.
 * 
 * Features:
 * - Pagination support
 * - Sorting by multiple fields
 * - Text search in product names
 * - Price range filtering
 * - Stock filtering
 */
export class GetProductsHandler implements ICommandHandler<GetProductsQuery, GetProductsResponse> {

    async execute(query: GetProductsQuery): Promise<GetProductsResponse> {
        try {
            // Build filter object
            const filter: any = {};

            // Text search (case-insensitive)
            if (query.search) {
                filter.name = { $regex: query.search, $options: 'i' };
            }

            // Price range filter
            if (query.minPrice !== undefined || query.maxPrice !== undefined) {
                filter.price = {};
                if (query.minPrice !== undefined) {
                    filter.price.$gte = query.minPrice;
                }
                if (query.maxPrice !== undefined) {
                    filter.price.$lte = query.maxPrice;
                }
            }

            // Stock filter
            if (query.minStock !== undefined) {
                filter.stock = { $gte: query.minStock };
            }

            // Calculate pagination
            const skip = (query.page - 1) * query.limit;

            // Build sort object
            const sort: any = {};
            sort[query.sortBy] = query.sortOrder === 'asc' ? 1 : -1;

            // Execute query with pagination
            const [products, totalItems] = await Promise.all([
                ProductModel
                    .find(filter)
                    .sort(sort)
                    .skip(skip)
                    .limit(query.limit)
                    .lean<ProductData[]>()
                    .exec(),
                ProductModel.countDocuments(filter)
            ]);

            // Calculate pagination metadata
            const totalPages = Math.ceil(totalItems / query.limit);
            const hasNextPage = query.page < totalPages;
            const hasPreviousPage = query.page > 1;

            return {
                products,
                pagination: {
                    currentPage: query.page,
                    totalPages,
                    totalItems,
                    itemsPerPage: query.limit,
                    hasNextPage,
                    hasPreviousPage
                }
            };

        } catch (error) {
            if (error instanceof Error) {
                throw new AppError(`Failed to retrieve products: ${error.message}`, 500);
            }
            throw new AppError('Failed to retrieve products', 500);
        }
    }
}

