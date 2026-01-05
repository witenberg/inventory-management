import { ICommandHandler } from '../../../../core/cqrs';
import { CreateProductCommand } from '../create-product.command';
import { ProductModel } from '../../domain/product.model';
import { AppError } from '../../../../core/errors/AppError';
import { EventBus } from '../../../../core/events';
import { ProductCreatedEvent } from '../../domain/events';

/**
 * Handles the creation of new products.
 * Encapsulates the write logic and interaction with the persistence layer.
 */
export class CreateProductHandler implements ICommandHandler<CreateProductCommand, string> {
    private eventBus: EventBus;

    constructor() {
        this.eventBus = EventBus.getInstance();
    }

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

        const productId = product._id.toString();

        // Publish domain event
        const event = new ProductCreatedEvent(productId, name, price, stock);
        await this.eventBus.publish(event);

        return productId;
    }
}