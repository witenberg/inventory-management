import { Router, Request, Response, NextFunction } from 'express';
import { CreateProductCommand } from '../commands/create-product.command';
import { CreateProductHandler } from '../commands/handlers/create-product.handler';
import { GetProductsQuery } from '../queries/get-products.query';
import { GetProductsHandler } from '../queries/handlers/get-products.handler';
import { GetProductByIdQuery } from '../queries/get-product-by-id.query';
import { GetProductByIdHandler } from '../queries/handlers/get-product-by-id.handler';
import { validate } from '../../../core/middleware/validate.middleware';
import { createProductSchema } from '../commands/validation/create-product.schema';
import { getProductsSchema } from '../queries/validation/get-products.schema';
import { getProductByIdSchema } from '../queries/validation/get-product-by-id.schema';

const router = Router();

// Dependency Injection (simplified for this task)
const createProductHandler = new CreateProductHandler();
const getProductsHandler = new GetProductsHandler();
const getProductByIdHandler = new GetProductByIdHandler();

/**
 * GET /products
 * Retrieves a paginated list of products with optional filtering and sorting.
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 * - sortBy: Sort field - name, price, stock, createdAt (default: createdAt)
 * - sortOrder: Sort direction - asc, desc (default: desc)
 * - search: Search term for product name
 * - minPrice: Minimum price filter
 * - maxPrice: Maximum price filter
 * - minStock: Minimum stock filter
 * 
 * Example: GET /products?page=1&limit=20&sortBy=price&sortOrder=asc&search=laptop
 */
router.get('/', validate(getProductsSchema, 'query'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validatedQuery = req.query as any;

        const query = new GetProductsQuery({
            page: validatedQuery.page,
            limit: validatedQuery.limit,
            sortBy: validatedQuery.sortBy,
            sortOrder: validatedQuery.sortOrder,
            search: validatedQuery.search,
            minPrice: validatedQuery.minPrice,
            maxPrice: validatedQuery.maxPrice,
            minStock: validatedQuery.minStock,
        });

        const result = await getProductsHandler.execute(query);

        res.status(200).json({
            success: true,
            data: result.products,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /products/:id
 * Retrieves a single product by ID.
 */
router.get('/:id', validate(getProductByIdSchema, 'params'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = new GetProductByIdQuery({
            productId: req.params.id
        });

        const product = await getProductByIdHandler.execute(query);

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /products
 * Creates a new product in the inventory.
 */
router.post('/', validate(createProductSchema, 'body'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, description, price, stock } = req.body;

        const command = new CreateProductCommand({
            name,
            description,
            price,
            stock
        });

        const productId = await createProductHandler.execute(command);

        res.status(201).json({
            success: true,
            data: {
                id: productId,
                message: 'Product created successfully'
            }
        });
    } catch (error) {
        next(error);
    }
});

export const productRouter = router;