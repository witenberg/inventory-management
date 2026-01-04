/**
 * Polish Bank Holidays Configuration
 * 
 * This file contains definitions for Polish public holidays and promotional periods.
 * Used for seasonal discount calculations.
 */

export interface Holiday {
    name: string;
    month: number;  // 1-12
    day: number;    // 1-31
    isFixed: boolean;  // true if date is fixed every year
}

export interface PromotionalPeriod {
    name: string;
    discountPercentage: number;
    startMonth: number;
    startDay: number;
    endMonth: number;
    endDay: number;
    description: string;
}

/**
 * Polish Public Holidays (Bank Holidays)
 * Source: Official Polish calendar
 */
export const POLISH_HOLIDAYS: Holiday[] = [
    { name: 'New Year\'s Day', month: 1, day: 1, isFixed: true },
    { name: 'Epiphany', month: 1, day: 6, isFixed: true },
    // Easter Sunday and Easter Monday are movable - would need calculation
    { name: 'Labour Day', month: 5, day: 1, isFixed: true },
    { name: 'Constitution Day', month: 5, day: 3, isFixed: true },
    // Corpus Christi is movable - 60 days after Easter
    { name: 'Assumption of Mary', month: 8, day: 15, isFixed: true },
    { name: 'All Saints\' Day', month: 11, day: 1, isFixed: true },
    { name: 'Independence Day', month: 11, day: 11, isFixed: true },
    { name: 'Christmas Day', month: 12, day: 25, isFixed: true },
    { name: 'Second Day of Christmas', month: 12, day: 26, isFixed: true },
];

/**
 * Promotional Periods with Discounts
 * 
 * Rules:
 * - Black Friday: 25% discount (last Friday of November, extended to weekend)
 * - Holiday Sales: 15% discount (Christmas period and New Year)
 */
export const PROMOTIONAL_PERIODS: PromotionalPeriod[] = [
    {
        name: 'Black Friday Sale',
        discountPercentage: 25,
        startMonth: 11,
        startDay: 24,  // Approximate - last week of November
        endMonth: 11,
        endDay: 30,
        description: 'Black Friday and Cyber Monday deals'
    },
    {
        name: 'Holiday Sales - Christmas',
        discountPercentage: 15,
        startMonth: 12,
        startDay: 15,
        endMonth: 12,
        endDay: 26,
        description: 'Christmas shopping season discount'
    },
    {
        name: 'Holiday Sales - New Year',
        discountPercentage: 15,
        startMonth: 12,
        startDay: 27,
        endMonth: 1,
        endDay: 6,
        description: 'New Year celebration discount'
    },
    {
        name: 'Summer Sale',
        discountPercentage: 15,
        startMonth: 7,
        startDay: 1,
        endMonth: 8,
        endDay: 15,
        description: 'Summer vacation season discount'
    },
];

/**
 * Product categories eligible for seasonal discounts.
 * For simplicity, we'll use two categories for Holiday Sales.
 */
export enum PromotionalCategory {
    ELECTRONICS = 'ELECTRONICS',
    CLOTHING = 'CLOTHING',
    ALL = 'ALL'  // For promotions like Black Friday that apply to all products
}

/**
 * Maps promotional periods to eligible categories.
 */
export const PROMOTIONAL_CATEGORY_MAP: Record<string, PromotionalCategory> = {
    'Black Friday Sale': PromotionalCategory.ALL,
    'Holiday Sales - Christmas': PromotionalCategory.ALL,
    'Holiday Sales - New Year': PromotionalCategory.ALL,
    'Summer Sale': PromotionalCategory.ALL,
};

/**
 * Volume-based discount tiers.
 * Applied based on total quantity across all products in the order.
 */
export interface VolumeDiscountTier {
    minQuantity: number;
    discountPercentage: number;
    name: string;
}

export const VOLUME_DISCOUNT_TIERS: VolumeDiscountTier[] = [
    { minQuantity: 50, discountPercentage: 30, name: 'Bulk Order Discount (50+ units)' },
    { minQuantity: 10, discountPercentage: 20, name: 'Large Order Discount (10+ units)' },
    { minQuantity: 5, discountPercentage: 10, name: 'Volume Discount (5+ units)' },
];

/**
 * Location-based pricing adjustments.
 */
export interface LocationPricingRule {
    location: string;
    adjustmentPercentage: number;  // Positive = increase, Negative = decrease
    reason: string;
}

export const LOCATION_PRICING_RULES: LocationPricingRule[] = [
    { location: 'US', adjustmentPercentage: 0, reason: 'Standard pricing' },
    { location: 'EUROPE', adjustmentPercentage: 15, reason: 'VAT included' },
    { location: 'ASIA', adjustmentPercentage: -5, reason: 'Lower logistics costs' },
];

/**
 * Helper function to check if a date falls within a promotional period.
 */
export function isDateInPromotionalPeriod(date: Date, period: PromotionalPeriod): boolean {
    const month = date.getMonth() + 1;  // JavaScript months are 0-indexed
    const day = date.getDate();

    // Handle periods that span across year boundary (e.g., Dec 27 - Jan 6)
    if (period.endMonth < period.startMonth) {
        // Period crosses year boundary
        return (
            (month === period.startMonth && day >= period.startDay) ||
            (month > period.startMonth && month <= 12) ||
            (month === period.endMonth && day <= period.endDay) ||
            (month < period.endMonth && month >= 1)
        );
    } else {
        // Normal period within same year
        if (month < period.startMonth || month > period.endMonth) {
            return false;
        }
        if (month === period.startMonth && day < period.startDay) {
            return false;
        }
        if (month === period.endMonth && day > period.endDay) {
            return false;
        }
        return true;
    }
}

/**
 * Get active promotional period for a given date.
 * Returns the first matching period (highest priority).
 */
export function getActivePromotionalPeriod(date: Date = new Date()): PromotionalPeriod | null {
    for (const period of PROMOTIONAL_PERIODS) {
        if (isDateInPromotionalPeriod(date, period)) {
            return period;
        }
    }
    return null;
}

