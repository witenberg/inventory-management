import { Router, Request, Response, NextFunction } from 'express';
import { CustomerModel } from '../domain/customer.model';
import { AppError } from '../../../core/errors/AppError';
import { validate } from '../../../core/middleware/validate.middleware';
import { z } from 'zod';

const router = Router();

/**
 * Validation schema for creating a customer.
 */
const createCustomerSchema = z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    location: z.enum(['US', 'EUROPE', 'ASIA']),
});

/**
 * POST /customers
 * Creates a new customer.
 * 
 * Body Parameters:
 * - name: string - Customer name
 * - email: string - Customer email (must be unique)
 * - location: string - Customer location (US, EUROPE, ASIA)
 */
router.post('/', validate(createCustomerSchema, 'body'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, location } = req.body;

        // Check for duplicate email
        const existingCustomer = await CustomerModel.findOne({ email });
        if (existingCustomer) {
            throw new AppError(`Customer with email '${email}' already exists`, 409);
        }

        const customer = new CustomerModel({
            name,
            email,
            location
        });

        await customer.save();

        res.status(201).json({
            success: true,
            data: {
                id: customer._id.toString(),
                name: customer.name,
                email: customer.email,
                location: customer.location,
                message: 'Customer created successfully'
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /customers/:id
 * Retrieves a single customer by ID.
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const customer = await CustomerModel.findById(req.params.id).lean().exec();

        if (!customer) {
            throw new AppError('Customer not found', 404);
        }

        res.status(200).json({
            success: true,
            data: customer
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /customers
 * Retrieves all customers.
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const customers = await CustomerModel.find().lean().exec();

        res.status(200).json({
            success: true,
            data: customers
        });
    } catch (error) {
        next(error);
    }
});

export const customerRouter = router;

