import { Router, Request, Response, NextFunction } from 'express';
import { CreateOrderCommand } from '../commands/create-order.command';
import { CreateOrderHandler } from '../commands/handlers/create-order.handler';
import { GetOrderByIdQuery } from '../queries/get-order-by-id.query';
import { GetOrderByIdHandler } from '../queries/handlers/get-order-by-id.handler';
import { validate } from '../../../core/middleware/validate.middleware';
import { createOrderSchema } from '../commands/validation/create-order.schema';
import { getOrderByIdSchema } from '../queries/validation/get-order-by-id.schema';

const router = Router();

// Dependency Injection
const createOrderHandler = new CreateOrderHandler();
const getOrderByIdHandler = new GetOrderByIdHandler();

/**
 * POST /orders
 * Creates a new order.
 * 
 * This endpoint:
 * 1. Validates customer exists
 * 2. Validates products exist and have sufficient stock
 * 3. Calculates location-based pricing
 * 4. Applies best discount (volume or promotional)
 * 5. Atomically updates stock levels
 * 6. Creates order record
 * 
 * Body Parameters:
 * - customerId: string - Customer ID
 * - products: array - Array of { productId, quantity }
 * 
 * Example:
 * POST /orders
 * {
 *   "customerId": "507f1f77bcf86cd799439011",
 *   "products": [
 *     { "productId": "507f1f77bcf86cd799439012", "quantity": 5 },
 *     { "productId": "507f1f77bcf86cd799439013", "quantity": 3 }
 *   ]
 * }
 */
router.post('/', validate(createOrderSchema, 'body'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { customerId, products } = req.body;

        const command = new CreateOrderCommand({
            customerId,
            products
        });

        const orderId = await createOrderHandler.execute(command);

        res.status(201).json({
            success: true,
            data: {
                orderId,
                message: 'Order created successfully'
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /orders/:id
 * Retrieves a single order by ID.
 * 
 * Returns complete order details including:
 * - Customer information
 * - Product details with pricing
 * - Location pricing adjustments
 * - Applied discounts
 * - Final total amount
 */
router.get('/:id', validate(getOrderByIdSchema, 'params'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = new GetOrderByIdQuery(req.params.id);
        const order = await getOrderByIdHandler.execute(query);

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
});

export const orderRouter = router;

