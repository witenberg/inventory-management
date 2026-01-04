import mongoose, { Schema, Document } from 'mongoose';

/**
 * Location enum for pricing rules.
 */
export enum CustomerLocation {
    US = 'US',
    EUROPE = 'EUROPE',
    ASIA = 'ASIA'
}

/**
 * Plain Customer data structure.
 */
export interface CustomerData {
    _id: string;
    name: string;
    email: string;
    location: CustomerLocation;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Interface representing the Customer document in MongoDB.
 */
export interface ICustomer extends Document {
    name: string;
    email: string;
    location: CustomerLocation;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Customer Schema Definition.
 * 
 * Design Decisions:
 * - Location is stored for pricing calculations
 * - Email is unique to prevent duplicate customers
 */
const CustomerSchema: Schema = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Customer name is required'],
            trim: true,
            maxlength: [100, 'Customer name cannot exceed 100 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
        },
        location: {
            type: String,
            enum: Object.values(CustomerLocation),
            required: [true, 'Location is required'],
            default: CustomerLocation.US,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Index for faster email lookups (unique constraint)
CustomerSchema.index({ email: 1 }, { unique: true });

export const CustomerModel = mongoose.model<ICustomer>('Customer', CustomerSchema);

