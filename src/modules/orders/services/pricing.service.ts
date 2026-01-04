import { CustomerLocation } from '../../customers/domain/customer.model';
import { LOCATION_PRICING_RULES } from '../../../config/holidays.config';

/**
 * Location pricing adjustment result.
 */
export interface LocationPricingAdjustment {
    location: string;
    adjustmentPercentage: number;
    adjustmentAmount: number;
    originalPrice: number;
    adjustedPrice: number;
}

/**
 * Pricing Service
 * 
 * Handles location-based pricing adjustments.
 * 
 * Design Decisions:
 * - Stateless service for scalability
 * - Pure functions for testability
 * - Immutable calculations
 */
export class PricingService {

    /**
     * Apply location-based pricing adjustment to a base price.
     * 
     * Rules:
     * - US: Standard pricing (0% adjustment)
     * - Europe: +15% (VAT included)
     * - Asia: -5% (lower logistics costs)
     */
    applyLocationPricing(
        basePrice: number,
        location: CustomerLocation
    ): LocationPricingAdjustment {
        const rule = LOCATION_PRICING_RULES.find(r => r.location === location);

        if (!rule) {
            // Default to US pricing if location not found
            return {
                location,
                adjustmentPercentage: 0,
                adjustmentAmount: 0,
                originalPrice: basePrice,
                adjustedPrice: basePrice,
            };
        }

        const adjustmentMultiplier = 1 + (rule.adjustmentPercentage / 100);
        const adjustedPrice = this.roundToTwoDecimals(basePrice * adjustmentMultiplier);
        const adjustmentAmount = this.roundToTwoDecimals(adjustedPrice - basePrice);

        return {
            location,
            adjustmentPercentage: rule.adjustmentPercentage,
            adjustmentAmount,
            originalPrice: basePrice,
            adjustedPrice,
        };
    }

    /**
     * Calculate total price for multiple items with location adjustment.
     */
    calculateTotalWithLocation(
        items: Array<{ price: number; quantity: number }>,
        location: CustomerLocation
    ): { subtotal: number; locationAdjustment: LocationPricingAdjustment } {
        // Calculate base subtotal
        const baseSubtotal = items.reduce(
            (sum, item) => sum + (item.price * item.quantity),
            0
        );

        // Apply location pricing
        const locationAdjustment = this.applyLocationPricing(baseSubtotal, location);

        return {
            subtotal: locationAdjustment.adjustedPrice,
            locationAdjustment,
        };
    }

    /**
     * Round to 2 decimal places for currency.
     */
    private roundToTwoDecimals(value: number): number {
        return Math.round(value * 100) / 100;
    }
}

