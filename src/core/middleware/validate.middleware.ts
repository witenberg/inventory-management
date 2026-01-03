import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../errors/AppError';

/**
 * Middleware factory for validating requests using Zod schemas.
 * 
 * @param schema - Zod schema to validate against
 * @param source - Where to find the data ('body', 'query', 'params')
 * @returns Express middleware function
 */
export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const data = req[source];
            const validated = await schema.parseAsync(data);

            // Replace the original data with validated data
            req[source] = validated;

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                // Format Zod errors into a more readable structure
                const errors: Record<string, string[]> = {};

                error.errors.forEach((err) => {
                    const path = err.path.join('.');
                    if (!errors[path]) {
                        errors[path] = [];
                    }
                    errors[path].push(err.message);
                });

                next(new ValidationError('Validation failed', errors));
            } else {
                next(error);
            }
        }
    };
};

