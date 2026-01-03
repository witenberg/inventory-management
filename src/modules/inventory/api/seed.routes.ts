import { Router, Request, Response, NextFunction } from 'express';
import { SeedProductsCommand } from '../commands/seed-products.command';
import { SeedProductsHandler } from '../commands/handlers/seed-products.handler';
import { validate } from '../../../core/middleware/validate.middleware';
import { seedProductsSchema } from '../commands/validation/seed-products.schema';

const router = Router();

// Dependency Injection
const seedProductsHandler = new SeedProductsHandler();

/**
 * POST /seed/products
 * Seeds the database with test products.
 * 
 * Query Parameters:
 * - clearExisting: boolean (default: true) - Clear existing products before seeding
 * - count: number (optional) - Number of products to create
 * 
 * Example: POST /seed/products?clearExisting=true&count=10
 */
router.post('/products', validate(seedProductsSchema, 'query'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (process.env.NODE_ENV === 'production') {
            res.status(403).json({
                success: false,
                message: 'Seed endpoint is not available in production environment'
            });
            return;
        }

        const validatedQuery = req.query as any;

        const command = new SeedProductsCommand({
            clearExisting: validatedQuery.clearExisting,
            count: validatedQuery.count
        });

        const result = await seedProductsHandler.execute(command);

        res.status(200).json({
            success: true,
            data: {
                productsCreated: result.count,
                message: result.message,
                clearedExisting: command.clearExisting
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /seed/products
 * Clears all products from the database.
 */
router.delete('/products', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Security check: Only allow in non-production environments
        if (process.env.NODE_ENV === 'production') {
            res.status(403).json({
                success: false,
                message: 'Clear endpoint is not available in production environment'
            });
            return;
        }

        const { ProductModel } = await import('../../inventory/domain/product.model');
        const result = await ProductModel.deleteMany({});

        res.status(200).json({
            success: true,
            data: {
                deletedCount: result.deletedCount,
                message: `Successfully deleted ${result.deletedCount} products`
            }
        });
    } catch (error) {
        next(error);
    }
});

export const seedRouter = router;

