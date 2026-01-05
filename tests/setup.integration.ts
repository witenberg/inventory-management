import mongoose from 'mongoose';

/**
 * Setup for Integration Tests
 * 
 * Integration tests require a real MongoDB connection.
 * This setup connects to MongoDB before all tests and cleans up after.
 */

beforeAll(async () => {
    // Use real MongoDB from docker-compose
    // For local tests we use directConnection to bypass replica set discovery
    // (replica set is needed for transactions, but discovery may not work from localhost)
    const testMongoUri = process.env.MONGODB_URI_TEST ||
        process.env.MONGO_URI ||
        'mongodb://localhost:27017/inventory-management-test?replicaSet=rs0&directConnection=true';

    mongoose.set('strictQuery', true);

    try {
        await mongoose.connect(testMongoUri, {
            serverSelectionTimeoutMS: 5000, // 5 seconds timeout
        });
        console.log(`✓ Connected to MongoDB for integration tests: ${testMongoUri}`);
    } catch (error) {
        console.error('✗ Failed to connect to MongoDB:', error);
        throw error;
    }
}, 30000); // 30 seconds timeout for connection

beforeEach(async () => {
    // Clear all collections before each test to ensure isolation
    if (mongoose.connection.readyState === 1) {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            const collection = collections[key];
            await collection.deleteMany({});
        }
    }
});

afterAll(async () => {
    // Clean up: close the connection
    if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
        console.log('✓ Disconnected from MongoDB');
    }
});

