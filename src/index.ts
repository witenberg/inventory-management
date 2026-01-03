import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './infrastructure/database';
import { AppError, ValidationError } from './core/errors/AppError';

// Load config
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Routes ---
app.get('/health', (_req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    res.json({
        status: 'ok',
        database: dbStatus,
        timestamp: new Date().toISOString()
    });
});

app.use('/products', productRouter);
app.use('/seed', seedRouter);

// Global error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Error:', err);

    // Handle ValidationError (400)
    if (err instanceof ValidationError) {
        res.status(400).json({
            success: false,
            message: err.message,
            errors: err.errors
        });
        return;
    }

    // Handle AppError with specific status codes
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message
        });
        return;
    }

    // Handle Mongoose validation errors (should be caught by Zod, but just in case)
    if (err.name === 'ValidationError') {
        res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: err.message
        });
        return;
    }

    // Handle Mongoose CastError (invalid ObjectId)
    if (err.name === 'CastError') {
        res.status(400).json({
            success: false,
            message: 'Invalid ID format'
        });
        return;
    }

    // Default to 500 for unknown errors
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message || 'Internal server error'
    });
});

// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Start server
const startServer = async () => {
    try {
        await connectDatabase();

        const server = app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Health check available at http://localhost:${PORT}/health`);
        });

        // Graceful shutdown
        const shutdown = () => {
            console.log('Shutting down server...');
            server.close(() => {
                mongoose.connection.close(false).then(() => {
                    console.log('MongoDB connection closed');
                    process.exit(0);
                });
            });
        };

        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);

    } catch (error) {
        console.error('Failed to start application:', error);
        process.exit(1);
    }
};

startServer();

// Import mongoose for health check usage only
import mongoose from 'mongoose';
import { productRouter } from './modules/inventory/api/product.routes';
import { seedRouter } from './modules/inventory/api/seed.routes';
