import { ICommandHandler } from '../../../../core/cqrs';
import { RestockProductCommand } from '../restock-product.command';
import { ProductModel, ProductData } from '../../domain/product.model';
import { AppError } from '../../../../core/errors/AppError';

/**
 * Handles the restocking of products.
 * 
 * Design Decisions:
 * - Uses MongoDB's atomic $inc operator to prevent race conditions
 * - Multiple concurrent restock requests are safely handled
 * - Returns the updated product data for confirmation
 * 
 * Race Condition Protection:
 * The $inc operator is atomic at the document level in MongoDB.
 * Even if multiple requests arrive simultaneously, MongoDB ensures
 * that each increment is applied sequentially without data loss.
 */
export class RestockProductHandler implements ICommandHandler<RestockProductCommand, ProductData> {

    async execute(command: RestockProductCommand): Promise<ProductData> {
        const { productId, quantity } = command.payload;

        try {
            // Use findByIdAndUpdate with $inc for atomic operation
            // The 'new: true' option returns the updated document
            const updatedProduct = await ProductModel
                .findByIdAndUpdate(
                    productId,
                    { $inc: { stock: quantity } },
                    {
                        new: true,  // Return updated document
                        runValidators: true  // Run schema validators
                    }
                )
                .lean<ProductData>()
                .exec();

            if (!updatedProduct) {
                throw new AppError('Product not found', 404);
            }

            return updatedProduct;

        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            if (error instanceof Error) {
                throw new AppError(`Failed to restock product: ${error.message}`, 500);
            }
            throw new AppError('Failed to restock product', 500);
        }
    }
}

