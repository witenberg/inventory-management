import { z } from 'zod';

/**
 * Zod schema for seeding products.
 */
export const seedProductsSchema = z.object({
    clearExisting: z
        .string()
        .optional()
        .transform((val) => val !== 'false'), // Convert string query param to boolean

    count: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : undefined))
        .pipe(
            z.number().positive('Count must be a positive number').optional()
        ),
});

export type SeedProductsInput = z.infer<typeof seedProductsSchema>;

