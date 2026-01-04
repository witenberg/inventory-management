import { z } from 'zod';

/**
 * Zod schema for creating an order.
 * Validates all business rules at the API boundary.
 */
export const createOrderSchema = z.object({
    customerId: z
        .string({
            required_error: 'Customer ID is required',
            invalid_type_error: 'Customer ID must be a string',
        })
        .min(1, 'Customer ID cannot be empty'),

    products: z
        .array(
            z.object({
                productId: z
                    .string({
                        required_error: 'Product ID is required',
                        invalid_type_error: 'Product ID must be a string',
                    })
                    .min(1, 'Product ID cannot be empty'),

                quantity: z
                    .number({
                        required_error: 'Quantity is required',
                        invalid_type_error: 'Quantity must be a number',
                    })
                    .int('Quantity must be an integer')
                    .positive('Quantity must be positive')
                    .max(10000, 'Quantity cannot exceed 10,000 per product'),
            })
        )
        .min(1, 'Order must contain at least one product')
        .max(100, 'Order cannot contain more than 100 different products'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

