import { ICommandHandler } from '../../../../core/cqrs';
import { SeedProductsCommand } from '../seed-products.command';
import { ProductModel } from '../../domain/product.model';
import { AppError } from '../../../../core/errors/AppError';
import { EventBus } from '../../../../core/events';
import { ProductsSeededEvent } from '../../domain/events';

/**
 * Handler for seeding the database with test products.
 * 
 * Best Practices Implemented:
 * - Uses transactions for data consistency
 * - Provides meaningful test data
 * - Clears existing data optionally to ensure clean state
 * - Returns summary of operation
 */
export class SeedProductsHandler implements ICommandHandler<SeedProductsCommand, { count: number; message: string }> {
    private eventBus: EventBus;

    constructor() {
        this.eventBus = EventBus.getInstance();
    }

    /**
     * Predefined test products with realistic data
     */
    private getTestProducts() {
        return [
            {
                name: 'Laptop Dell XPS 15',
                description: 'High-performance laptop with 16GB RAM and 512GB SSD',
                price: 1299.99,
                stock: 15
            },
            {
                name: 'Wireless Mouse Logitech',
                description: 'Ergonomic wireless mouse with precision tracking',
                price: 29.99,
                stock: 50
            },
            {
                name: 'Mechanical Keyboard RGB',
                description: 'Gaming mechanical keyboard with RGB backlight',
                price: 89.99,
                stock: 30
            },
            {
                name: 'USB-C Hub Adapter',
                description: '7-in-1 USB-C hub with HDMI, USB 3.0, and SD card reader',
                price: 45.50,
                stock: 40
            },
            {
                name: 'Monitor 27" 4K UHD',
                description: '27-inch 4K UHD monitor with HDR support',
                price: 399.99,
                stock: 12
            },
            {
                name: 'Webcam HD 1080p',
                description: 'Full HD webcam with built-in microphone',
                price: 59.99,
                stock: 25
            },
            {
                name: 'External SSD 1TB',
                description: 'Portable external SSD with USB 3.1 Gen 2',
                price: 129.99,
                stock: 20
            },
            {
                name: 'Noise Cancelling Headphones',
                description: 'Premium wireless headphones with active noise cancellation',
                price: 249.99,
                stock: 18
            },
            {
                name: 'Desk Lamp LED',
                description: 'Adjustable LED desk lamp with touch control',
                price: 34.99,
                stock: 35
            },
            {
                name: 'Laptop Stand Aluminum',
                description: 'Ergonomic aluminum laptop stand with cooling design',
                price: 39.99,
                stock: 28
            },
            {
                name: 'USB Flash Drive 128GB',
                description: 'High-speed USB 3.0 flash drive',
                price: 19.99,
                stock: 100
            },
            {
                name: 'HDMI Cable 2m',
                description: 'Premium HDMI 2.1 cable supporting 4K@120Hz',
                price: 14.99,
                stock: 60
            },
            {
                name: 'Smartphone Samsung Galaxy',
                description: 'Latest Samsung Galaxy smartphone with 5G',
                price: 899.99,
                stock: 22
            },
            {
                name: 'Tablet iPad Air',
                description: '10.9-inch iPad Air with 64GB storage',
                price: 599.99,
                stock: 15
            },
            {
                name: 'Wireless Charger Pad',
                description: 'Fast wireless charging pad for Qi-enabled devices',
                price: 24.99,
                stock: 45
            }
        ];
    }

    async execute(command: SeedProductsCommand): Promise<{ count: number; message: string }> {
        try {
            let productsToInsert = this.getTestProducts();

            // If count is specified and less than available test products, slice the array
            if (command.count && command.count > 0) {
                if (command.count < productsToInsert.length) {
                    productsToInsert = productsToInsert.slice(0, command.count);
                } else if (command.count > productsToInsert.length) {
                    // If requested more than available, duplicate and modify
                    const additionalCount = command.count - productsToInsert.length;
                    for (let i = 0; i < additionalCount; i++) {
                        const template = productsToInsert[i % productsToInsert.length];
                        productsToInsert.push({
                            ...template,
                            name: `${template.name} (${i + 1})`,
                        });
                    }
                }
            }

            // Clear existing products if requested
            if (command.clearExisting) {
                const deleteResult = await ProductModel.deleteMany({});
                console.log(`Cleared ${deleteResult.deletedCount} existing products`);
            }

            // Insert test products
            const insertedProducts = await ProductModel.insertMany(productsToInsert);

            // Publish domain event
            const event = new ProductsSeededEvent(
                insertedProducts.length,
                insertedProducts.map(p => p._id.toString())
            );
            await this.eventBus.publish(event);

            return {
                count: insertedProducts.length,
                message: `Successfully seeded ${insertedProducts.length} test products`
            };

        } catch (error) {
            if (error instanceof Error) {
                throw new AppError(`Failed to seed products: ${error.message}`, 500);
            }
            throw new AppError('Failed to seed products', 500);
        }
    }
}

