import { ICommandHandler } from '../../../../core/cqrs';
import { GetProductByIdQuery } from '../get-product-by-id.query';
import { ProductModel, ProductData } from '../../domain/product.model';
import { AppError } from '../../../../core/errors/AppError';

/**
 * Handler for retrieving a single product by ID.
 */
export class GetProductByIdHandler implements ICommandHandler<GetProductByIdQuery, ProductData> {

    async execute(query: GetProductByIdQuery): Promise<ProductData> {
        try {
            const product = await ProductModel.findById(query.productId).lean<ProductData>().exec();

            if (!product) {
                throw new AppError('Product not found', 404);
            }

            return product;

        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            if (error instanceof Error) {
                throw new AppError(`Failed to retrieve product: ${error.message}`, 500);
            }
            throw new AppError('Failed to retrieve product', 500);
        }
    }
}

