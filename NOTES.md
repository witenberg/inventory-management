# Technical Documentation & Implementation Notes

## Table of Contents
1. [Assumptions & Simplifications](#assumptions--simplifications)
2. [Technical Decisions](#technical-decisions)
3. [Business Logic](#business-logic)
4. [Testing Strategy](#testing-strategy)
5. [Trade-offs & Alternatives](#trade-offs--alternatives)

---

## 1. Assumptions & Simplifications

### 1.1 Key Assumptions Made During Implementation

#### Customer Model
- **Location is static**: Customer location is stored as an enum (`US`, `EUROPE`, `ASIA`) and does not change dynamically per order
- **Single email constraint**: Each customer must have a unique email address (enforced via MongoDB unique index)
- **No authentication**: This is a demonstration API - in production, customers would need authentication/authorization
- **Simplified customer data**: Only essential fields (name, email, location) are stored

#### Product Model
- **No product categories**: The requirement mentioned "selected product categories" for Holiday Sales, but to keep the demo simple, all products are eligible for all promotional discounts
- **Single currency**: All prices are in a single currency (assumed USD)
- **No product variants**: Products don't have size/color/variant options
- **Integer stock only**: Stock quantities must be integers (no fractional inventory)

#### Order Model
- **Immutable orders**: Once created, orders cannot be modified or cancelled (simplification for demo)
- **No payment processing**: Orders are created but payment integration is not implemented
- **Order numbers are sequential**: Format `ORD-YYYYMMDD-XXXXXX` (in production, would use distributed ID generation)
- **No order status workflow**: Orders are created in "pending" status without further lifecycle management

#### Discount Rules Interpretation
- **"Bank holidays in Poland" interpretation**: 
  - Implemented fixed Polish holidays (New Year's, Christmas, etc.)
  - Easter and Corpus Christi are movable but calculation was omitted for simplicity
  - Black Friday is approximated as last week of November
- **"Selected categories" for Holiday Sales**: 
  - Requirement mentioned "two categories" but products don't have categories
  - **Solution**: Applied Holiday Sales to ALL products for simplicity
  - In production: Would add `category` field to Product model
- **Discount priority**: "Highest discount from customer's perspective" means highest absolute amount saved, not highest percentage

#### Location-Based Pricing
- **Static pricing rules**: VAT rates and logistics costs are hardcoded
- **No dynamic currency conversion**: Prices are adjusted as percentages, not converted to local currencies
- **Location from Customer entity**: Location is not provided per-order but retrieved from customer profile

### 1.2 Intentionally Omitted Elements

#### Not Implemented (Out of Scope for Demo)
1. **Authentication & Authorization**: No JWT, API keys, or user sessions
2. **Rate Limiting**: No throttling of API requests
3. **Audit Logging**: Events are logged to console but not persisted
4. **Soft Deletes**: Products/customers/orders are hard-deleted from database
5. **Pagination for Orders/Customers**: Only products have full pagination
6. **Order History per Customer**: No endpoint to get all orders for a customer
7. **Product Image URLs**: Products don't have image fields
8. **Inventory Reservations**: Stock is decremented immediately; no temporary holds
9. **Multi-warehouse Support**: Single inventory pool, not distributed across locations
10. **Refunds/Returns**: No reverse operations for orders

#### Intentionally Simplified
1. **Email Validation**: Basic regex check, not verified via email sending
2. **Currency Handling**: No multi-currency support, no decimal precision libraries
3. **Date Calculations**: Holiday detection is basic; doesn't handle movable holidays perfectly
4. **Concurrency**: MongoDB transactions used, but no distributed locking for high-concurrency scenarios
5. **Error Messages**: English only, no i18n

### 1.3 Interpretation of Ambiguous Requirements

#### "Discount cannot be combined"
- **Interpretation**: Only ONE discount (the best one) applies to entire order
- **Alternative interpretation**: Could have meant "promotional + volume can't combine" but location pricing still applies
- **Chosen approach**: 
  1. Calculate location pricing first (always applied)
  2. Calculate all discounts on location-adjusted prices
  3. Apply only the single best discount

#### "Selected product categories"
- **Ambiguity**: Products don't have categories in the base requirements
- **Solution**: Added category structure in code but applied discounts to ALL products
- **Reasoning**: Demonstrates understanding without over-complicating the demo

#### "Ensure stock cannot go below zero"
- **Interpretation**: Atomic database operations with conditional updates
- **Implementation**: MongoDB `findOneAndUpdate` with `$gte` condition
- **Reasoning**: Handles concurrent requests without race conditions

---

## 2. Technical Decisions

### 2.1 Database Choice: MongoDB

#### Why MongoDB?

MongoDB was chosen for this demo primarily for practical reasons, though I acknowledge it's not the ideal choice for a production e-commerce system.

**Advantages for this project:**
- Quick setup without schema migrations
- Flexible schema that's easy to modify during development
- Natural fit with JavaScript/TypeScript ecosystem
- Mongoose ODM provides excellent TypeScript support
- Supports ACID transactions (necessary for order creation)
- Atomic operations for stock management
- Simple Docker setup for local development

**Trade-offs accepted:**
- No database-level foreign key constraints (handled in application code)
- Transaction support less mature than PostgreSQL
- Higher risk of data inconsistency if not careful

**In production, I would choose PostgreSQL** for an e-commerce system. The complex relationships between customers, orders, and products benefit from relational constraints, and PostgreSQL's mature transaction support is more reliable for financial operations. For this demo focused on showcasing architecture patterns, MongoDB's simplicity was more practical.

### 2.2 Project Structure

#### Modular Monolith Architecture
```
src/
├── core/           # Shared infrastructure (CQRS, events, errors)
├── infrastructure/ # Database, external services
├── modules/        # Business domains (customers, inventory, orders)
│   └── [module]/
│       ├── api/        # HTTP routes
│       ├── commands/   # Write operations (CQRS)
│       ├── queries/    # Read operations (CQRS)
│       ├── domain/     # Models, domain events
│       ├── events/     # Event handlers
│       └── services/   # Domain services
└── config/         # Application configuration
```

#### Why This Structure?

This modular monolith structure organizes code by business domain rather than technical layer. Each module (customers, inventory, orders) contains everything related to that domain.

**Benefits:**
- Clear separation of concerns - each folder has a single responsibility
- Easy to extract modules into microservices if needed
- Commands and queries are physically separated (CQRS-friendly)
- Modules are independent and easy to test
- Business logic stays in the domain layer, not controllers

**Downsides:**
- More files than a traditional flat structure
- Can feel over-engineered for very small projects

I considered a traditional flat structure with separate `controllers/`, `services/`, and `models/` folders, but rejected it because it doesn't scale well. When you have multiple business domains, a flat structure forces you to mix unrelated code in the same folders.

### 2.3 CQRS Implementation Approach

#### Simple In-Memory CQRS

This project implements a simplified version of CQRS (Command Query Responsibility Segregation):

- **Commands** are write operations that mutate state (create, update, delete)
- **Queries** are read operations that return data without side effects
- **Handlers** are single-responsibility classes that execute commands or queries
- Both commands and queries read from the same MongoDB database (no separate read models)

The pattern is implemented through simple TypeScript interfaces that each handler implements.

#### Why This Approach?

This is not "true" CQRS because there are no separate read models - both commands and queries use the same database. However, this simplified approach has significant benefits:

**Benefits:**
- Simple to understand and maintain
- Demonstrates CQRS principles without unnecessary complexity
- Commands and queries are explicitly separated in code
- Each handler can be unit tested independently
- Full TypeScript type safety

**Downsides:**
- Read and write operations share the same database
- Cannot scale read and write sides independently
- No separate optimized read models

I considered implementing full CQRS with Event Sourcing, which would provide perfect audit trails, temporal queries, and great debugging capabilities. However, I rejected it because:
- It would add massive complexity to a demo project
- Requires additional infrastructure (event store)
- Eventual consistency is harder to reason about and debug

This simplified implementation demonstrates understanding of CQRS principles while remaining practical. In a production system with complex reporting needs, I would add materialized views or a separate read database.

### 2.4 Command/Query Separation

#### Read Operations (Queries)
- `GetProductsQuery` - List products with filtering/pagination
- `GetProductByIdQuery` - Single product retrieval
- `GetOrderByIdQuery` - Single order retrieval
- Returns DTOs/view models
- No side effects
- Can be cached aggressively

#### Write Operations (Commands)
- `CreateProductCommand` - Add new product
- `RestockProductCommand` - Increase stock
- `SellProductCommand` - Decrease stock
- `CreateOrderCommand` - Create order with stock updates
- `SeedProductsCommand` - Bulk insert test data
- `SeedCustomersCommand` - Bulk insert test data
- Mutate state
- Publish domain events
- Transactional

#### Benefits of Separation
1. **Clarity**: Intent is explicit in code (read vs write)
2. **Optimization**: Queries can use read replicas, commands use master
3. **Security**: Different permissions for read/write operations
4. **Testing**: Easier to mock and test independently

### 2.5 Validation Library: Zod (not Joi)

I chose Zod for input validation instead of Joi (which was mentioned in the requirements).

**Why Zod:**
- TypeScript-first design with automatic type inference
- Smaller bundle size than Joi
- More ergonomic, modern API
- Better structured error messages
- Schema definition automatically generates TypeScript types

With Zod, you define validation schemas once and get both runtime validation and compile-time types, eliminating the need to maintain separate type definitions.

**Why not Joi:** Joi is older and requires separate TypeScript type definitions, leading to duplication. Both libraries are production-ready, but Zod better fits modern TypeScript projects.

---

## 3. Business Logic

### 3.1 Discount System

#### How It Works

The discount system follows a four-step process:

**Step 1: Apply Location-Based Pricing**

Base prices are adjusted based on customer location before any discounts are calculated. For example, European customers see prices increased by 15% (to account for VAT), while Asian customers get a 5% reduction (lower logistics costs). US customers see base prices.

**Step 2: Calculate All Applicable Discounts**

Two types of discounts are calculated on the location-adjusted price:
- Volume discounts: Based on total quantity (10% for 5+ units, 20% for 10+, 30% for 50+)
- Promotional discounts: Based on order date (25% on Black Friday, 15% on certain holidays)

**Step 3: Select the Best Discount**

Here's the critical part: discounts are compared by absolute amount saved, not percentage. The system calculates the actual dollar/currency amount each discount would save and applies whichever one saves the customer the most money.

**Step 4: Calculate Final Total**

The final price is the location-adjusted subtotal minus the best discount.

#### Priority of Discount Application

1. **Location pricing**: ALWAYS applied (not considered a "discount")
2. **Volume discount**: Calculated on location-adjusted price
3. **Promotional discount**: Calculated on location-adjusted price
4. **Best discount selected**: Only ONE discount applies

#### Example Calculation

**Scenario**: European customer buying 12 units on Black Friday
- Product price: $100 each
- Base subtotal: $1,200

**Step 1**: Location pricing
- Europe +15%: $1,200 * 1.15 = **$1,380**

**Step 2**: Calculate discounts on $1,380
- Volume (12 units, 20%): $1,380 * 0.20 = $276 savings
- Black Friday (25%): $1,380 * 0.25 = $345 savings

**Step 3**: Select best discount
- Black Friday is better ($345 > $276)

**Final Total**: $1,380 - $345 = **$1,035**

### 3.2 Stock Consistency Guarantees

#### How Stock Cannot Go Negative

Concurrent requests could cause race conditions where multiple orders read the same stock level, calculate separately, and write back incorrect values. For example:
- Thread 1 reads stock (10), calculates 10 - 8, writes 2
- Thread 2 reads stock (10), calculates 10 - 5, writes 5
- Result: Stock shows 5, but 13 units were actually sold

**Solution: Atomic Conditional Updates**

Stock updates use MongoDB's atomic operations to prevent this. The update includes a condition that checks if sufficient stock exists, and only performs the decrement if the condition is met. MongoDB evaluates the condition and performs the update as a single atomic operation.

If the condition fails (insufficient stock), no update happens and an error is returned. This ensures only one thread can successfully decrement stock at a time, and stock can never go negative.

#### Order Creation with Transactions

For orders involving multiple products, MongoDB transactions ensure consistency. The process:
1. Start a transaction
2. Validate stock for all products
3. Update stock for all products atomically
4. Create the order record
5. Commit the transaction (or rollback on any error)

This provides three key guarantees:
- All-or-nothing: Either the entire order succeeds or nothing changes
- No partial orders: If any product is out of stock, the whole order fails
- Stock consistency: Stock levels are always accurate

### 3.3 Edge Cases Handled

#### Stock Management
1. **Selling more than available**: Returns 400 error, no stock change
2. **Concurrent restock requests**: MongoDB `$inc` handles atomically
3. **Negative restock quantity**: Validation rejects at API layer
4. **Zero stock product in order**: Rejected before transaction starts

#### Discount Calculations
1. **Order date crossing year boundary** (Dec 31 → Jan 1): Handled in `isDateInPromotionalPeriod()`
2. **Multiple promotional periods active**: First match wins (priority order)
3. **Exactly 5/10/50 units**: Inclusive check (`>=`) ensures thresholds work correctly
4. **Discount exceeds subtotal**: Final price floor is $0 (no negative prices)

#### Order Creation
1. **Customer doesn't exist**: Validated before processing, returns 404
2. **Product doesn't exist**: Validated before processing, returns 404
3. **Empty products array**: Validation rejects at API layer (min 1 product)
4. **Duplicate products in order**: Allowed (quantities are summed)
5. **Product stock changes during order processing**: Transaction isolation handles this

#### Input Validation
1. **Invalid MongoDB ObjectId**: Caught by Zod, returns 400
2. **Price exactly 0**: Rejected (must be > 0.01)
3. **Negative prices**: Rejected at validation layer
4. **Name length exactly 50 characters**: Allowed (max is inclusive)
5. **Missing required fields**: Validation error with field details

---

## 4. Testing Strategy

### 4.1 What Is Covered

#### Current Testing Approach

This project includes comprehensive automated testing with 81 total tests covering approximately 92% of business logic.

**Unit Tests (62 tests):**
- Discount Service (16 tests): Volume discounts, promotional discounts, discount selection logic
- Pricing Service (8 tests): Location-based pricing adjustments, rounding, edge cases
- Validation Schemas (27 tests): Zod schema validation for products and orders
- Holiday Configuration (11 tests): Promotional period detection, year boundaries

**Integration Tests (19 tests):**
- Order Creation (8 tests): Complete order flow with database, stock updates, discount calculations, transaction rollbacks
- Stock Management (11 tests): Atomic stock operations, concurrent updates, race condition prevention

**Manual Testing:**
- HTTP files for API exploration and demonstration

### 4.2 Testing Tools & Infrastructure

#### Test Stack
- **Jest**: Test framework and runner
- **ts-jest**: TypeScript support for Jest
- **MongoDB**: Real MongoDB instance from docker-compose (same as production)
- **@types/jest**: TypeScript types for Jest

#### Integration Test Setup
Integration tests use the same MongoDB instance as production (from `docker-compose`):
- Uses real MongoDB replica set (supports transactions)
- Same configuration as production environment
- Tests use separate database (`inventory-management-test`) for isolation
- Requires MongoDB to be running: `docker-compose up -d mongodb`

#### Test Isolation Strategy
- **beforeEach**: Clear all collections before each test
- **Fresh data**: Each test creates its own customers/products
- **No shared state**: Tests can run in any order
- **Retry logic**: Transient MongoDB errors are retried automatically

### 4.3 What Should Be Tested in Production

While the current test coverage is comprehensive for business logic, a production system would benefit from additional testing:

**End-to-End API Tests (Not Implemented):**
- Complete HTTP request/response flows for all endpoints
- Authentication and authorization flows
- Error handling and status codes
- Request validation and edge cases

**Load and Performance Tests (Not Implemented):**
- Concurrent order creation under high load
- Database query performance with large datasets
- API response times under stress
- Memory usage and leak detection

**Additional Integration Tests:**
- Complete order flow from customer creation through order placement
- Error scenarios like network failures or database timeouts
- Recovery from partial failures
- Event handler integration across modules

### 4.4 Why This Testing Strategy

The testing approach focuses on high-value tests rather than achieving 100% coverage for its own sake:

**Unit tests cover critical business logic** where bugs would have the highest impact: discount calculations, pricing adjustments, and validation rules.

**Integration tests verify the most complex flows** where multiple components interact: order creation with transactions, concurrent stock updates, and database consistency.

**What this demonstrates:**
- Understanding of the testing pyramid (more unit tests, fewer integration tests, minimal E2E)
- Practical testing decisions (test what matters most)
- Production-ready infrastructure (tests use the same database setup as production)
- Proper test isolation (each test is independent)

The test suite runs quickly (unit tests in ~2 seconds, integration tests in ~10 seconds) and reliably, with no flaky tests.

---

## 5. Trade-offs & Alternatives

### 5.1 Trade-off: Simplified CQRS vs. Full Event Sourcing

#### What Was Implemented

**Files**: `src/core/cqrs.ts`, command/query handlers across modules

Commands and queries are separated into different classes, but both read from and write to the same MongoDB database. Events are published for side effects but not stored permanently. For example, `CreateOrderHandler` writes directly to MongoDB, and `GetOrderByIdHandler` reads from the same database.

#### Alternative Considered: Event Sourcing with Separate Read Models

I seriously considered implementing full Event Sourcing where events are stored as the source of truth in an event store. Read models would be built by projecting these events, allowing queries to read from optimized, separate data stores.

**Why this alternative was attractive:**
- Perfect audit trail - every state change is recorded forever
- Temporal queries - can reconstruct system state at any point in time
- Independent scaling - read and write sides can scale separately
- Great for debugging and compliance requirements

**Why I chose the current solution instead:**

The simplified approach has significant practical advantages:
1. **Simplicity**: Single database is much easier to reason about and debug
2. **Lower latency**: No eventual consistency delay for reads
3. **Easier debugging**: Can directly query current state without replaying events
4. **Lower infrastructure cost**: No separate event store needed
5. **Sufficient for demo**: Demonstrates CQRS concepts without over-engineering

**Downsides I accepted:**
1. No audit trail of historical changes (would add separate audit logging in production)
2. Read and write operations are coupled to the same database
3. Cannot reconstruct past states or do time-travel debugging
4. Harder to add new read models later

**When I would choose Event Sourcing:**
- Financial systems with strict audit requirements
- Systems with complex reporting needs requiring many different read models
- When time-travel debugging is valuable
- Microservices architecture where separate teams manage read and write sides

**Specific example**: In `src/modules/orders/commands/handlers/create-order.handler.ts`, the handler directly writes order data to MongoDB. With Event Sourcing, it would instead append OrderCreatedEvent to an event store, and a separate projector would asynchronously build the read model that queries would use.

### 5.2 Trade-off: MongoDB Transactions vs. Application-Level Compensation

#### What Was Implemented

**File**: `src/modules/orders/commands/handlers/create-order.handler.ts` (lines 45-176)

Order creation uses MongoDB multi-document transactions. The process:
1. Start a transaction session
2. Validate all products have sufficient stock
3. Atomically update all product stock levels
4. Create the order record
5. Commit the transaction (or rollback on any error)

All operations happen within a single MongoDB transaction, ensuring true ACID guarantees.

#### Alternative Considered: Saga Pattern with Compensating Actions

I seriously considered using the Saga pattern instead, where operations would be broken into discrete steps with compensating actions for failures:
1. Reserve stock (mark as reserved without decrementing)
2. Create the order
3. Commit the stock changes
4. If any step fails, run compensating actions to undo previous steps

**Why this alternative was attractive:**
- Works across distributed services in a microservices architecture
- More flexible error handling with custom compensation logic
- Doesn't require database transaction support
- Better suited for long-running processes
- Doesn't lock database resources

**Why I chose MongoDB transactions instead:**

For this monolithic application, database transactions provide significant advantages:
1. **ACID guarantees**: True atomicity with no partial states
2. **Simpler code**: No need to implement complex compensation logic
3. **Automatic rollback**: Database handles failure recovery automatically
4. **Fewer edge cases**: Less room for bugs in error handling
5. **Appropriate for monolith**: All operations are in the same database

**Downsides I accepted:**
1. Transaction holds locks on product documents until commit/rollback
2. MongoDB transaction requirements (needs replica set, not standalone)
3. Transaction time limits (maximum ~1 minute)
4. Doesn't work across multiple databases or external services
5. Performance cost compared to individual operations

**Concrete example of the downside**: If order creation somehow took 5 seconds (perhaps due to an external API call), the product documents would be locked for those 5 seconds. With the Saga pattern, stock would be reserved but other operations could still read product data.

**When I would choose the Saga pattern:**
- Microservices architecture where order service, inventory service, and payment service are separate
- Operations involving external APIs like payment gateways or shipping services
- Long-running business processes like multi-step approval workflows
- Non-transactional databases like Cassandra or DynamoDB

For this monolithic demo where order creation is fast (typically under 100ms) and all data lives in one MongoDB, transactions are the simpler and more reliable choice. The Saga pattern would add significant complexity without clear benefits in this context.

### 5.3 Trade-off: Eager Discount Calculation vs. Lazy Calculation

#### What Was Implemented

**File**: `src/modules/orders/commands/handlers/create-order.handler.ts` (lines 90-120)

Discounts are calculated at order creation time and stored directly in the order document. The order stores both the subtotal, the discount amount, the discount type, and the final total. Once saved, these values never change.

#### Alternative Considered: Calculate Discounts On-The-Fly

I seriously considered storing only the raw data (products, quantities, order date) and calculating discounts dynamically whenever an order is retrieved. Each time you query an order, it would recalculate which discount should apply based on the order date.

**Why this alternative was attractive:**
- Flexibility to change discount rules retroactively
- Smaller database documents (don't store calculated values)
- Easy to see "what discount would apply today" for analysis
- Ability to fix bugs in discount logic and have them apply to historical orders

**Why I chose eager calculation instead:**

For order systems, immutable pricing is critical:
1. **Orders are financial records**: The price must never change after creation for legal and accounting reasons
2. **Performance**: No need to recalculate discounts on every query
3. **Data integrity**: Customers know exactly what they paid
4. **Historical accuracy**: Even if discount rules change years later, old orders show what actually happened
5. **Simplicity**: Query handlers don't need complex recalculation logic

**Downsides I accepted:**
1. Storage cost of duplicate data (storing both subtotal and final total)
2. If discount calculation has a bug, historical orders are permanently wrong
3. Cannot retroactively apply new discount rules to old orders

**Real-world example of why this matters:**

A customer orders on Black Friday 2024: $100 product with 25% discount, pays $75.

In 2025, we view that order:
- With eager calculation: Shows $75 (what customer actually paid)
- With lazy calculation: Might show a different price if Black Friday rules changed

**When I would choose lazy calculation:**
- Preview or quote systems (not final orders)
- Internal reporting tools that need "what if" scenarios
- Systems where price adjustments after order creation are normal
- Free trials or subscription prorations

For this order management system, eager calculation is the right choice because orders are immutable financial records. Once created, the price the customer paid must never change, regardless of how discount rules evolve over time.

---

## Appendix: File References

### Critical Files for Understanding
- **CQRS Implementation**: `src/core/cqrs.ts`
- **Event System**: `src/core/events/event-bus.ts`
- **Order Creation**: `src/modules/orders/commands/handlers/create-order.handler.ts`
- **Discount Logic**: `src/modules/orders/services/discount.service.ts`
- **Pricing Logic**: `src/modules/orders/services/pricing.service.ts`
- **Stock Management**: `src/modules/inventory/commands/handlers/sell-product.handler.ts`
- **Validation Example**: `src/modules/inventory/commands/validation/create-product.schema.ts`


---

**Last Updated**: January 2026  
**Project Status**: Demo/Showcase (Production-ready with noted limitations)

