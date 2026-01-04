import { ICommandHandler } from '../../../../core/cqrs';
import { SellProductCommand } from '../sell-product.command';
import { ProductModel, ProductData } from '../../domain/product.model';
import { AppError } from '../../../../core/errors/AppError';

/**
 * Handles the selling of products (decreasing stock).
 * 
 * Design Decisions:
 * - Uses MongoDB's atomic findOneAndUpdate with conditional query
 * - Ensures stock never goes below zero, even with concurrent requests
 * - Returns the updated product data for confirmation
 * 
 * Race Condition Protection:
 * The key to preventing race conditions is using a conditional update:
 * - We query for documents where: _id matches AND stock >= quantity
 * - We atomically decrement the stock using $inc
 * - If the condition fails (insufficient stock), no update occurs
 * - This is atomic at the document level, preventing race conditions
 * 
 * Example Race Condition Scenario (PREVENTED):
 * - Initial stock: 5
 * - Request A: sell 3 (arrives at T0)
 * - Request B: sell 3 (arrives at T0)
 * - Without protection: stock could become -1
 * - With protection: One request succeeds (stock=2), other fails (insufficient stock)
 */
export class SellProductHandler implements ICommandHandler<SellProductCommand, ProductData> {

    async execute(command: SellProductCommand): Promise<ProductData> {
        const { productId, quantity } = command.payload;

        try {
            // Use findOneAndUpdate with conditional query for atomic operation
            // The query condition ensures we only update if sufficient stock exists
            const updatedProduct = await ProductModel
                .findOneAndUpdate(
                    {
                        _id: productId,
                        stock: { $gte: quantity }  // Critical: only update if stock is sufficient
                    },
                    { $inc: { stock: -quantity } },  // Atomic decrement
                    {
                        new: true,  // Return updated document
                        runValidators: true  // Run schema validators
                    }
                )
                .lean<ProductData>()
                .exec();

            // If no document was updated, either product doesn't exist or insufficient stock
            if (!updatedProduct) {
                // Check if product exists to provide better error message
                const product = await ProductModel.findById(productId).lean().exec();

                if (!product) {
                    throw new AppError('Product not found', 404);
                }

                // Product exists but insufficient stock
                throw new AppError(
                    `Insufficient stock. Requested: ${quantity}, Available: ${product.stock}`,
                    400
                );
            }

            return updatedProduct;

        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            if (error instanceof Error) {
                throw new AppError(`Failed to sell product: ${error.message}`, 500);
            }
            throw new AppError('Failed to sell product', 500);
        }
    }
}

