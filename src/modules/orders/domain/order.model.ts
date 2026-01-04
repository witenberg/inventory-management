import mongoose, { Schema, Document } from 'mongoose';

/**
 * Order status enum.
 */
export enum OrderStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED'
}

/**
 * Product item in an order.
 */
export interface OrderProduct {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;      // Price at the time of order (after location adjustment)
    subtotal: number;       // quantity * unitPrice
}

/**
 * Discount information applied to the order.
 */
export interface AppliedDiscount {
    type: 'VOLUME' | 'SEASONAL' | 'PROMOTIONAL' | 'NONE';
    name: string;
    percentage: number;
    amount: number;
}

/**
 * Location pricing adjustment.
 */
export interface LocationPricing {
    location: string;
    adjustmentPercentage: number;  // e.g., 15 for Europe, -5 for Asia
    adjustmentAmount: number;
}

/**
 * Plain Order data structure.
 */
export interface OrderData {
    _id: string;
    orderNumber: string;
    customerId: string;
    customerName: string;
    customerLocation: string;
    products: OrderProduct[];
    subtotalBeforeDiscount: number;
    locationPricing: LocationPricing;
    discount: AppliedDiscount;
    totalAmount: number;
    status: OrderStatus;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Interface representing the Order document in MongoDB.
 */
export interface IOrder extends Document {
    orderNumber: string;
    customerId: mongoose.Types.ObjectId;
    customerName: string;
    customerLocation: string;
    products: OrderProduct[];
    subtotalBeforeDiscount: number;
    locationPricing: LocationPricing;
    discount: AppliedDiscount;
    totalAmount: number;
    status: OrderStatus;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Order Schema Definition.
 * 
 * Design Decisions:
 * - Order number is auto-generated and unique
 * - Products array stores snapshot of product data at order time
 * - All pricing calculations are stored for audit trail
 * - Status allows for order lifecycle management
 */
const OrderSchema: Schema = new Schema(
    {
        orderNumber: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        customerId: {
            type: Schema.Types.ObjectId,
            ref: 'Customer',
            required: [true, 'Customer ID is required'],
            index: true,
        },
        customerName: {
            type: String,
            required: true,
        },
        customerLocation: {
            type: String,
            required: true,
        },
        products: [{
            productId: {
                type: String,
                required: true,
            },
            productName: {
                type: String,
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
                min: 1,
            },
            unitPrice: {
                type: Number,
                required: true,
                min: 0,
            },
            subtotal: {
                type: Number,
                required: true,
                min: 0,
            },
        }],
        subtotalBeforeDiscount: {
            type: Number,
            required: true,
            min: 0,
        },
        locationPricing: {
            location: String,
            adjustmentPercentage: Number,
            adjustmentAmount: Number,
        },
        discount: {
            type: {
                type: String,
                enum: ['VOLUME', 'SEASONAL', 'PROMOTIONAL', 'NONE'],
            },
            name: String,
            percentage: Number,
            amount: Number,
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: Object.values(OrderStatus),
            default: OrderStatus.PENDING,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Indexes for common queries
OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });

export const OrderModel = mongoose.model<IOrder>('Order', OrderSchema);

