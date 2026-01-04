import { z } from 'zod';

/**
 * Zod schema for validating order ID in URL params.
 */
export const getOrderByIdSchema = z.object({
    id: z
        .string({
            required_error: 'Order ID is required',
        })
        .min(1, 'Order ID cannot be empty'),
});

export type GetOrderByIdInput = z.infer<typeof getOrderByIdSchema>;

