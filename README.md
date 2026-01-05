# Inventory Management System

A REST API for managing inventory, customers, and orders, built with Node.js, Express, TypeScript, and MongoDB. This project demonstrates a modern, scalable architecture using CQRS and Event-Driven Architecture patterns.

## Features

- **Product Management**: Full CRUD operations for inventory items
- **Stock Management**: Restock and sell operations with atomic guarantees
- **Order Management**: Complete order processing with intelligent discount system
- **Customer Management**: Customer records with location-based pricing
- **Advanced Pricing Engine**:
  - Volume-based discounts (5+, 10+, 50+ units)
  - Seasonal promotions (Black Friday, Holiday Sales)
  - Location-based pricing (US, Europe, Asia)
- **Event-Driven Architecture**: Decoupled modules with domain events
- **CQRS Pattern**: Separation of commands and queries
- **Type Safety**: Full TypeScript implementation
- **Validation**: Comprehensive input validation with Zod
- **Error Handling**: Proper HTTP status codes and error messages

## Requirements

- Node.js 18+ 
- MongoDB 6.0+
- npm or yarn

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd inventory-management

# Install dependencies
npm install
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/inventory-management
NODE_ENV=development
```

### 3. Start Services

You can run the application in two ways:

#### Option A: MongoDB in Docker + Application Locally (Recommended for Development)

This approach is best for development as it allows hot reload and easier debugging:

```bash
# Start only MongoDB container
docker-compose up -d mongodb

# Wait a few seconds for MongoDB to initialize, then run the app locally
npm run dev
```

The application will connect to MongoDB running in the container at `localhost:27017`.

#### Option B: Everything in Docker Containers

This approach runs both MongoDB and the application in containers:

```bash
# Start all services (MongoDB + Application)
docker-compose up -d

# View logs
docker-compose logs -f app
```

The API will be available at `http://localhost:3000` in both cases.

**Note**: If you prefer to run MongoDB locally instead of Docker, you can start it with:
```bash
mongod --dbpath /path/to/data --replSet rs0
# Then initialize replica set manually
```

### 5. Health Check

```bash
curl http://localhost:3000/health
```

## API Documentation

### Products

#### Get All Products
```bash
GET /products?page=1&limit=10&sortBy=price&sortOrder=asc
```

Query Parameters:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `sortBy` (optional): name | price | stock | createdAt (default: createdAt)
- `sortOrder` (optional): asc | desc (default: desc)
- `search` (optional): Search by product name
- `minPrice` (optional): Filter by minimum price
- `maxPrice` (optional): Filter by maximum price
- `minStock` (optional): Filter by minimum stock

#### Get Product by ID
```bash
GET /products/:id
```

#### Create Product
```bash
POST /products
Content-Type: application/json

{
  "name": "Laptop Dell XPS",
  "description": "High-performance laptop",
  "price": 1299.99,
  "stock": 50
}
```

Validation:
- `name`: Required, max 50 characters
- `description`: Optional, string
- `price`: Required, must be positive (min 0.01)
- `stock`: Required, non-negative integer

#### Restock Product
```bash
POST /products/:id/restock
Content-Type: application/json

{
  "quantity": 20
}
```

#### Sell Product
```bash
POST /products/:id/sell
Content-Type: application/json

{
  "quantity": 5
}
```

### Customers

#### Get All Customers
```bash
GET /customers
```

#### Get Customer by ID
```bash
GET /customers/:id
```

#### Create Customer
```bash
POST /customers
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "location": "US"
}
```

Locations: `US`, `EUROPE`, `ASIA`

### Orders

#### Create Order
```bash
POST /orders
Content-Type: application/json

{
  "customerId": "507f1f77bcf86cd799439011",
  "products": [
    {
      "productId": "507f1f77bcf86cd799439012",
      "quantity": 5
    }
  ]
}
```

The order system automatically:
1. Validates customer and products exist
2. Checks stock availability
3. Applies location-based pricing
4. Calculates and applies best discount
5. Atomically updates stock levels
6. Creates order record

#### Get Order by ID
```bash
GET /orders/:id
```

### Seed Data

#### Seed Products
```bash
POST /seed/products?clearExisting=true
```

Creates sample products for testing.

#### Seed Customers
```bash
POST /seed/customers?clearExisting=true
```

Creates sample customers from different locations.

## Discount Rules

### Volume-Based Discounts
- **5-9 units**: 10% discount
- **10-49 units**: 20% discount
- **50+ units**: 30% discount

### Seasonal Promotions
- **Black Friday** (last Friday of November): 25% discount
- **Holiday Sales**:
  - New Year's Day: 15% discount on Electronics & Clothing
  - Easter Monday: 15% discount on Electronics & Clothing

### Location-Based Pricing
- **US**: Standard pricing (base price)
- **Europe**: +15% (VAT included)
- **Asia**: -5% (lower logistics costs)

### Discount Application Rules
- **Discounts cannot be combined**
- **Only the highest discount is applied** (best for customer)
- Order of evaluation:
  1. Calculate all applicable discounts
  2. Compare absolute discount amounts
  3. Apply the one that saves the customer most money

## Architecture

### Technology Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Validation**: Zod
- **Architecture Patterns**: CQRS, Event-Driven Architecture, Domain-Driven Design

### Project Structure
```
src/
├── core/                    # Core infrastructure
│   ├── cqrs.ts             # CQRS interfaces
│   ├── events/             # Event bus implementation
│   ├── errors/             # Custom error classes
│   └── middleware/         # Global middleware
├── infrastructure/          # Database and external services
│   └── database.ts
├── modules/                 # Business modules
│   ├── customers/
│   │   ├── api/            # Routes
│   │   ├── commands/       # Write operations
│   │   ├── queries/        # Read operations
│   │   ├── domain/         # Domain models & events
│   │   └── events/         # Event handlers
│   ├── inventory/
│   │   └── (same structure)
│   └── orders/
│       ├── services/       # Domain services (pricing, discounts)
│       └── (same structure)
└── config/                  # Application configuration
    ├── event-handlers.bootstrap.ts
    └── holidays.config.ts
```

### Design Patterns
- **CQRS**: Commands (write) and Queries (read) are separated
- **Event-Driven**: Domain events for loose coupling between modules
- **Repository Pattern**: Data access abstraction with Mongoose models
- **Service Layer**: Business logic in dedicated services
- **Dependency Injection**: Handler instantiation (simplified for demo)
- **Middleware Pattern**: Validation and error handling

### Key Design Decisions
See [NOTES.md](./NOTES.md) for detailed explanations of:
- Why MongoDB was chosen
- CQRS implementation approach
- Discount calculation strategy
- Stock consistency guarantees
- Trade-offs and alternatives

## Testing

This project includes comprehensive test coverage:

### Test Statistics
- **81 tests** total (62 unit + 19 integration)
- **~92% coverage** of business logic
- **Unit Tests**: Discount calculation, pricing logic, validation schemas, configuration
- **Integration Tests**: Order creation flow, stock management, concurrent operations, database transactions

### Running Tests
```bash
# Run all tests
npm test

# Run only unit tests (fast, no MongoDB required)
npm run test:unit

# Run only integration tests (requires MongoDB from docker-compose)
docker-compose up -d mongodb  # Start MongoDB if not running
npm run test:integration

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage
```

### Integration Tests Setup
Integration tests use the same MongoDB instance as production (from `docker-compose`). 

**Setup:**
1. Start MongoDB: `docker-compose up -d mongodb`
2. Run tests: `npm run test:integration`

Tests use a separate database (`inventory-management-test`) to avoid conflicts with production data. The same replica set configuration ensures transaction support works correctly.

See [tests/README.md](./tests/README.md) for detailed testing documentation.

## Docker Support

The `docker-compose.yml` file includes three services:
- **mongodb**: MongoDB database with replica set configuration
- **mongo-init**: Initializes the MongoDB replica set (required for transactions)
- **app**: Application server (optional, for containerized deployment)

**Why is `mongo-init` needed?**

MongoDB transactions require a replica set configuration, even for a single-node setup. The `mongo-init` container automatically initializes the replica set when MongoDB first starts. It:
- Waits for MongoDB to be healthy
- Checks if replica set is already initialized
- If not, runs `rs.initiate()` to set up the replica set
- Runs only once (doesn't restart automatically)

Without this initialization, MongoDB transactions (used for order creation) would fail. The container exits after initialization, so it doesn't consume resources during normal operation.

### Running Only MongoDB in Docker

For local development, you typically only need MongoDB in Docker:

```bash
# Start MongoDB (mongo-init will run automatically to initialize replica set)
docker-compose up -d mongodb

# Wait a few seconds for initialization, then run the application locally
npm run dev
```

**Note**: When you run `docker-compose up -d mongodb`, the `mongo-init` container will also start automatically to initialize the replica set, then exit. This is a one-time setup that happens on first run or after removing volumes.

### Running Everything in Docker

To run both MongoDB and the application in containers:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Clean up (removes volumes)
docker-compose down -v
```

**Note**: When running everything in Docker, the application container connects to MongoDB using the internal Docker network (`mongodb://mongodb:27017/...`), while local development connects to `localhost:27017`.

## Additional Documentation

- **[NOTES.md](./NOTES.md)** - Assumptions, technical decisions, and trade-offs (REQUIRED READING)


## Security Considerations

### Current Implementation (Demo)
- Basic input validation
- MongoDB injection prevention via Mongoose
- CORS enabled for development

### Production Recommendations
- Add authentication/authorization (JWT, OAuth2)
- Implement rate limiting
- Add request logging and monitoring
- Use environment-specific CORS configuration
- Add API versioning
- Implement proper secret management
- Add HTTPS/TLS
- Database connection encryption

## Deployment

### Environment Variables
Required environment variables for production:

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
```

### Build for Production
```bash
npm run build
```

Compiled JavaScript will be in the `dist/` folder.

### Process Management
Use PM2 or similar for process management in production:

```bash
npm install -g pm2
pm2 start dist/index.js --name inventory-api
```

## Cloud Deployment Ready

This application is designed for easy deployment to cloud platforms with Infrastructure as Code (IaC):

### Why This Architecture is Cloud-Ready

1. **Stateless Design**
   - No session storage in-memory
   - Can scale horizontally
   - Multiple instances can run behind load balancer

2. **Environment-Based Configuration**
   - All config via environment variables
   - No hardcoded URLs or credentials
   - Supports multi-environment deployments (dev/staging/prod)

3. **Health Checks**
   - `/health` endpoint for load balancer health checks
   - Database connection validation
   - Ready for AWS ELB, Azure Load Balancer, GCP Health Checks

4. **Container-Ready**
   - Dockerfile included
   - Docker Compose for local development
   - Can deploy to ECS, EKS, AKS, GKE, Cloud Run

5. **Database Flexibility**
   - MongoDB connection via URI
   - Works with MongoDB Atlas (managed cloud database)
   - Supports connection pooling for high concurrency


### What Makes This Easy to Deploy

1. **12-Factor App Compliance**
   - Config in environment
   - Stateless processes
   - Port binding
   - Logs to stdout

2. **Modular Architecture**
   - Easy to split into microservices later
   - Clean module boundaries (`customers`, `inventory`, `orders`)
   - Event-driven communication ready

3. **CQRS Pattern**
   - Read/write separation already implemented
   - Easy to add read replicas
   - Can scale read and write sides independently

4. **Event Bus**
   - Already decoupled via events
   - Easy to swap in SNS/SQS (AWS), Service Bus (Azure), Pub/Sub (GCP)
   - Prepared for eventual consistency



### Production Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production`
- [ ] Use managed MongoDB (Atlas, DocumentDB, CosmosDB)
- [ ] Configure secrets management (AWS Secrets Manager, Azure Key Vault, GCP Secret Manager)
- [ ] Set up monitoring (CloudWatch, Application Insights, Cloud Monitoring)
- [ ] Configure logging aggregation (CloudWatch Logs, Log Analytics, Cloud Logging)
- [ ] Add authentication/authorization
- [ ] Implement rate limiting
- [ ] Set up CI/CD pipeline
- [ ] Configure CORS for specific origins
- [ ] Enable HTTPS/TLS
- [ ] Set up automated backups
- [ ] Configure alerts (high error rate, database connection issues)

---

**For detailed technical insights, implementation decisions, and trade-offs, please read [NOTES.md](./NOTES.md)**

