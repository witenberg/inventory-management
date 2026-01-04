import { z } from 'zod';

/**
 * Zod schema for restocking a product.
 * Validates that the quantity is a positive integer.
 */
export const restockProductSchema = z.object({
    quantity: z
        .number({
            required_error: 'Quantity is required',
            invalid_type_error: 'Quantity must be a number',
        })
        .int('Quantity must be an integer')
        .positive('Quantity must be positive')
        .max(1000000, 'Quantity cannot exceed 1,000,000 per restock operation'),
});

/**
 * Zod schema for validating product ID in URL params.
 */
export const restockProductParamsSchema = z.object({
    id: z
        .string({
            required_error: 'Product ID is required',
        })
        .min(1, 'Product ID cannot be empty'),
});

export type RestockProductInput = z.infer<typeof restockProductSchema>;
export type RestockProductParamsInput = z.infer<typeof restockProductParamsSchema>;

