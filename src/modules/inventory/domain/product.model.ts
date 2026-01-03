import mongoose, { Schema, Document } from 'mongoose';

/**
 * Plain Product data structure (without Mongoose methods).
 * Use this type for read operations with .lean() or DTOs.
 */
export interface ProductData {
    _id: string;
    name: string;
    description?: string;
    price: number;
    stock: number;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Interface representing the Product document in MongoDB.
 * Extends Mongoose's Document to include built-in methods like .save(), ._id, etc.
 * Use this type for operations that need Mongoose document methods.
 */
export interface IProduct extends Document {
    name: string;
    description?: string;
    price: number;
    stock: number;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Product Schema Definition.
 * * Design Decisions:
 * - Strict typing ensures data integrity at the database level.
 * - Indexes can be added here for performance (e.g., on 'name' if search is required).
 * - Timestamps are automatically managed by Mongoose.
 */
const ProductSchema: Schema = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Product name is required'],
            trim: true,
            maxlength: [50, 'Product name cannot exceed 50 characters'], // Requirement strictly enforced
        },
        description: {
            type: String,
            trim: true,
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0.01, 'Price must be positive'], // Requirement: "Price always positive"
        },
        stock: {
            type: Number,
            required: [true, 'Initial stock is required'],
            min: [0, 'Stock cannot be negative'], // Requirement: "Stock cannot go below zero"
            validate: {
                validator: Number.isInteger,
                message: 'Stock must be an integer',
            },
        },
    },
    {
        timestamps: true,
        versionKey: false, // Disables __v field as we rely on atomic operators for concurrency
    }
);

export const ProductModel = mongoose.model<IProduct>('Product', ProductSchema);