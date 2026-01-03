import { z } from 'zod';

/**
 * Zod schema for getting products with pagination and filters.
 */
export const getProductsSchema = z.object({
    page: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 1))
        .pipe(z.number().positive('Page must be a positive number').default(1)),
    
    limit: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 10))
        .pipe(
            z.number()
                .positive('Limit must be a positive number')
                .max(100, 'Limit cannot exceed 100')
                .default(10)
        ),
    
    sortBy: z
        .enum(['name', 'price', 'stock', 'createdAt'], {
            errorMap: () => ({ message: 'sortBy must be one of: name, price, stock, createdAt' }),
        })
        .optional()
        .default('createdAt'),
    
    sortOrder: z
        .enum(['asc', 'desc'], {
            errorMap: () => ({ message: 'sortOrder must be either asc or desc' }),
        })
        .optional()
        .default('desc'),
    
    search: z
        .string()
        .trim()
        .optional(),
    
    minPrice: z
        .string()
        .optional()
        .transform((val) => (val ? parseFloat(val) : undefined))
        .pipe(z.number().nonnegative('minPrice must be non-negative').optional()),
    
    maxPrice: z
        .string()
        .optional()
        .transform((val) => (val ? parseFloat(val) : undefined))
        .pipe(z.number().positive('maxPrice must be positive').optional()),
    
    minStock: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : undefined))
        .pipe(z.number().nonnegative('minStock must be non-negative').optional()),
});

export type GetProductsInput = z.infer<typeof getProductsSchema>;

