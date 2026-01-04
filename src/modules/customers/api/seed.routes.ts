import { Router, Request, Response, NextFunction } from 'express';
import { SeedCustomersCommand } from '../commands/seed-customers.command';
import { SeedCustomersHandler } from '../commands/handlers/seed-customers.handler';

const router = Router();

const seedCustomersHandler = new SeedCustomersHandler();

/**
 * POST /seed/customers
 * Seeds the database with test customers.
 * 
 * Query Parameters:
 * - clearExisting: boolean (default: true) - Clear existing customers before seeding
 */
router.post('/customers', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (process.env.NODE_ENV === 'production') {
            res.status(403).json({
                success: false,
                message: 'Seed endpoint is not available in production environment'
            });
            return;
        }

        const clearExisting = req.query.clearExisting !== 'false';

        const command = new SeedCustomersCommand({
            clearExisting
        });

        const result = await seedCustomersHandler.execute(command);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
});

export const customerSeedRouter = router;

