import mongoose from 'mongoose';
import { ICommandHandler } from '../../../../core/cqrs';
import { CreateOrderCommand } from '../create-order.command';
import { OrderModel, OrderProduct, OrderStatus } from '../../domain/order.model';
import { CustomerModel } from '../../../customers/domain/customer.model';
import { ProductModel } from '../../../inventory/domain/product.model';
import { AppError } from '../../../../core/errors/AppError';
import { PricingService } from '../../services/pricing.service';
import { DiscountService } from '../../services/discount.service';

/**
 * Handles the creation of new orders.
 * 
 * Design Decisions:
 * - Uses MongoDB transactions for atomicity
 * - Validates stock availability before processing
 * - Uses conditional atomic updates to prevent race conditions
 * - Calculates pricing and discounts before stock updates
 * - Rolls back automatically if any operation fails
 * 
 * Race Condition Protection:
 * - Transaction ensures all-or-nothing semantics
 * - Stock updates use conditional queries (stock >= quantity)
 * - If any product has insufficient stock, entire order fails
 * - No partial order fulfillment
 * 
 * Scalability:
 * - Stateless handler (can be scaled horizontally)
 * - Services are injected (can be mocked for testing)
 * - Transaction scope is minimal (fast execution)
 */
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand, string> {
    private pricingService: PricingService;
    private discountService: DiscountService;

    constructor() {
        this.pricingService = new PricingService();
        this.discountService = new DiscountService();
    }

    async execute(command: CreateOrderCommand): Promise<string> {
        const { customerId, products } = command.payload;

        // Start a MongoDB session for transaction
        const session = await mongoose.startSession();

        try {
            // Start transaction
            session.startTransaction();

            // 1. Validate and fetch customer
            const customer = await CustomerModel.findById(customerId).session(session).exec();
            if (!customer) {
                throw new AppError('Customer not found', 404);
            }

            // 2. Validate products and check stock availability
            const productDetails = await this.validateAndFetchProducts(products, session);

            // 3. Calculate pricing with location adjustments
            const orderProducts: OrderProduct[] = [];
            let subtotalBeforeDiscount = 0;

            for (const input of products) {
                const product = productDetails.find(p => p._id.toString() === input.productId);
                if (!product) {
                    throw new AppError(`Product ${input.productId} not found`, 404);
                }

                // Apply location-based pricing to unit price
                const locationAdjustment = this.pricingService.applyLocationPricing(
                    product.price,
                    customer.location
                );

                const unitPrice = locationAdjustment.adjustedPrice;
                const subtotal = this.roundToTwoDecimals(unitPrice * input.quantity);

                orderProducts.push({
                    productId: product._id.toString(),
                    productName: product.name,
                    quantity: input.quantity,
                    unitPrice,
                    subtotal,
                });

                subtotalBeforeDiscount += subtotal;
            }

            subtotalBeforeDiscount = this.roundToTwoDecimals(subtotalBeforeDiscount);

            // 4. Calculate total quantity for volume discounts
            const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);

            // 5. Calculate best discount
            const discount = this.discountService.calculateBestDiscount(
                subtotalBeforeDiscount,
                totalQuantity
            );

            // 6. Calculate final total
            const totalAmount = this.discountService.applyDiscount(
                subtotalBeforeDiscount,
                discount
            );

            // 7. Atomically update stock levels for all products
            // This is the critical section for race condition prevention
            await this.updateProductStocks(products, session);

            // 8. Generate unique order number
            const orderNumber = await this.generateOrderNumber(session);

            // 9. Create order
            const order = new OrderModel({
                orderNumber,
                customerId: customer._id,
                customerName: customer.name,
                customerLocation: customer.location,
                products: orderProducts,
                subtotalBeforeDiscount,
                locationPricing: {
                    location: customer.location,
                    adjustmentPercentage: this.getLocationAdjustmentPercentage(customer.location),
                    adjustmentAmount: this.roundToTwoDecimals(
                        subtotalBeforeDiscount - this.calculateBaseSubtotal(products, productDetails)
                    ),
                },
                discount: {
                    type: discount.type,
                    name: discount.name,
                    percentage: discount.percentage,
                    amount: discount.amount,
                },
                totalAmount,
                status: OrderStatus.CONFIRMED,
            });

            await order.save({ session });

            // Commit transaction
            await session.commitTransaction();

            return order._id.toString();

        } catch (error) {
            // Rollback transaction on any error
            await session.abortTransaction();

            if (error instanceof AppError) {
                throw error;
            }
            if (error instanceof Error) {
                throw new AppError(`Failed to create order: ${error.message}`, 500);
            }
            throw new AppError('Failed to create order', 500);
        } finally {
            // End session
            session.endSession();
        }
    }

    /**
     * Validate products exist and have sufficient stock.
     * Fetches product details for pricing calculations.
     */
    private async validateAndFetchProducts(
        products: Array<{ productId: string; quantity: number }>,
        session: mongoose.ClientSession
    ) {
        const productIds = products.map(p => p.productId);

        // Fetch all products in one query
        const productDetails = await ProductModel
            .find({ _id: { $in: productIds } })
            .session(session)
            .exec();

        // Check all products exist
        if (productDetails.length !== productIds.length) {
            const foundIds = productDetails.map(p => p._id.toString());
            const missingIds = productIds.filter(id => !foundIds.includes(id));
            throw new AppError(
                `Products not found: ${missingIds.join(', ')}`,
                404
            );
        }

        // Check stock availability for each product
        for (const input of products) {
            const product = productDetails.find(p => p._id.toString() === input.productId);
            if (!product) {
                throw new AppError(`Product ${input.productId} not found`, 404);
            }

            if (product.stock < input.quantity) {
                throw new AppError(
                    `Insufficient stock for product "${product.name}". Requested: ${input.quantity}, Available: ${product.stock}`,
                    400
                );
            }
        }

        return productDetails;
    }

    /**
     * Atomically update stock levels for all products in the order.
     * 
     * Uses conditional updates to prevent race conditions:
     * - Query condition: stock >= quantity
     * - Update: atomically decrement stock
     * - If condition fails, transaction is aborted
     * 
     * This ensures that even if multiple orders for the same product
     * arrive simultaneously, stock will never go below zero.
     */
    private async updateProductStocks(
        products: Array<{ productId: string; quantity: number }>,
        session: mongoose.ClientSession
    ): Promise<void> {
        for (const input of products) {
            const result = await ProductModel
                .findOneAndUpdate(
                    {
                        _id: input.productId,
                        stock: { $gte: input.quantity }  // Critical: only update if sufficient stock
                    },
                    {
                        $inc: { stock: -input.quantity }  // Atomic decrement
                    },
                    {
                        session,
                        new: true,
                    }
                )
                .exec();

            // If no document was updated, stock is insufficient
            if (!result) {
                // Fetch current stock for error message
                const product = await ProductModel.findById(input.productId).session(session).exec();

                throw new AppError(
                    `Insufficient stock for product "${product?.name || input.productId}". ` +
                    `Another order may have been placed simultaneously. ` +
                    `Requested: ${input.quantity}, Available: ${product?.stock || 0}`,
                    409  // 409 Conflict - indicates race condition
                );
            }
        }
    }

    /**
     * Generate a unique order number.
     * Format: ORD-YYYYMMDD-NNNNNN
     */
    private async generateOrderNumber(session: mongoose.ClientSession): Promise<string> {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

        // Count orders created today
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        const todayOrderCount = await OrderModel
            .countDocuments({
                createdAt: { $gte: startOfDay, $lte: endOfDay }
            })
            .session(session);

        const sequence = (todayOrderCount + 1).toString().padStart(6, '0');

        return `ORD-${dateStr}-${sequence}`;
    }

    /**
     * Get location adjustment percentage for a given location.
     */
    private getLocationAdjustmentPercentage(location: string): number {
        const adjustments: Record<string, number> = {
            'US': 0,
            'EUROPE': 15,
            'ASIA': -5,
        };
        return adjustments[location] || 0;
    }

    /**
     * Calculate base subtotal (without location adjustments).
     */
    private calculateBaseSubtotal(
        products: Array<{ productId: string; quantity: number }>,
        productDetails: any[]
    ): number {
        let total = 0;
        for (const input of products) {
            const product = productDetails.find(p => p._id.toString() === input.productId);
            if (product) {
                total += product.price * input.quantity;
            }
        }
        return this.roundToTwoDecimals(total);
    }

    /**
     * Round to 2 decimal places for currency.
     */
    private roundToTwoDecimals(value: number): number {
        return Math.round(value * 100) / 100;
    }
}

