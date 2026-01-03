import { z } from 'zod';

/**
 * Zod schema for creating a product.
 * Validates all business rules at the API boundary.
 */
export const createProductSchema = z.object({
    name: z
        .string({
            required_error: 'Product name is required',
            invalid_type_error: 'Product name must be a string',
        })
        .trim()
        .min(1, 'Product name cannot be empty')
        .max(50, 'Product name cannot exceed 50 characters'),

    description: z
        .string({
            invalid_type_error: 'Description must be a string',
        })
        .trim()
        .optional(),

    price: z
        .number({
            required_error: 'Price is required',
            invalid_type_error: 'Price must be a number',
        })
        .positive('Price must be positive')
        .min(0.01, 'Price must be at least 0.01'),

    stock: z
        .number({
            required_error: 'Stock is required',
            invalid_type_error: 'Stock must be a number',
        })
        .int('Stock must be an integer')
        .nonnegative('Stock cannot be negative'),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

