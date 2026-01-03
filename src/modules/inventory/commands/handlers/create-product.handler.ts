import { ICommandHandler } from '../../../../core/cqrs';
import { CreateProductCommand } from '../create-product.command';
import { ProductModel } from '../../domain/product.model';
import { AppError } from '../../../../core/errors/AppError';

/**
 * Handles the creation of new products.
 * Encapsulates the write logic and interaction with the persistence layer.
 */
export class CreateProductHandler implements ICommandHandler<CreateProductCommand, string> {

    async execute(command: CreateProductCommand): Promise<string> {
        const { name, description, price, stock } = command.payload;

        // Check for duplicates (Business Logic)
        const existingProduct = await ProductModel.findOne({ name });
        if (existingProduct) {
            throw new AppError(`Product with name '${name}' already exists`, 409);
        }

        const product = new ProductModel({
            name,
            description,
            price,
            stock
        });

        await product.save();

        return product._id.toString();
    }
}