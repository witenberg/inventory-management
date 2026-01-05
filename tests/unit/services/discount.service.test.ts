import { DiscountService, DiscountType } from '../../../src/modules/orders/services/discount.service';

describe('DiscountService', () => {
    let discountService: DiscountService;

    beforeEach(() => {
        discountService = new DiscountService();
    });

    describe('Volume-based discounts', () => {
        it('should apply 10% discount for 5-9 units', () => {
            const subtotal = 1000;
            const totalQuantity = 7;
            const orderDate = new Date('2025-03-15'); // Non-promotional date

            const result = discountService.calculateBestDiscount(subtotal, totalQuantity, orderDate);

            expect(result.type).toBe(DiscountType.VOLUME);
            expect(result.percentage).toBe(10);
            expect(result.amount).toBe(100); // 10% of 1000
            expect(result.name).toContain('5+');
        });

        it('should apply 20% discount for 10-49 units', () => {
            const subtotal = 1000;
            const totalQuantity = 15;
            const orderDate = new Date('2025-03-15');

            const result = discountService.calculateBestDiscount(subtotal, totalQuantity, orderDate);

            expect(result.type).toBe(DiscountType.VOLUME);
            expect(result.percentage).toBe(20);
            expect(result.amount).toBe(200); // 20% of 1000
        });

        it('should apply 30% discount for 50+ units', () => {
            const subtotal = 1000;
            const totalQuantity = 50;
            const orderDate = new Date('2024-03-15');

            const result = discountService.calculateBestDiscount(subtotal, totalQuantity, orderDate);

            expect(result.type).toBe(DiscountType.VOLUME);
            expect(result.percentage).toBe(30);
            expect(result.amount).toBe(300); // 30% of 1000
        });

        it('should not apply volume discount for less than 5 units', () => {
            const subtotal = 1000;
            const totalQuantity = 3;
            const orderDate = new Date('2024-03-15');

            const result = discountService.calculateBestDiscount(subtotal, totalQuantity, orderDate);

            expect(result.type).toBe(DiscountType.NONE);
            expect(result.percentage).toBe(0);
            expect(result.amount).toBe(0);
        });
    });

    describe('Promotional discounts', () => {
        it('should apply 25% Black Friday discount', () => {
            const subtotal = 1000;
            const totalQuantity = 2; // Below volume threshold
            const orderDate = new Date('2025-11-29'); // Black Friday

            const result = discountService.calculateBestDiscount(subtotal, totalQuantity, orderDate);

            expect(result.type).toBe(DiscountType.PROMOTIONAL);
            expect(result.percentage).toBe(25);
            expect(result.amount).toBe(250); // 25% of 1000
            expect(result.name).toContain('Black Friday');
        });

        it('should apply 15% Holiday discount in December', () => {
            const subtotal = 1000;
            const totalQuantity = 2;
            const orderDate = new Date('2025-12-20'); // Christmas period

            const result = discountService.calculateBestDiscount(subtotal, totalQuantity, orderDate);

            expect(result.type).toBe(DiscountType.PROMOTIONAL);
            expect(result.percentage).toBe(15);
            expect(result.amount).toBe(150); // 15% of 1000
        });

        it('should apply 15% New Year discount', () => {
            const subtotal = 1000;
            const totalQuantity = 2;
            const orderDate = new Date('2026-01-02'); // New Year period

            const result = discountService.calculateBestDiscount(subtotal, totalQuantity, orderDate);

            expect(result.type).toBe(DiscountType.PROMOTIONAL);
            expect(result.percentage).toBe(15);
            expect(result.amount).toBe(150);
        });
    });

    describe('Discount selection (highest wins)', () => {
        it('should select Black Friday (25%) over volume discount (10%)', () => {
            const subtotal = 1000;
            const totalQuantity = 7; // Would give 10% volume discount
            const orderDate = new Date('2025-11-29'); // Black Friday (25%)

            const result = discountService.calculateBestDiscount(subtotal, totalQuantity, orderDate);

            expect(result.type).toBe(DiscountType.PROMOTIONAL);
            expect(result.percentage).toBe(25);
            expect(result.amount).toBe(250); // Black Friday wins
        });

        it('should select volume discount (30%) over Holiday discount (15%)', () => {
            const subtotal = 1000;
            const totalQuantity = 50; // Would give 30% volume discount
            const orderDate = new Date('2025-12-20'); // Holiday (15%)

            const result = discountService.calculateBestDiscount(subtotal, totalQuantity, orderDate);

            expect(result.type).toBe(DiscountType.VOLUME);
            expect(result.percentage).toBe(30);
            expect(result.amount).toBe(300); // Volume wins
        });

        it('should select based on absolute amount, not percentage', () => {
            // Scenario: 10% of large amount vs 20% of same amount
            const subtotal = 1000;

            // Volume: 20% = $200
            // Promotional: 15% = $150
            const totalQuantity = 10;
            const orderDate = new Date('2025-12-20');

            const result = discountService.calculateBestDiscount(subtotal, totalQuantity, orderDate);

            // 20% should win over 15%
            expect(result.type).toBe(DiscountType.VOLUME);
            expect(result.amount).toBe(200);
        });
    });

    describe('Edge cases', () => {
        it('should handle exactly 5 units (threshold)', () => {
            const subtotal = 1000;
            const totalQuantity = 5;
            const orderDate = new Date('2025-03-15');

            const result = discountService.calculateBestDiscount(subtotal, totalQuantity, orderDate);

            expect(result.type).toBe(DiscountType.VOLUME);
            expect(result.percentage).toBe(10);
        });

        it('should handle zero subtotal', () => {
            const subtotal = 0;
            const totalQuantity = 10;
            const orderDate = new Date('2025-03-15');

            const result = discountService.calculateBestDiscount(subtotal, totalQuantity, orderDate);

            expect(result.amount).toBe(0);
        });

        it('should handle year boundary (Dec 31 -> Jan 1)', () => {
            // New Year promotion: Dec 27 - Jan 6
            const dec31 = new Date('2025-12-31');
            const jan1 = new Date('2026-01-01');

            const result1 = discountService.calculateBestDiscount(1000, 2, dec31);
            const result2 = discountService.calculateBestDiscount(1000, 2, jan1);

            expect(result1.type).toBe(DiscountType.PROMOTIONAL);
            expect(result2.type).toBe(DiscountType.PROMOTIONAL);
        });

        it('should return NONE when no discounts apply', () => {
            const subtotal = 1000;
            const totalQuantity = 2; // Below volume threshold
            const orderDate = new Date('2025-03-15'); // No promotion

            const result = discountService.calculateBestDiscount(subtotal, totalQuantity, orderDate);

            expect(result.type).toBe(DiscountType.NONE);
            expect(result.percentage).toBe(0);
            expect(result.amount).toBe(0);
        });
    });

    describe('getAllAvailableDiscounts', () => {
        it('should return both volume and promotional discounts when both apply', () => {
            const subtotal = 1000;
            const totalQuantity = 10; // Volume: 20%
            const orderDate = new Date('2025-11-29'); // Black Friday: 25%

            const result = discountService.getAllAvailableDiscounts(subtotal, totalQuantity, orderDate);

            expect(result.volume).not.toBeNull();
            expect(result.volume?.percentage).toBe(20);
            expect(result.promotional).not.toBeNull();
            expect(result.promotional?.percentage).toBe(25);
            expect(result.bestDiscount.type).toBe(DiscountType.PROMOTIONAL);
        });

        it('should return null for non-applicable discounts', () => {
            const subtotal = 1000;
            const totalQuantity = 2; // No volume discount
            const orderDate = new Date('2025-03-15'); // No promotion

            const result = discountService.getAllAvailableDiscounts(subtotal, totalQuantity, orderDate);

            expect(result.volume).toBeNull();
            expect(result.promotional).toBeNull();
            expect(result.bestDiscount.type).toBe(DiscountType.NONE);
        });
    });
});

