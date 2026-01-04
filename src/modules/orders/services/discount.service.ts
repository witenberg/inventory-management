import {
    VOLUME_DISCOUNT_TIERS,
    getActivePromotionalPeriod,
} from '../../../config/holidays.config';

/**
 * Discount type enumeration.
 */
export enum DiscountType {
    VOLUME = 'VOLUME',
    SEASONAL = 'SEASONAL',
    PROMOTIONAL = 'PROMOTIONAL',
    NONE = 'NONE'
}

/**
 * Calculated discount information.
 */
export interface CalculatedDiscount {
    type: DiscountType;
    name: string;
    percentage: number;
    amount: number;
    appliedRule?: string;
}

/**
 * All available discounts for comparison.
 */
export interface AvailableDiscounts {
    volume: CalculatedDiscount | null;
    promotional: CalculatedDiscount | null;
    bestDiscount: CalculatedDiscount;
}

/**
 * Discount Service
 * 
 * Handles all discount calculations including:
 * - Volume-based discounts
 * - Seasonal/promotional discounts
 * - Discount comparison and selection
 * 
 * Design Decisions:
 * - Stateless service for scalability
 * - Pure functions for testability
 * - Calculates all discounts then selects best for customer
 * - Date can be injected for testing
 * 
 * Business Rules:
 * - Discounts CANNOT be combined
 * - Always apply the HIGHEST discount from customer's perspective
 */
export class DiscountService {

    /**
     * Calculate the best applicable discount for an order.
     * 
     * @param subtotal - Order subtotal (after location pricing)
     * @param totalQuantity - Total quantity of all items
     * @param orderDate - Date of order (defaults to now, injectable for testing)
     * @returns The best discount to apply
     */
    calculateBestDiscount(
        subtotal: number,
        totalQuantity: number,
        orderDate: Date = new Date()
    ): CalculatedDiscount {
        const availableDiscounts = this.getAllAvailableDiscounts(
            subtotal,
            totalQuantity,
            orderDate
        );

        return availableDiscounts.bestDiscount;
    }

    /**
     * Get all available discounts and determine the best one.
     * Useful for showing customers what discounts are available.
     */
    getAllAvailableDiscounts(
        subtotal: number,
        totalQuantity: number,
        orderDate: Date = new Date()
    ): AvailableDiscounts {
        const volumeDiscount = this.calculateVolumeDiscount(subtotal, totalQuantity);
        const promotionalDiscount = this.calculatePromotionalDiscount(subtotal, orderDate);

        // Compare and select best discount
        const bestDiscount = this.selectBestDiscount(
            volumeDiscount,
            promotionalDiscount
        );

        return {
            volume: volumeDiscount,
            promotional: promotionalDiscount,
            bestDiscount,
        };
    }

    /**
     * Calculate volume-based discount.
     * 
     * Tiers:
     * - 5+ units: 10% discount
     * - 10+ units: 20% discount
     * - 50+ units: 30% discount
     */
    private calculateVolumeDiscount(
        subtotal: number,
        totalQuantity: number
    ): CalculatedDiscount | null {
        // Find the highest applicable tier
        // VOLUME_DISCOUNT_TIERS is sorted from highest to lowest minQuantity
        const applicableTier = VOLUME_DISCOUNT_TIERS.find(
            tier => totalQuantity >= tier.minQuantity
        );

        if (!applicableTier) {
            return null;
        }

        const discountAmount = this.roundToTwoDecimals(
            subtotal * (applicableTier.discountPercentage / 100)
        );

        return {
            type: DiscountType.VOLUME,
            name: applicableTier.name,
            percentage: applicableTier.discountPercentage,
            amount: discountAmount,
            appliedRule: `${totalQuantity} units qualifies for ${applicableTier.discountPercentage}% discount`,
        };
    }

    /**
     * Calculate promotional/seasonal discount.
     * 
     * Checks if current date falls within any promotional period:
     * - Black Friday: 25% discount
     * - Holiday Sales: 15% discount
     */
    private calculatePromotionalDiscount(
        subtotal: number,
        orderDate: Date
    ): CalculatedDiscount | null {
        const activePromotion = getActivePromotionalPeriod(orderDate);

        if (!activePromotion) {
            return null;
        }

        const discountAmount = this.roundToTwoDecimals(
            subtotal * (activePromotion.discountPercentage / 100)
        );

        return {
            type: DiscountType.PROMOTIONAL,
            name: activePromotion.name,
            percentage: activePromotion.discountPercentage,
            amount: discountAmount,
            appliedRule: activePromotion.description,
        };
    }

    /**
     * Select the best discount from available options.
     * 
     * Rule: Apply the discount with the highest amount (best for customer).
     */
    private selectBestDiscount(
        volumeDiscount: CalculatedDiscount | null,
        promotionalDiscount: CalculatedDiscount | null
    ): CalculatedDiscount {
        const discounts = [volumeDiscount, promotionalDiscount].filter(
            d => d !== null
        ) as CalculatedDiscount[];

        if (discounts.length === 0) {
            return this.createNoDiscount();
        }

        // Sort by amount descending and return the highest
        discounts.sort((a, b) => b.amount - a.amount);
        return discounts[0];
    }

    /**
     * Create a "no discount" result.
     */
    private createNoDiscount(): CalculatedDiscount {
        return {
            type: DiscountType.NONE,
            name: 'No discount applied',
            percentage: 0,
            amount: 0,
        };
    }

    /**
     * Round to 2 decimal places for currency.
     */
    private roundToTwoDecimals(value: number): number {
        return Math.round(value * 100) / 100;
    }

    /**
     * Apply a discount to a subtotal.
     */
    applyDiscount(subtotal: number, discount: CalculatedDiscount): number {
        return this.roundToTwoDecimals(subtotal - discount.amount);
    }
}

