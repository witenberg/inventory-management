import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory-db';

    try {
        mongoose.set('strictQuery', true);

        await mongoose.connect(uri);
        console.log(`Connected to MongoDB at ${uri}`);
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }

    mongoose.connection.on('error', (err) => {
        console.error('MongoDB runtime error:', err);
    });
};