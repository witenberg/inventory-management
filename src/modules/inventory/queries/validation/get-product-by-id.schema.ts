import { z } from 'zod';

/**
 * Zod schema for getting a product by ID.
 */
export const getProductByIdSchema = z.object({
    id: z
        .string({
            required_error: 'Product ID is required',
        })
        .regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format'),
});

export type GetProductByIdInput = z.infer<typeof getProductByIdSchema>;

