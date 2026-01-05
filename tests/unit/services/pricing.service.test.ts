import { PricingService } from '../../../src/modules/orders/services/pricing.service';
import { CustomerLocation } from '../../../src/modules/customers/domain/customer.model';

describe('PricingService', () => {
    let pricingService: PricingService;

    beforeEach(() => {
        pricingService = new PricingService();
    });

    describe('applyLocationPricing', () => {
        it('should not modify price for US customers (standard pricing)', () => {
            const basePrice = 100;
            const location = CustomerLocation.US;

            const result = pricingService.applyLocationPricing(basePrice, location);

            expect(result.location).toBe(CustomerLocation.US);
            expect(result.originalPrice).toBe(100);
            expect(result.adjustmentPercentage).toBe(0);
            expect(result.adjustedPrice).toBe(100);
        });

        it('should increase price by 15% for Europe customers (VAT)', () => {
            const basePrice = 100;
            const location = CustomerLocation.EUROPE;

            const result = pricingService.applyLocationPricing(basePrice, location);

            expect(result.location).toBe(CustomerLocation.EUROPE);
            expect(result.originalPrice).toBe(100);
            expect(result.adjustmentPercentage).toBe(15);
            expect(result.adjustedPrice).toBe(115);
        });

        it('should decrease price by 5% for Asia customers (logistics)', () => {
            const basePrice = 100;
            const location = CustomerLocation.ASIA;

            const result = pricingService.applyLocationPricing(basePrice, location);

            expect(result.location).toBe(CustomerLocation.ASIA);
            expect(result.originalPrice).toBe(100);
            expect(result.adjustmentPercentage).toBe(-5);
            expect(result.adjustedPrice).toBe(95);
        });
    });

    describe('Edge cases', () => {
        it('should handle zero price', () => {
            const result = pricingService.applyLocationPricing(0, CustomerLocation.EUROPE);
            expect(result.adjustedPrice).toBe(0);
        });

        it('should handle very small prices (precision)', () => {
            const basePrice = 0.01;
            const result = pricingService.applyLocationPricing(basePrice, CustomerLocation.EUROPE);

            // 0.01 * 1.15 = 0.0115 -> should round to 0.01
            expect(result.adjustedPrice).toBeCloseTo(0.01, 2);
        });

        it('should handle large prices', () => {
            const basePrice = 999999.99;
            const result = pricingService.applyLocationPricing(basePrice, CustomerLocation.EUROPE);

            // 999999.99 * 1.15 = 1149999.9885
            expect(result.adjustedPrice).toBeCloseTo(1149999.99, 2);
        });

        it('should round to 2 decimal places', () => {
            const basePrice = 99.99;
            const result = pricingService.applyLocationPricing(basePrice, CustomerLocation.EUROPE);

            // 99.99 * 1.15 = 114.9885 -> should be 114.99
            expect(result.adjustedPrice).toBeCloseTo(114.99, 2);
        });
    });

    describe('Multiple products scenario', () => {
        it('should correctly calculate total with different locations', () => {
            const products = [
                { price: 100, quantity: 2 },
                { price: 50, quantity: 3 }
            ];

            // US: (100 * 2 + 50 * 3) * 1.0 = 350
            let total = 0;
            products.forEach(p => {
                const result = pricingService.applyLocationPricing(p.price, CustomerLocation.US);
                total += result.adjustedPrice * p.quantity;
            });
            expect(total).toBe(350);

            // Europe: (100 * 2 + 50 * 3) * 1.15 = 402.5
            total = 0;
            products.forEach(p => {
                const result = pricingService.applyLocationPricing(p.price, CustomerLocation.EUROPE);
                total += result.adjustedPrice * p.quantity;
            });
            expect(total).toBeCloseTo(402.5, 2);

            // Asia: (100 * 2 + 50 * 3) * 0.95 = 332.5
            total = 0;
            products.forEach(p => {
                const result = pricingService.applyLocationPricing(p.price, CustomerLocation.ASIA);
                total += result.adjustedPrice * p.quantity;
            });
            expect(total).toBeCloseTo(332.5, 2);
        });
    });
});

