import { createProductSchema } from '../../../src/modules/inventory/commands/validation/create-product.schema';
import { createOrderSchema } from '../../../src/modules/orders/commands/validation/create-order.schema';

describe('Validation Schemas', () => {
    describe('createProductSchema', () => {
        it('should accept valid product data', () => {
            const validData = {
                name: 'Laptop Dell XPS',
                description: 'High-performance laptop',
                price: 1299.99,
                stock: 50
            };

            const result = createProductSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should accept product without description (optional)', () => {
            const validData = {
                name: 'Laptop',
                price: 999,
                stock: 10
            };

            const result = createProductSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject product name longer than 50 characters', () => {
            const invalidData = {
                name: 'A'.repeat(51),
                price: 100,
                stock: 10
            };

            const result = createProductSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('50');
            }
        });

        it('should accept product name exactly 50 characters', () => {
            const validData = {
                name: 'A'.repeat(50),
                price: 100,
                stock: 10
            };

            const result = createProductSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject empty product name', () => {
            const invalidData = {
                name: '',
                price: 100,
                stock: 10
            };

            const result = createProductSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject missing name', () => {
            const invalidData = {
                price: 100,
                stock: 10
            };

            const result = createProductSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject negative price', () => {
            const invalidData = {
                name: 'Product',
                price: -10,
                stock: 10
            };

            const result = createProductSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject zero price', () => {
            const invalidData = {
                name: 'Product',
                price: 0,
                stock: 10
            };

            const result = createProductSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should accept minimum valid price (0.01)', () => {
            const validData = {
                name: 'Product',
                price: 0.01,
                stock: 10
            };

            const result = createProductSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject missing price', () => {
            const invalidData = {
                name: 'Product',
                stock: 10
            };

            const result = createProductSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject negative stock', () => {
            const invalidData = {
                name: 'Product',
                price: 100,
                stock: -5
            };

            const result = createProductSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should accept zero stock', () => {
            const validData = {
                name: 'Product',
                price: 100,
                stock: 0
            };

            const result = createProductSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject non-integer stock', () => {
            const invalidData = {
                name: 'Product',
                price: 100,
                stock: 10.5
            };

            const result = createProductSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject missing stock', () => {
            const invalidData = {
                name: 'Product',
                price: 100
            };

            const result = createProductSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('createOrderSchema', () => {
        it('should accept valid order data', () => {
            const validData = {
                customerId: '507f1f77bcf86cd799439011',
                products: [
                    { productId: '507f1f77bcf86cd799439012', quantity: 5 },
                    { productId: '507f1f77bcf86cd799439013', quantity: 3 }
                ]
            };

            const result = createOrderSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should accept order with single product', () => {
            const validData = {
                customerId: '507f1f77bcf86cd799439011',
                products: [
                    { productId: '507f1f77bcf86cd799439012', quantity: 1 }
                ]
            };

            const result = createOrderSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject order with empty products array', () => {
            const invalidData = {
                customerId: '507f1f77bcf86cd799439011',
                products: []
            };

            const result = createOrderSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject order without customerId', () => {
            const invalidData = {
                products: [
                    { productId: '507f1f77bcf86cd799439012', quantity: 5 }
                ]
            };

            const result = createOrderSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject order without products', () => {
            const invalidData = {
                customerId: '507f1f77bcf86cd799439011'
            };

            const result = createOrderSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject product with zero quantity', () => {
            const invalidData = {
                customerId: '507f1f77bcf86cd799439011',
                products: [
                    { productId: '507f1f77bcf86cd799439012', quantity: 0 }
                ]
            };

            const result = createOrderSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject product with negative quantity', () => {
            const invalidData = {
                customerId: '507f1f77bcf86cd799439011',
                products: [
                    { productId: '507f1f77bcf86cd799439012', quantity: -5 }
                ]
            };

            const result = createOrderSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject product with non-integer quantity', () => {
            const invalidData = {
                customerId: '507f1f77bcf86cd799439011',
                products: [
                    { productId: '507f1f77bcf86cd799439012', quantity: 5.5 }
                ]
            };

            const result = createOrderSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject order with more than 100 different products', () => {
            const products = Array.from({ length: 101 }, (_, i) => ({
                productId: `507f1f77bcf86cd79943${String(i).padStart(4, '0')}`,
                quantity: 1
            }));

            const invalidData = {
                customerId: '507f1f77bcf86cd799439011',
                products
            };

            const result = createOrderSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should accept order with exactly 100 products', () => {
            const products = Array.from({ length: 100 }, (_, i) => ({
                productId: `507f1f77bcf86cd79943${String(i).padStart(4, '0')}`,
                quantity: 1
            }));

            const validData = {
                customerId: '507f1f77bcf86cd799439011',
                products
            };

            const result = createOrderSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject product without productId', () => {
            const invalidData = {
                customerId: '507f1f77bcf86cd799439011',
                products: [
                    { quantity: 5 }
                ]
            };

            const result = createOrderSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject product without quantity', () => {
            const invalidData = {
                customerId: '507f1f77bcf86cd799439011',
                products: [
                    { productId: '507f1f77bcf86cd799439012' }
                ]
            };

            const result = createOrderSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });
});

