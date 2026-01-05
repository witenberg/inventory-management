import mongoose from 'mongoose';
import { CreateOrderHandler } from '../../../src/modules/orders/commands/handlers/create-order.handler';
import { CreateOrderCommand } from '../../../src/modules/orders/commands/create-order.command';
import { ProductModel } from '../../../src/modules/inventory/domain/product.model';
import { CustomerModel, CustomerLocation } from '../../../src/modules/customers/domain/customer.model';
import { OrderModel } from '../../../src/modules/orders/domain/order.model';

/**
 * Integration tests for Order Creation Flow
 * 
 * These tests use real MongoDB connection to verify:
 * - Complete order creation flow
 * - Stock updates with transactions
 * - Discount calculations
 * - Database consistency
 */
describe('Order Creation Integration Tests', () => {
    let handler: CreateOrderHandler;

    beforeAll(() => {
        // Connection is handled by tests/setup.ts
        handler = new CreateOrderHandler();
    });

    describe('Basic Order Creation', () => {
        it('should create order and update stock atomically', async () => {
            // Arrange: Create test customer and product
            const customer = await CustomerModel.create({
                name: 'Test Customer',
                email: `test-${Date.now()}@example.com`,
                location: CustomerLocation.US
            });

            const product = await ProductModel.create({
                name: 'Test Product',
                description: 'Test Description',
                price: 100,
                stock: 50
            });

            const initialStock = product.stock;

            // Act: Create order
            const command = new CreateOrderCommand({
                customerId: customer._id.toString(),
                products: [
                    {
                        productId: product._id.toString(),
                        quantity: 3  // <5 units gets no discount
                    }
                ]
            });

            const orderId = await handler.execute(command);

            // Assert: Order created
            expect(orderId).toBeDefined();

            const order = await OrderModel.findById(orderId);
            expect(order).toBeDefined();
            expect(order?.customerId.toString()).toBe(customer._id.toString());
            expect(order?.products.length).toBe(1);
            expect(order?.products[0].productId).toBe(product._id.toString());
            expect(order?.products[0].quantity).toBe(3);
            expect(order?.status).toBe('CONFIRMED'); // Order is confirmed after successful creation

            // Assert: Stock updated
            const updatedProduct = await ProductModel.findById(product._id);
            expect(updatedProduct?.stock).toBe(initialStock - 3);

            // Assert: Pricing (US customer, <5 units gets no volume discount)
            expect(order?.subtotalBeforeDiscount).toBe(300); // 3 * 100
            // totalAmount may have promotional discount if active (e.g., Holiday Sales)
            // If no promotional discount, totalAmount should equal subtotalBeforeDiscount
            if (order?.discount.type === 'PROMOTIONAL') {
                // Promotional discount is active (e.g., 15% Holiday Sales)
                const expectedDiscount = 300 * (order.discount.percentage / 100);
                expect(order?.totalAmount).toBeCloseTo(300 - expectedDiscount, 2);
            } else {
                // No discount applied
                expect(order?.totalAmount).toBe(300);
            }
        });

        it('should rollback on insufficient stock', async () => {
            // Arrange: Create test customer and product with low stock
            const customer = await CustomerModel.create({
                name: 'Test Customer',
                email: `test-${Date.now()}@example.com`,
                location: CustomerLocation.US
            });

            const product = await ProductModel.create({
                name: 'Low Stock Product',
                description: 'Test Description',
                price: 100,
                stock: 5
            });

            const initialStock = product.stock;

            // Act & Assert: Try to order more than available
            const command = new CreateOrderCommand({
                customerId: customer._id.toString(),
                products: [
                    {
                        productId: product._id.toString(),
                        quantity: 10 // More than available
                    }
                ]
            });

            await expect(handler.execute(command)).rejects.toThrow('Insufficient stock');

            // Assert: Stock unchanged
            const unchangedProduct = await ProductModel.findById(product._id);
            expect(unchangedProduct?.stock).toBe(initialStock);

            // Assert: No order created
            const orders = await OrderModel.find({});
            expect(orders.length).toBe(0);
        });
    });

    describe('Discount Calculations', () => {
        it('should apply volume discount correctly', async () => {
            // Arrange: Create customer and product
            const customer = await CustomerModel.create({
                name: 'Volume Customer',
                email: `volume-${Date.now()}@example.com`,
                location: CustomerLocation.US
            });

            const product = await ProductModel.create({
                name: 'Bulk Product',
                description: 'For volume testing',
                price: 10,
                stock: 100
            });

            // Act: Order 10 units (20% discount)
            const command = new CreateOrderCommand({
                customerId: customer._id.toString(),
                products: [
                    {
                        productId: product._id.toString(),
                        quantity: 10
                    }
                ]
            });

            const orderId = await handler.execute(command);

            // Assert: Discount applied
            const order = await OrderModel.findById(orderId);
            expect(order).toBeDefined();
            expect(order?.subtotalBeforeDiscount).toBe(100); // 10 * 10
            expect(order?.discount.type).toBe('VOLUME');
            expect(order?.discount.percentage).toBe(20);
            expect(order?.discount.amount).toBe(20); // 20% of 100
            expect(order?.totalAmount).toBe(80); // 100 - 20
        });

        it('should apply location-based pricing correctly', async () => {
            // Arrange: Create European customer
            const customer = await CustomerModel.create({
                name: 'European Customer',
                email: `europe-${Date.now()}@example.com`,
                location: CustomerLocation.EUROPE
            });

            const product = await ProductModel.create({
                name: 'European Product',
                description: 'For Europe pricing',
                price: 100,
                stock: 50
            });

            // Act: Create order
            const command = new CreateOrderCommand({
                customerId: customer._id.toString(),
                products: [
                    {
                        productId: product._id.toString(),
                        quantity: 1
                    }
                ]
            });

            const orderId = await handler.execute(command);

            // Assert: Europe pricing (+15%)
            const order = await OrderModel.findById(orderId);
            expect(order).toBeDefined();
            const europeanPrice = 100 * 1.15; // 115
            expect(order?.products[0].unitPrice).toBeCloseTo(europeanPrice, 2);
            expect(order?.subtotalBeforeDiscount).toBeCloseTo(europeanPrice, 2);
            expect(order?.locationPricing.adjustmentPercentage).toBe(15);

            // totalAmount may have discounts applied, so calculate expected value
            // If there's a discount, it's applied to subtotalBeforeDiscount
            const expectedTotal = order?.discount.amount
                ? europeanPrice - order.discount.amount
                : europeanPrice;
            expect(order?.totalAmount).toBeCloseTo(expectedTotal, 2);
        });
    });

    describe('Multi-Product Orders', () => {
        it('should handle order with multiple products', async () => {
            // Arrange: Create customer and products
            const customer = await CustomerModel.create({
                name: 'Multi Customer',
                email: `multi-${Date.now()}@example.com`,
                location: CustomerLocation.US
            });

            const product1 = await ProductModel.create({
                name: 'Product 1',
                description: 'First product',
                price: 100,
                stock: 50
            });

            const product2 = await ProductModel.create({
                name: 'Product 2',
                description: 'Second product',
                price: 50,
                stock: 30
            });

            const initialStock1 = product1.stock;
            const initialStock2 = product2.stock;

            // Act: Order both products
            const command = new CreateOrderCommand({
                customerId: customer._id.toString(),
                products: [
                    { productId: product1._id.toString(), quantity: 5 },
                    { productId: product2._id.toString(), quantity: 3 }
                ]
            });

            const orderId = await handler.execute(command);

            // Assert: Order created with both products
            const order = await OrderModel.findById(orderId);
            expect(order).toBeDefined();
            expect(order?.products.length).toBe(2);

            // Assert: Stock updated for both
            const updated1 = await ProductModel.findById(product1._id);
            const updated2 = await ProductModel.findById(product2._id);
            expect(updated1?.stock).toBe(initialStock1 - 5);
            expect(updated2?.stock).toBe(initialStock2 - 3);
        });

        it('should rollback entire order if any product has insufficient stock', async () => {
            // Arrange: Create customer and products
            const customer = await CustomerModel.create({
                name: 'Rollback Customer',
                email: `rollback-${Date.now()}@example.com`,
                location: CustomerLocation.US
            });

            const product1 = await ProductModel.create({
                name: 'Product 1',
                description: 'First product',
                price: 100,
                stock: 50
            });

            const product2 = await ProductModel.create({
                name: 'Product 2',
                description: 'Second product - low stock',
                price: 50,
                stock: 2 // Low stock
            });

            const initialStock1 = product1.stock;
            const initialStock2 = product2.stock;

            // Act & Assert: Try to order (product2 has insufficient stock)
            const command = new CreateOrderCommand({
                customerId: customer._id.toString(),
                products: [
                    { productId: product1._id.toString(), quantity: 5 },
                    { productId: product2._id.toString(), quantity: 10 } // More than available
                ]
            });

            await expect(handler.execute(command)).rejects.toThrow('Insufficient stock');

            // Assert: All stocks unchanged
            const unchanged1 = await ProductModel.findById(product1._id);
            const unchanged2 = await ProductModel.findById(product2._id);
            expect(unchanged1?.stock).toBe(initialStock1);
            expect(unchanged2?.stock).toBe(initialStock2);

            // Assert: No order created
            const orders = await OrderModel.find({});
            expect(orders.length).toBe(0);
        });
    });

    describe('Error Handling', () => {
        it('should reject order for non-existent customer', async () => {
            // Arrange: Create product but use fake customer ID
            const product = await ProductModel.create({
                name: 'Product',
                description: 'Test',
                price: 100,
                stock: 50
            });

            const fakeCustomerId = new mongoose.Types.ObjectId().toString();

            // Act & Assert
            const command = new CreateOrderCommand({
                customerId: fakeCustomerId,
                products: [
                    { productId: product._id.toString(), quantity: 1 }
                ]
            });

            await expect(handler.execute(command)).rejects.toThrow('Customer not found');
        });

        it('should reject order for non-existent product', async () => {
            // Arrange: Create customer but use fake product ID
            const customer = await CustomerModel.create({
                name: 'Customer',
                email: `error-${Date.now()}@example.com`,
                location: CustomerLocation.US
            });

            const fakeProductId = new mongoose.Types.ObjectId().toString();

            // Act & Assert
            const command = new CreateOrderCommand({
                customerId: customer._id.toString(),
                products: [
                    { productId: fakeProductId, quantity: 1 }
                ]
            });

            await expect(handler.execute(command)).rejects.toThrow('Products not found');
        });
    });
});
