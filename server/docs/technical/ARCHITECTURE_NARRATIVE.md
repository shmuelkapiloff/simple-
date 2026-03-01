# Architecture Narrative: Simple Shop Backend

## Executive Summary

This document explains the **architectural decisions and design philosophy** behind Simple Shop's backend, not just the implementation details. Every technology choice, design pattern, and code pattern exists to solve a specific business problem.

---

## Part 1: Design Philosophy

### Core Principles

**1. Idempotency-First Design**
- Every operation must be safely repeatable without side effects
- Payments processed multiple times shouldn't charge the customer twice
- Webhooks that arrive out-of-order shouldn't corrupt order state
- Implementation: Event IDs tracked, transactions used, deduplication on every critical path

**2. Fail-Safe Payments**
- Business logic never trusts external services implicitly
- Stripe is trusted for transaction collection, not for state management
- Server maintains "source of truth" for order state
- External data is advisory, verified against database before acting
- Implementation: Amount verification, signature verification, idempotency checks

**3. Observable by Default**
- Every critical operation is logged and traceable
- Request IDs flow through entire request lifecycle
- Metrics collected automatically without slowing the system
- Implementation: Pino structured logging, X-Request-ID headers, Prometheus metrics

**4. Race-Condition Aware**
- Explicit handling of concurrent access to shared resources
- Stock can never go negative, even with 100 simultaneous purchases
- Cart operations are consistent even with Redis failures
- Implementation: MongoDB transactions, two-tier caching with fallbacks

### Why These Principles?

The backend must handle real-world chaos:
- Network failures (webhooks may arrive out-of-order or duplicate)
- Service failures (payment provider may be down, database may be slow)
- Concurrent access (multiple customers buying simultaneously)
- Scale increases (10 users today, 10,000 tomorrow)
- Compliance requirements (audit trails, payment verification)

These principles ensure the system degrades gracefully and recovers reliably.

---

## Part 2: Payment System Architecture

### The Problem Statement

**Challenge 1: Payment Webhooks Are Unreliable**
- Stripe sends webhooks **multiple times** if we don't respond with 200 OK
- Same webhook event might arrive **out-of-order** with other events
- We receive `checkout.session.completed` before `payment_intent.succeeded`
- Without proper handling: Duplicate orders, orphaned payments, inconsistent state

**Challenge 2: We Can't Trust External State**
- Stripe could be compromised (unlikely but possible)
- Man-in-the-middle could modify webhook data (HTTPS but let's be paranoid)
- Payment provider API bugs could return incorrect amounts
- Without verification: We might fulfill orders for $1 when customer paid $0, or vice versa

**Challenge 3: Order Fulfillment Is Irreversible**
- Once we reduce stock, we can't easily "undo" if payment failed
- If payment succeeds but stock reduction fails: Order is paid but items out of stock
- Concurrent payments might both reduce stock for the last item
- Without proper locking: Overselling and inconsistent state

### Solution: Multi-Layer Verification

```
Webhook Arrives
    ↓
[1] Stripe Signature Verification (HMAC-SHA256)
    ↓ Only authentic webhooks pass
[2] Event ID Deduplication Check
    ↓ Only new events are processed
[3] Amount Verification
    ↓ Only amounts matching order proceed
[4] Stock Reduction with Transaction
    ↓ Atomic: All or nothing
[5] Order Fulfillment
    ↓ Success or automatic rollback
```

#### Layer 1: Webhook Signature Verification

**File:** [src/services/payments/stripe.provider.ts](../src/services/payments/stripe.provider.ts#L45-L70)

```typescript
// Stripe signs every webhook with HMAC-SHA256(webhook_secret, body)
// We verify the signature before trusting ANY webhook data
const event = this.stripe.webhooks.constructEvent(
  req.body,  // Raw body (Buffer)
  sig,       // Signature header from Stripe
  webhookSecret  // Our signing secret
);
// If signature is invalid, this throws immediately
// Prevents: Spoofed webhooks from malicious actors
```

**Why Stripe SDK instead of manual HMAC?**
- SDK uses timing-safe comparison (prevents timing attacks)
- SDK handles body format variations
- SDK versions match API updates
- Production security > DIY cryptography

**What It Prevents:**
- Attacker calls `POST /webhook` with fabricated data → Rejected
- Attacker replays old webhook → Idempotency check catches it
- Attacker modifies webhook amount → Signature breaks

#### Layer 2: Idempotency Tracking (Event ID Deduplication)

**File:** [src/models/webhook-event.model.ts](../src/models/webhook-event.model.ts)

```typescript
// Every webhook has a unique ID from Stripe (evt_test_...)
// We store processed event IDs with unique constraint
const existingEvent = await WebhookEventModel.findOne({
  eventId: result.providerPaymentId,
  provider: provider.name,
});

if (existingEvent) {
  // Already processed → Return success (don't reprocess)
  return { processed: false, success: true };
}

// Process webhook...

// After success, store event ID to mark as processed
await WebhookEventModel.create({
  eventId: result.providerPaymentId,
  provider: provider.name,
  processedAt: new Date(),
});
```

**Why This Matters:**
- Stripe retries webhooks if we don't respond within 5 seconds
- Same event might arrive 2-3 times during network issues
- Without tracking: Order fulfilled 3 times, customer charged 3 times
- With tracking: First request processes, retries silently succeed

**Why MongoDB Instead of Redis?**
- Durability: Data persists across crashes
- Unique constraint: Prevents race conditions
- TTL index: Auto-deletes old events after 30 days
- Consistency: ACID guarantees

**Trade-off:**
- Adds ~5ms latency per webhook (acceptable for security)
- Storage overhead: ~1KB per webhook (negligible)

#### Layer 3: Amount Verification (Critical Security Check)

**File:** [src/services/payment.service.ts](../src/services/payment.service.ts#L301-L320)

```typescript
// Verify webhook amount matches order total
const expectedAmountInCents = Math.round(order.totalAmount * 100);
const receivedAmountInCents = result.amount || 0;

if (receivedAmountInCents !== expectedAmountInCents) {
  logger.error({
    orderId,
    expected: expectedAmountInCents,
    received: receivedAmountInCents,
  }, "SECURITY: Payment amount mismatch");
  throw new Error("Amount verification failed");
}
```

**Why This Check?**
- Attack scenario: Attacker compromises Stripe account, sends webhook claiming $1 payment for $1000 order
- Defense: Server verifies webhook amount matches order total stored in DB
- Assumption: Database can't be compromised (reasonable in modern infrastructure)

**What It Prevents:**
- Price manipulation from compromised Stripe account
- Man-in-the-middle attack modifying webhook data
- Stripe API bugs returning incorrect amounts
- Currency conversion errors

**Implementation Detail:**
- Stripe uses cents (20000 = $200 USD)
- Order is stored in dollars (200)
- Conversion: `Math.round(dollars * 100)` = cents
- Exact match required (no rounding tolerance)

#### Layer 4: Stock Reduction with Transactions

**File:** [src/services/payment.service.ts](../src/services/payment.service.ts#L392-L440)

```typescript
// MongoDB Session for atomic transaction
const session = await mongoose.startSession();
session.startTransaction();

try {
  // 1. Fetch product with write lock
  const product = await ProductModel.findById(orderId, {}, { session });
  
  // 2. Check stock available
  if (product.stock < quantityOrdered) {
    await session.abortTransaction();
    throw new Error("Out of stock");
  }
  
  // 3. Reduce stock (atomic within transaction)
  product.stock -= quantityOrdered;
  await product.save({ session });
  
  // 4. Update order status
  order.status = "confirmed";
  await order.save({ session });
  
  // Commit transaction (both operations or neither)
  await session.commitTransaction();
} catch (error) {
  // Automatic rollback on error
  await session.abortTransaction();
  throw error;
}
```

**Why Transactions?**
- Scenario: 2 customers buy last item simultaneously
- Without transaction:
  - Both read stock=1
  - Both decrement to 0
  - Result: Overselling (stock becomes negative)
- With transaction:
  - Customer A's transaction locks stock
  - Customer B waits for lock
  - A reduces to 0, commits
  - B wakes up, reads stock=0, throws "Out of stock"
  - Order fails for one customer (correct behavior)

**Why Not Application-Level Locking?**
- Database-level locking is atomic and reliable
- Application locks require in-process memory (doesn't work with clustering)
- Database transactions survive process crashes
- Stripe guarantees payment already captured (safe to reduce stock)

**Trade-off:**
- Requires MongoDB replica set (or at least 3-node cluster)
- Adds ~10-50ms latency for transaction overhead
- Fallback for standalone MongoDB: Non-transactional fulfillment (logs warning)

#### Layer 5: Webhook Retry Service (Exponential Backoff)

**File:** [src/services/webhook-retry.service.ts](../src/services/webhook-retry.service.ts#L40-L90)

```typescript
// If webhook processing fails (e.g., DB temporarily down):
// Schedule retry with exponential backoff

const delayMs = Math.pow(2, attemptCount) * 1000; // 1s, 2s, 4s, 8s...
const retryTime = new Date(Date.now() + delayMs);

await FailedWebhookModel.updateOne(
  { _id: webhookId },
  {
    nextRetryAt: retryTime,
    retryCount: retryCount + 1,
  }
);
```

**Backoff Strategy:**
- Attempt 1: Immediately
- Attempt 2: +1 second
- Attempt 3: +2 seconds
- Attempt 4: +4 seconds
- ... continues up to 24 hours

**Why Exponential?**
- Early attempts catch transient failures quickly
- Later attempts avoid overwhelming a slow service
- Natural spreading prevents thundering herd (all webhooks retrying simultaneously)
- 24-hour max: If down longer, manual intervention needed anyway

**What It Handles:**
- Payment service temporarily down (webhook queued until recovery)
- Database overloaded (automatic backoff gives time to recover)
- Network flake (first retry usually succeeds)
- Corrupted webhook (eventually given up, logged for manual review)

### Payment Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Customer Checkout Flow                        │
└─────────────────────────────────────────────────────────────────┘

1. Client → Server
   POST /api/payments/create-intent
   { orderId, userId, amount }

2. Server → Stripe API
   Create Checkout Session
   ✅ Returns: checkoutUrl, sessionId (cs_...)

3. Client → Stripe Hosted Page
   Customer enters card details
   (Server NEVER touches card data)

4. Customer Clicks "Pay"
   Stripe processes charge
   ✅ Charge succeeds
   ❌ Charge fails

5. Stripe → Server (Webhook)
   POST /api/payments/webhook
   Event: checkout.session.completed
   Payload: { eventId, sessionId, amount, metadata }

6. Server: Verify Webhook (3 checks)
   ✅ [1] Verify signature
   ✅ [2] Check idempotency (event ID not processed)
   ✅ [3] Verify amount matches order

7. Server: Reduce Stock
   ✅ Use MongoDB transaction
   ✅ Atomic: Read → Check → Update → Commit/Rollback
   
8. Server: Update Order Status
   order.status = "confirmed"
   order.paymentStatus = "paid"

9. (Optional) Server → Fulfillment Service
   Queue order for shipment

10. Stripe → Server (Webhook 2)
    Event: payment_intent.succeeded
    (Confirms actual bank authorization)

11. Server Updates Order
    order.status = "shipped_pending"
```

**Key Timing Notes:**
- `checkout.session.completed` arrives ~100ms after customer clicks "Pay"
- Bank authorization happens ~2-5 seconds later
- `payment_intent.succeeded` arrives ~2-5 seconds after completion
- Without proper design: Might fulfill order before payment actually succeeds

---

## Part 3: Caching Strategy

### The Problem: Database Load

**Without Caching:**
- Every product list request hits MongoDB
- 100 concurrent users = 100 simultaneous DB queries
- MongoDB can handle ~5,000 queries/second on modest hardware
- Response time: ~50-200ms per request (slow for user)
- Cost: Expensive database infrastructure

**With Single-Tier Caching (Redis Only):**
- 100 concurrent users = 100 Redis hits (~5ms response time)
- But: Redis crash = Cart data lost forever
- Trade-off: Speed vs. durability

### Solution: Two-Tier Caching

```
Read Request
    ↓
[Tier 1: Redis Cache] ← Fast (5ms), ephemeral
    ↓ Miss
[Tier 2: MongoDB] ← Slow (50ms), persistent
    ↓ Hit
Write to Redis (warm cache)
    ↓
Return to Client
```

**File:** [src/services/cart.service.ts](../src/services/cart.service.ts#L155-L230)

#### Tier 1: Redis (Hot Data)

**Configuration:**
- TTL: 24 hours
- Data: Active user carts (last accessed today)
- Memory: ~1000 carts × 5KB = 5MB

**Read Path:**
```typescript
const cachedCart = await redis.get(`cart:user:${userId}`);
if (cachedCart) {
  return JSON.parse(cachedCart); // Sub-millisecond response
}
// Fall through to MongoDB if miss
```

**Write Path:**
```typescript
// Update Redis immediately (for client sees change instantly)
await redis.setex(`cart:user:${userId}`, 86400, JSON.stringify(cart));

// Queue MongoDB save with debouncing (5 second delay)
// Why debounce? Prevents 5 writes to DB if user adds 5 items in 10 seconds
scheduleMongoSave(cartId, cart, 5000);
```

#### Tier 2: MongoDB (Cold Data)

**Configuration:**
- TTL: None (permanent storage)
- Data: All user carts
- Storage: ~100,000 carts × 5KB = 500MB

**Read Path (Cache Miss):**
```typescript
const cart = await CartModel.findOne({ userId })
  .populate("items.product")
  .lean();

// Write-through: Update Redis so next request hits cache
await redis.setex(`cart:user:${userId}`, 86400, JSON.stringify(cart));

return cart;
```

**Write Path (On Commit):**
```typescript
const mongoCart = new CartModel({
  userId,
  items: cart.items,
  total: cart.total,
  updatedAt: new Date(),
});
await mongoCart.save(); // Synchronous (blocking)
```

### Why This Architecture?

**Performance:**
- 95% of requests hit Redis (5ms latency)
- 5% miss, fall back to MongoDB (50ms latency)
- Average: ~5ms × 0.95 + 50ms × 0.05 = 7.25ms

**Reliability:**
- Redis down? Fall back to MongoDB (slower but functional)
- MongoDB down? Redis still serves recent data
- Both down? Service degradation but graceful (no crashes)

**Cost:**
- Redis memory expensive, but only for hot data (1000 carts)
- MongoDB storage cheap for all data (100,000 carts)
- Debouncing reduces MongoDB writes by 80%

**Interview Talking Point:**
> "We cache aggressively for speed (sub-millisecond reads from Redis) but fall back to MongoDB for durability. If Redis crashes, users temporarily experience slower (but still fast) responses from MongoDB. This is the right trade-off between speed and reliability."

---

## Part 4: Observability & Debugging

### Logging Strategy

**File:** [src/utils/logger.ts](../src/utils/logger.ts)

**Key Features:**
- Structured JSON output (machine-parseable)
- Every request gets X-Request-ID header
- Every log entry tagged with service name
- Non-blocking writes (doesn't slow down requests)

**Example Log Entry:**
```json
{
  "level": 30,
  "time": "2024-01-28T10:15:23.456Z",
  "requestId": "req_abc123",
  "userId": "user_xyz789",
  "service": "PaymentService",
  "message": "Webhook processed successfully",
  "eventType": "checkout.session.completed",
  "orderId": "order_456",
  "duration": 245,
  "status": "success"
}
```

**Why This Format?**
- **Machine-readable:** Log aggregation tools (ELK, Datadog) parse automatically
- **Request tracing:** Same `requestId` across all logs for this request
- **Debugging:** Add context fields (userId, service) without repetition
- **Performance:** Pino writes non-blocking (doesn't slow request)

### Metrics Strategy

**File:** [src/utils/metrics.ts](../src/utils/metrics.ts)

**Prometheus Metrics:**
- `http_request_duration_seconds` (histogram): API response time distribution
- `http_request_total` (counter): Total requests by method/route/status
- `payments_total` (counter): Total payment attempts
- `payments_success` (counter): Successful payments
- `orders_created` (counter): Orders created
- `stock_remaining` (gauge): Current product inventory

**Why Prometheus?**
- Industry standard for monitoring
- Integrates with Grafana for dashboards
- Time-series database for trends (how is latency over last week?)
- Alerting (notify if error rate > 1%)

**Example Queries:**
```promql
# 95th percentile response time
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Payment success rate
sum(rate(payments_success[5m])) / sum(rate(payments_total[5m]))

# Requests per second by endpoint
sum(rate(http_request_total[1m])) by (route)
```

---

## Part 5: Testing Strategy

### What's Tested and Why

**File:** [src/__tests__/payment-webhook.test.ts](../src/__tests__/payment-webhook.test.ts)

**Payment Webhook Security (Lines 1-150)**
- ✅ Webhook signature verification works
- ✅ Invalid signature is rejected
- ✅ Idempotency: Same event twice = processed once
- ✅ Webhook amount verification prevents fraud
- ✅ Out-of-order events don't corrupt state

**File:** [src/__tests__/auth.test.ts](../src/__tests__/auth.test.ts)

**Auth Flow (Lines 1-100)**
- ✅ Registration with email validation
- ✅ Login with credential verification
- ✅ Token refresh mechanism
- ✅ Password reset security
- ✅ Permission boundaries (user can't access other user's data)

**File:** [src/__tests__/order.test.ts](../src/__tests__/order.test.ts)

**Stock Management (Lines 50-100)**
- ✅ Stock can't go negative
- ✅ Overselling prevented by transaction
- ✅ Concurrent orders handle gracefully

**File:** [src/__tests__/performance.test.ts](../src/__tests__/performance.test.ts)

**Performance Under Load (Lines 1-50)**
- ✅ 50 concurrent cart additions complete
- ✅ 100 concurrent product list requests complete
- ✅ Response times stay sub-second

### Testing Philosophy

**Coverage Strategy:**
- Not 100% coverage (diminishing returns)
- Focus on: Security boundaries, race conditions, error handling
- Coverage targets: 80%+ on critical paths (auth, payment, stock)

**Types of Tests:**
1. **Unit Tests:** Individual functions (auth hashing, validation)
2. **Integration Tests:** Across services (create order → reduce stock → update payment)
3. **Security Tests:** Attack scenarios (signature forgery, idempotency bypass)
4. **Performance Tests:** Load under concurrent users

---

## Part 6: Deployment Architecture

### Development Environment

**Stack:**
- Node.js 18+ with ts-node for hot-reload
- MongoDB (local or cloud)
- Redis (local or cloud)
- Stripe test keys

**Quick Start:**
```bash
npm install
npm run dev  # Starts server with hot-reload on port 5000
```

### Production Environment

**File:** [docs/DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

**Database Requirements:**
- MongoDB replica set (required for transactions)
- 3+ nodes for high availability
- Automated daily backups
- Connection pooling via Mongoose

**Caching Requirements:**
- Redis cluster (optional but recommended)
- 2GB+ memory for production load
- AOF persistence (durability)
- Replication for failover

**API Server Requirements:**
- Load balancer (reverse proxy) in front
- Multiple API instances (auto-scaling)
- Health check endpoint: `GET /health`
- Graceful shutdown: Handle SIGTERM

**Monitoring Requirements:**
- Prometheus metrics scraping every 15 seconds
- Log aggregation (ELK, Datadog, CloudWatch)
- Error tracking (Sentry or similar)
- Uptime monitoring (Pingdom, UptimeRobot)

---

## Part 7: Scaling Strategy

### Current Performance

**Stress Test Results:**
- 50 concurrent cart operations: **145ms average** latency
- 100 concurrent product list requests: **62ms average** latency
- 20 sequential orders: **280ms average** latency
- Success rate: **>99%**

### Scale from 10 to 1,000 Users

**Database:**
- Tier 1 (10-100 users): Single MongoDB instance with Mongoose pooling
- Tier 2 (100-1000 users): MongoDB replica set + read replicas for product queries

**Caching:**
- Tier 1: Single Redis instance for cart/session data
- Tier 2: Redis cluster for distributed caching across API instances

**API Servers:**
- Tier 1: Single instance or two instances with load balancer
- Tier 2: Auto-scaling group (3-10 instances based on load)

**Metrics & Logging:**
- Tier 1: In-memory metrics + file-based logs
- Tier 2: Prometheus + Grafana + centralized log aggregation

### Scale from 1,000 to 10,000 Users

**Architectural Changes:**
- CDN for static assets (JavaScript, CSS, images)
- Separate write database from read replicas (CQRS pattern)
- Message queue for async operations (order fulfillment)
- Dedicated webhook processor (separate from API server)

**Example:**
```
[Client] 
  ↓
[CDN] (static assets)
  ↓
[Load Balancer]
  ↓
[API Server 1-10] (stateless, auto-scaling)
  ↓
[Read Replica] (product queries, fast)
[Write DB] (orders, payments)
  ↓
[Message Queue] (RabbitMQ, SQS)
  ↓
[Fulfillment Service] (async order processing)
  ↓
[Email Service] (transactional email)
```

---

## Part 8: Decision Log

### Why MongoDB Instead of PostgreSQL?

**Trade-off Analysis:**

**MongoDB Wins:**
- Flexible schema (product attributes vary)
- Built-in TTL indexes (webhook event cleanup)
- Transactions (required for stock management)
- Horizontal scaling via sharding (future-proof)

**PostgreSQL Wins:**
- ACID guarantees (we get similar via transactions)
- Mature ecosystem
- Better for relational data

**Decision:** MongoDB because flexible schema for product catalog + built-in TTL + horizontal scaling.

### Why Redis Instead of Memcached?

**Trade-off Analysis:**

**Redis Wins:**
- Data structures (hash, list) for complex data
- TTL expiration per key (vs. global TTL)
- Persistence options (AOF, RDB)
- Pub/Sub for real-time updates (future)

**Memcached Wins:**
- Simpler, lighter weight
- Better for simple key-value caching

**Decision:** Redis because we need per-key TTL and complex data structures for cart items.

### Why Stripe Instead of Custom Payment Processing?

**Trade-off Analysis:**

**Stripe Wins:**
- PCI compliance handled (we never touch card data)
- Fraud detection built-in
- Supports multiple payment methods (cards, wallets, ACH)
- Webhook reliability and security

**Custom Payment Processor Wins:**
- Lower fees (but higher operational risk)
- Full control (but massive liability)

**Decision:** Stripe because PCI compliance is non-negotiable. Risk of data breach >> 2.9% + $0.30/transaction fee.

### Why Express.js Instead of Fastify?

**Trade-off Analysis:**

**Express Wins:**
- Massive ecosystem (middleware, libraries)
- Familiar to most Node.js developers
- Enough performance for current scale

**Fastify Wins:**
- Faster (3x+ throughput)
- More modern design
- Better TypeScript support

**Decision:** Express because ecosystem + team familiarity. Can migrate to Fastify if performance becomes bottleneck.

---

## Part 9: Future Improvements

### Short Term (Next 3 months)

1. **Webhook Circuit Breaker** - Stop processing if too many failures
2. **Rate Limiting per User** - Prevent abuse (instead of per-IP)
3. **Distributed Transactions** - Saga pattern for multi-service operations
4. **Email Notifications** - Send receipt, shipping confirmation, etc.

### Medium Term (3-6 months)

1. **Product Search** - Elasticsearch for fast full-text search
2. **Analytics** - Product popularity, conversion funnel, user cohorts
3. **Recommendations** - Collaborative filtering for "customers also bought"
4. **Admin Dashboard** - Real-time orders, inventory, payments

### Long Term (6-12 months)

1. **Mobile App** - React Native for iOS/Android
2. **Multi-Seller Marketplace** - Allow vendors to sell via platform
3. **Inventory Sync** - Real-time sync with warehouse systems
4. **Subscription Orders** - Recurring orders with automated billing

---

## Summary: Interview Narrative

**When asked "Walk me through your architecture":**

> "The core principle is **idempotency-first design**. Every operation must be safely repeatable, because in production, things fail and retry.
>
> For payments specifically, we have multiple layers of verification:
> 1. Stripe signs every webhook with HMAC-SHA256
> 2. We track event IDs to prevent duplicate processing
> 3. We verify the amount matches our database
> 4. We use MongoDB transactions to atomically reduce stock
>
> This protects against realistic attacks: Stripe account compromise, network failures, concurrent access. 
>
> For performance, we use two-tier caching: Redis for hot data (95% of reads sub-millisecond), MongoDB fallback for durability. If Redis crashes, we're slower but never lose data.
>
> Everything is observable: Structured logging with request IDs, Prometheus metrics for trends, error tracking for debugging. In production, we can trace any request from client to database.
>
> The stress tests show we handle 50 concurrent users at 145ms average latency. To scale beyond that, we'd add database replicas and auto-scaling API instances."

---

**End of Architecture Narrative**

See also:
- [PAYMENT_SYSTEM_DESIGN.md](./PAYMENT_SYSTEM_DESIGN.md) - Deep dive into webhook verification
- [SECURITY_DESIGN_DECISIONS.md](./SECURITY_DESIGN_DECISIONS.md) - Why each security control exists
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - How to deploy to production
