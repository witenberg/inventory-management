import { isDateInPromotionalPeriod, getActivePromotionalPeriod, PROMOTIONAL_PERIODS } from '../../../src/config/holidays.config';

describe('Holiday Configuration', () => {
    describe('isDateInPromotionalPeriod', () => {
        it('should detect Black Friday period (late November)', () => {
            const period = PROMOTIONAL_PERIODS.find(p => p.name === 'Black Friday Sale');
            if (!period) throw new Error('Black Friday period not found');

            const blackFriday = new Date('2025-11-29');
            expect(isDateInPromotionalPeriod(blackFriday, period)).toBe(true);
        });

        it('should detect Christmas period (mid-late December)', () => {
            const period = PROMOTIONAL_PERIODS.find(p => p.name === 'Holiday Sales - Christmas');
            if (!period) throw new Error('Christmas period not found');

            const christmas = new Date('2025-12-20');
            expect(isDateInPromotionalPeriod(christmas, period)).toBe(true);
        });

        it('should detect New Year period (late Dec to early Jan)', () => {
            const period = PROMOTIONAL_PERIODS.find(p => p.name === 'Holiday Sales - New Year');
            if (!period) throw new Error('New Year period not found');

            const dec31 = new Date('2025-12-31');
            const jan2 = new Date('2026-01-02');

            expect(isDateInPromotionalPeriod(dec31, period)).toBe(true);
            expect(isDateInPromotionalPeriod(jan2, period)).toBe(true);
        });

        it('should return false for dates outside promotional periods', () => {
            const period = PROMOTIONAL_PERIODS.find(p => p.name === 'Black Friday Sale');
            if (!period) throw new Error('Black Friday period not found');

            const march = new Date('2025-03-15');
            expect(isDateInPromotionalPeriod(march, period)).toBe(false);
        });

        it('should handle year boundary correctly', () => {
            const period = PROMOTIONAL_PERIODS.find(p => p.name === 'Holiday Sales - New Year');
            if (!period) throw new Error('New Year period not found');

            // Should work across Dec 31 -> Jan 1
            const dec30 = new Date('2025-12-30');
            const jan5 = new Date('2026-01-05');

            expect(isDateInPromotionalPeriod(dec30, period)).toBe(true);
            expect(isDateInPromotionalPeriod(jan5, period)).toBe(true);
        });
    });

    describe('getActivePromotionalPeriod', () => {
        it('should return Black Friday period in late November', () => {
            const blackFriday = new Date('2025-11-29');
            const period = getActivePromotionalPeriod(blackFriday);

            expect(period).not.toBeNull();
            expect(period?.name).toBe('Black Friday Sale');
            expect(period?.discountPercentage).toBe(25);
        });

        it('should return Christmas period in December', () => {
            const christmas = new Date('2025-12-20');
            const period = getActivePromotionalPeriod(christmas);

            expect(period).not.toBeNull();
            expect(period?.name).toBe('Holiday Sales - Christmas');
            expect(period?.discountPercentage).toBe(15);
        });

        it('should return null for non-promotional dates', () => {
            const march = new Date('2025-03-15');
            const period = getActivePromotionalPeriod(march);

            expect(period).toBeNull();
        });

        it('should return first matching period if multiple overlap', () => {
            // This tests priority - first in array wins
            const date = new Date('2025-11-25'); // Could be in Black Friday range
            const period = getActivePromotionalPeriod(date);

            // Should return the first matching period in PROMOTIONAL_PERIODS array
            expect(period).not.toBeNull();
        });
    });

    describe('Promotional period configuration', () => {
        it('should have all required promotional periods defined', () => {
            const periodNames = PROMOTIONAL_PERIODS.map(p => p.name);

            expect(periodNames).toContain('Black Friday Sale');
            expect(periodNames).toContain('Holiday Sales - Christmas');
            expect(periodNames).toContain('Holiday Sales - New Year');
        });

        it('should have correct discount percentages', () => {
            const blackFriday = PROMOTIONAL_PERIODS.find(p => p.name === 'Black Friday Sale');
            const christmas = PROMOTIONAL_PERIODS.find(p => p.name === 'Holiday Sales - Christmas');

            expect(blackFriday?.discountPercentage).toBe(25);
            expect(christmas?.discountPercentage).toBe(15);
        });

        it('should have valid date ranges', () => {
            PROMOTIONAL_PERIODS.forEach(period => {
                expect(period.startMonth).toBeGreaterThanOrEqual(1);
                expect(period.startMonth).toBeLessThanOrEqual(12);
                expect(period.endMonth).toBeGreaterThanOrEqual(1);
                expect(period.endMonth).toBeLessThanOrEqual(12);
                expect(period.startDay).toBeGreaterThanOrEqual(1);
                expect(period.startDay).toBeLessThanOrEqual(31);
                expect(period.endDay).toBeGreaterThanOrEqual(1);
                expect(period.endDay).toBeLessThanOrEqual(31);
            });
        });
    });
});

