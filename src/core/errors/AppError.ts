/**
 * Base application error class.
 * * Usage:
 * Throw this error in the Domain or Application layer to stop execution logic.
 * The global error handler middleware will catch it and format the HTTP response.
 * * Example:
 * throw new AppError('Product not found', 404);
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode: number = 500) {
        super(message);

        this.statusCode = statusCode;
        this.isOperational = true;

        // Capture stack trace for debugging purposes
        Error.captureStackTrace(this, this.constructor);

        // Set the prototype explicitly
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

/**
 * Validation error class for input validation failures.
 * Returns 400 Bad Request status code.
 */
export class ValidationError extends AppError {
    public readonly errors?: Record<string, string[]>;

    constructor(message: string, errors?: Record<string, string[]>) {
        super(message, 400);
        this.errors = errors;
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}
