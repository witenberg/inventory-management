import mongoose from 'mongoose';
import { SellProductHandler } from '../../../src/modules/inventory/commands/handlers/sell-product.handler';
import { RestockProductHandler } from '../../../src/modules/inventory/commands/handlers/restock-product.handler';
import { SellProductCommand } from '../../../src/modules/inventory/commands/sell-product.command';
import { RestockProductCommand } from '../../../src/modules/inventory/commands/restock-product.command';
import { ProductModel } from '../../../src/modules/inventory/domain/product.model';

/**
 * Integration tests for Stock Management
 * 
 * These tests verify:
 * - Atomic stock operations
 * - Concurrent request handling
 * - Stock cannot go negative
 */
describe('Stock Management Integration Tests', () => {
    let sellHandler: SellProductHandler;
    let restockHandler: RestockProductHandler;

    beforeAll(() => {
        // Connection is handled by tests/setup.ts
        sellHandler = new SellProductHandler();
        restockHandler = new RestockProductHandler();
    });

    describe('Sell Product', () => {
        it('should decrease stock atomically', async () => {
            // Arrange: Create product with stock
            const product = await ProductModel.create({
                name: 'Test Product',
                description: 'Product for testing',
                price: 100,
                stock: 50
            });

            // Act: Sell 10 units
            const command = new SellProductCommand({
                productId: product._id.toString(),
                quantity: 10
            });

            const result = await sellHandler.execute(command);

            // Assert
            expect(result.stock).toBe(40);

            const updated = await ProductModel.findById(product._id);
            expect(updated?.stock).toBe(40);
        });

        it('should prevent stock from going negative', async () => {
            // Arrange: Create product with low stock
            const product = await ProductModel.create({
                name: 'Low Stock Product',
                description: 'Product for testing',
                price: 100,
                stock: 5
            });

            // Act & Assert: Try to sell more than available
            const command = new SellProductCommand({
                productId: product._id.toString(),
                quantity: 10
            });

            await expect(sellHandler.execute(command)).rejects.toThrow('Insufficient stock');

            // Verify stock unchanged
            const unchanged = await ProductModel.findById(product._id);
            expect(unchanged?.stock).toBe(5);
        });

        it('should handle selling exact stock amount', async () => {
            // Arrange: Create product
            const product = await ProductModel.create({
                name: 'Product',
                description: 'Product for testing',
                price: 100,
                stock: 10
            });

            // Act: Sell all stock
            const command = new SellProductCommand({
                productId: product._id.toString(),
                quantity: 10
            });

            const result = await sellHandler.execute(command);

            // Assert: Stock is now 0
            expect(result.stock).toBe(0);

            const updated = await ProductModel.findById(product._id);
            expect(updated?.stock).toBe(0);
        });

        it('should reject selling from zero stock', async () => {
            // Arrange: Create product with 0 stock
            const product = await ProductModel.create({
                name: 'Out of Stock',
                description: 'Product for testing',
                price: 100,
                stock: 0
            });

            // Act & Assert
            const command = new SellProductCommand({
                productId: product._id.toString(),
                quantity: 1
            });

            await expect(sellHandler.execute(command)).rejects.toThrow('Insufficient stock');
        });
    });

    describe('Restock Product', () => {
        it('should increase stock atomically', async () => {
            // Arrange: Create product
            const product = await ProductModel.create({
                name: 'Product',
                description: 'Product for testing',
                price: 100,
                stock: 10
            });

            // Act: Restock 20 units
            const command = new RestockProductCommand({
                productId: product._id.toString(),
                quantity: 20
            });

            const result = await restockHandler.execute(command);

            // Assert
            expect(result.stock).toBe(30);

            const updated = await ProductModel.findById(product._id);
            expect(updated?.stock).toBe(30);
        });

        it('should handle restocking zero stock product', async () => {
            // Arrange: Create out-of-stock product
            const product = await ProductModel.create({
                name: 'Out of Stock',
                description: 'Product for testing',
                price: 100,
                stock: 0
            });

            // Act: Restock
            const command = new RestockProductCommand({
                productId: product._id.toString(),
                quantity: 50
            });

            const result = await restockHandler.execute(command);

            // Assert
            expect(result.stock).toBe(50);

            const updated = await ProductModel.findById(product._id);
            expect(updated?.stock).toBe(50);
        });
    });

    describe('Concurrent Operations', () => {
        it('should handle multiple simultaneous restocks correctly', async () => {
            // Arrange: Create product
            const product = await ProductModel.create({
                name: 'Product',
                description: 'Product for testing',
                price: 100,
                stock: 10
            });

            // Act: 5 concurrent restocks of 1 unit each
            const commands = Array(5).fill(0).map(() =>
                restockHandler.execute(
                    new RestockProductCommand({
                        productId: product._id.toString(),
                        quantity: 1
                    })
                )
            );

            await Promise.all(commands);

            // Assert: Stock should be 10 + 5 = 15
            const updated = await ProductModel.findById(product._id);
            expect(updated?.stock).toBe(15);
        });

        it('should handle concurrent sell operations safely', async () => {
            // Arrange: Create product with enough stock
            const product = await ProductModel.create({
                name: 'Product',
                description: 'Product for testing',
                price: 100,
                stock: 50
            });

            // Act: 5 concurrent sells of 5 units each (total 25)
            const commands = Array(5).fill(0).map(() =>
                sellHandler.execute(
                    new SellProductCommand({
                        productId: product._id.toString(),
                        quantity: 5
                    })
                )
            );

            const results = await Promise.allSettled(commands);

            // Assert: All should succeed since we have enough stock
            const succeeded = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            expect(succeeded).toBe(5);
            expect(failed).toBe(0);

            // Final stock should be 50 - 25 = 25
            const updated = await ProductModel.findById(product._id);
            expect(updated?.stock).toBe(25);
        });

        it('should prevent overselling in concurrent scenarios', async () => {
            // Arrange: Create product with limited stock
            const product = await ProductModel.create({
                name: 'Product',
                description: 'Product for testing',
                price: 100,
                stock: 10
            });

            // Act: 5 concurrent attempts to sell 8 units each
            // Only one should succeed, others should fail
            const commands = Array(5).fill(0).map(() =>
                sellHandler.execute(
                    new SellProductCommand({
                        productId: product._id.toString(),
                        quantity: 8
                    })
                )
            );

            const results = await Promise.allSettled(commands);

            // Assert: Only 1 should succeed (10 - 8 = 2 remaining)
            const succeeded = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            expect(succeeded).toBe(1);
            expect(failed).toBe(4);

            // Final stock should be 2 (not negative!)
            const updated = await ProductModel.findById(product._id);
            expect(updated?.stock).toBe(2);
        });
    });

    describe('Edge Cases', () => {
        it('should reject operation on non-existent product', async () => {
            // Arrange: Non-existent product ID
            const fakeId = new mongoose.Types.ObjectId().toString();

            // Act & Assert
            const command = new SellProductCommand({
                productId: fakeId,
                quantity: 1
            });

            await expect(sellHandler.execute(command)).rejects.toThrow('Product not found');
        });

        it('should handle large stock quantities', async () => {
            // Arrange: Create product with very large stock
            const product = await ProductModel.create({
                name: 'Product',
                description: 'Product for testing',
                price: 100,
                stock: 1000000
            });

            // Act: Sell a large quantity
            const command = new SellProductCommand({
                productId: product._id.toString(),
                quantity: 500000
            });

            const result = await sellHandler.execute(command);

            // Assert
            expect(result.stock).toBe(500000);
        });
    });
});
