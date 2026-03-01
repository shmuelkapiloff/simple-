# Payment System Design: Deep Dive

## Table of Contents

1. Webhook Verification Mechanics
2. Idempotency Implementation
3. Amount Verification Security
4. Event Routing & Metadata
5. Retry Logic with Exponential Backoff
6. Testing the Payment Flow

---

## 1. Webhook Verification Mechanics

### The Stripe Webhook Security Model

Stripe sends webhooks to your server after events (payment succeeded, customer created, etc.). But how do you know the webhook is **actually from Stripe** and not an attacker?

**Answer: HMAC-SHA256 signatures**

### Signature Generation (Stripe Side)

```
1. Stripe has your webhook secret (e.g., whsec_abc123def456)
2. Stripe creates a signing string: "{timestamp}.{webhook_body}"
3. Stripe computes HMAC-SHA256 hash of signing string with secret
4. Stripe adds result to request header: Stripe-Signature: t=timestamp,v1=hash
5. Stripe sends webhook to your endpoint
```

**Example:**
```
Timestamp: 1234567890
Body: {"type":"checkout.session.completed","data":{...}}
SigningString: "1234567890.{"type":"checkout.session.completed","data":{...}}"
SecretKey: whsec_abc123def456

HMAC-SHA256(SigningString, SecretKey) 
= "5c7aa4f5f8e6b9c2d3a4f5e6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5"

Header: Stripe-Signature: t=1234567890,v1=5c7aa4f5f8e6b9c2d3a4f5e6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5
```

### Verification (Our Side)

**File:** [src/services/payments/stripe.provider.ts](../src/services/payments/stripe.provider.ts#L60-L85)

```typescript
async handleWebhook(req: Request): Promise<StatusResult> {
  const sig = req.headers['stripe-signature'];
  const body = req.body; // Must be raw Buffer, NOT parsed JSON

  try {
    // Stripe SDK handles:
    // 1. Extracts timestamp and hash from sig header
    // 2. Verifies timestamp is recent (not replay attack)
    // 3. Recomputes HMAC using our secret
    // 4. Timing-safe comparison with provided hash
    // 5. Throws if any check fails
    
    const event = this.stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // If we reach here, signature is verified
    // We can trust event.data and event.type
    
    return this.processEvent(event);
  } catch (err) {
    if (err.message.includes('No signatures found')) {
      // Missing signature header
      return { success: false, error: 'No Stripe signature' };
    }
    if (err.message.includes('Signature verification failed')) {
      // Attacker modified webhook
      return { success: false, error: 'Webhook signature invalid' };
    }
    // Other errors (timestamp too old, etc.)
    throw err;
  }
}
```

### Critical Implementation Detail: Raw Body

**Common Mistake:**
```typescript
// WRONG - This will fail signature verification!
app.use(express.json()); // Parses body to JSON object
app.post('/webhook', (req, res) => {
  // req.body is now { type: 'checkout.session.completed', ... }
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(
    req.body, // WRONG: This is JSON object, not raw string
    sig,
    secret
  );
});
```

**Why Wrong?**
- Stripe's signature is computed on the **exact raw bytes**
- If you parse to JSON and re-stringify, whitespace changes
- HMAC hash no longer matches

**Correct Implementation:**
```typescript
// Right - capture raw body before parsing
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }), // Get raw Buffer
  (req, res) => {
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(
      req.body, // Buffer with exact bytes Stripe signed
      sig,
      secret
    );
  }
);
```

### Timing Attack Prevention

**What's a Timing Attack?**

Attacker sends webhook with forged signature:
```typescript
// Naive comparison
if (computedHash === providedHash) {
  // Attacker watches response time
  // If hash starts with same character, response is ~1ns slower
  // By timing thousands of requests, attacker deduces correct hash
}
```

**Why Stripe SDK Is Better:**
```typescript
// Timing-safe comparison (what Stripe SDK uses)
function timingSafeEqual(a, b) {
  // Compares ALL bytes, even if first byte doesn't match
  // Always takes same time regardless of where mismatch is
  // Prevents timing attacks
}
```

**Implementation Note:**
- Always use Stripe SDK's `constructEvent()` (it handles timing-safe comparison)
- Never implement signature verification yourself
- Even seasoned cryptographers get this wrong

---

## 2. Idempotency Implementation

### The Duplicate Webhook Problem

**Scenario:**
```
Time 1: Stripe sends checkout.session.completed webhook
Time 2: Our server processes webhook, reduces stock, creates order
Time 3: Our server sends 200 OK response (webhook acknowledged)
Time 4: Network flake - response packet is lost
Time 5: Stripe times out (no 200 OK received)
Time 6: Stripe retries webhook (same event ID)
Time 7: Our server receives webhook again
Time 8: Without idempotency check, we'd process duplicate
```

**Result Without Idempotency:**
- Order created twice
- Stock reduced twice
- Customer charged twice
- Business loses money, customer loses trust

**Result With Idempotency:**
- Order created once
- Duplicate request silently succeeds (webhook acknowledged)
- Customer charged once

### Implementation: Event ID Tracking

**File:** [src/models/webhook-event.model.ts](../src/models/webhook-event.model.ts)

```typescript
import mongoose from 'mongoose';

const webhookEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true, // Critical: Prevents duplicates at DB level
      index: true,
    },
    provider: {
      type: String,
      enum: ['stripe', 'paypal', 'square'],
      required: true,
    },
    eventType: String,
    processedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // Auto-delete events after 30 days (they're just for dedup)
    expireAfterSeconds: 2592000,
  }
);

export const WebhookEventModel = mongoose.model('WebhookEvent', webhookEventSchema);
```

**Unique Constraint:**
- `unique: true` enforces MongoDB level uniqueness
- Prevents race condition: Two requests can't create duplicate eventId simultaneously
- Returns duplicate key error if attempted
- Reliable and atomic

**TTL Index:**
- After 30 days, old events are auto-deleted
- Balances: Keep events long enough to catch duplicates vs. storage cost
- Trade-off: 30 days is conservative (most duplicates arrive within seconds)

### Webhook Processing with Idempotency Check

**File:** [src/services/payment.service.ts](../src/services/payment.service.ts#L155-L210)

```typescript
async handleWebhook(provider: PaymentProvider, req: Request): Promise<StatusResult> {
  // 1. Verify signature (ensure authentic webhook)
  const result = await provider.handleWebhook(req);

  // 2. Extract event ID from webhook
  const eventId = result.providerPaymentId; // "evt_test_abc123" from Stripe
  
  // 3. Check if we've already processed this event
  const existingEvent = await WebhookEventModel.findOne({
    eventId,
    provider: provider.name,
  });

  if (existingEvent) {
    // Already processed - webhook arrived twice
    logger.info(
      { eventId, provider: provider.name },
      'Webhook received again (idempotency: returning cached result)'
    );
    
    // Return success (webhook acknowledged, don't reprocess)
    return {
      success: true,
      processed: false, // Flag: Not newly processed, was duplicate
      message: 'Webhook already processed',
    };
  }

  // 4. Process webhook for first time
  logger.info({ eventId }, 'Processing webhook');

  try {
    // Fulfill order, reduce stock, etc.
    await this.fulfillOrder(result);

    // 5. Record that we processed this event ID
    await WebhookEventModel.create({
      eventId,
      provider: provider.name,
      eventType: result.type,
      processedAt: new Date(),
    });

    logger.info({ eventId }, 'Webhook processed successfully');

    return {
      success: true,
      processed: true, // Flag: Newly processed
      message: 'Order fulfilled',
    };
  } catch (error) {
    // Processing failed - don't mark as processed
    // Webhook will retry, next attempt might succeed
    logger.error({ eventId, error }, 'Webhook processing failed');
    
    return {
      success: false,
      error: error.message,
    };
  }
}
```

### Why Not Redis for Idempotency?

**Tempting but Wrong:**
```typescript
// Dangerous - if Redis crashes, duplicate processing resumes
const processed = await redis.get(`webhook:${eventId}`);
if (processed) return; // Already processed

// Process webhook...

await redis.set(`webhook:${eventId}`, '1', 'EX', 86400);
```

**Problems:**
- Redis crash → Data loss → Duplicate processing on restart
- Stripe retries → Hits duplicate again → Payment charged twice
- Business risk > complexity of correct implementation

**MongoDB Is Right:**
- Persistent storage (survives crashes)
- Unique constraint is atomic (no race conditions)
- TTL indexes auto-cleanup (no manual maintenance)
- Proven pattern for payment processing

---

## 3. Amount Verification Security

### The Compromise Scenario

**Realistic Attack:**
1. Attacker compromises Stripe account (sophisticated attack)
2. Attacker creates malicious webhook sending custom amount
3. Customer placed order for $100
4. Attacker's webhook claims $1 payment
5. Without verification: Order fulfilled, business loses $99

**Defense: Amount Verification**

**File:** [src/services/payment.service.ts](../src/services/payment.service.ts#L301-L320)

```typescript
async fulfillOrder(result: PaymentResult) {
  // result contains: orderId, amount (from webhook)
  
  // 1. Fetch order from database
  const order = await OrderModel.findById(result.orderId);
  if (!order) {
    throw new Error('Order not found');
  }

  // 2. Verify amount matches
  // CRITICAL: Database must be the source of truth for expected amount
  const expectedAmountInCents = Math.round(order.totalAmount * 100);
  const receivedAmountInCents = result.amount || 0;

  if (receivedAmountInCents !== expectedAmountInCents) {
    // SECURITY INCIDENT - Log and investigate
    logger.error(
      {
        orderId: result.orderId,
        expected: expectedAmountInCents,
        received: receivedAmountInCents,
        difference: Math.abs(expectedAmountInCents - receivedAmountInCents),
      },
      'SECURITY ALERT: Payment amount mismatch'
    );

    // Throw error - don't fulfill order
    throw new Error(
      `Amount verification failed: expected $${order.totalAmount}, received $${result.amount / 100}`
    );
  }

  // 3. Amount verified - safe to proceed
  logger.info(
    { orderId: result.orderId, amount: expectedAmountInCents },
    'Amount verified'
  );

  // Proceed with order fulfillment...
}
```

### Precision: Cents vs. Dollars

**Critical Implementation Detail:**

```typescript
// Order stored in dollars (user-friendly)
order.totalAmount = 199.99; // $199.99

// Stripe returns cents (no floating point errors)
webhookAmount = 19999; // Cents

// Conversion for comparison
expectedCents = Math.round(199.99 * 100); // = 19999

// Exact comparison (not approximate)
if (19999 === 19999) {
  // Matches!
}

// ERROR: Floating point comparison
const wrongExpected = 199.99 * 100; // = 19998.99 (due to float precision)
if (19999 === wrongExpected) {
  // FALSE! Order rejected
}

// RIGHT: Use Math.round to avoid float issues
const rightExpected = Math.round(199.99 * 100); // = 19999
if (19999 === rightExpected) {
  // TRUE! Order accepted
}
```

### Why Not Tolerance?

**Tempting but Wrong:**
```typescript
// DANGEROUS - Don't do this!
const allowedDifference = 50; // Allow $0.50 difference
if (Math.abs(expected - received) <= allowedDifference) {
  // Accept payment
}
```

**Why It's Dangerous:**
- Attacker sends $1 less (50 cents difference is within tolerance)
- Business loses $0.50 per transaction
- Over 1000 transactions: $500 lost
- And it's intentional (attacker modified webhook)

**Right Approach:**
- Exact match only (0 tolerance)
- If mismatch, flag as security incident
- Manual investigation by ops team
- Log and alert

---

## 4. Event Routing & Metadata

### Stripe Event Types

Stripe sends multiple events for a single payment:

```
Customer Action: Clicks "Pay" on checkout page

↓ Webhook 1: checkout.session.completed
  - Sent: ~100ms after click
  - Contains: sessionId, amount, customer info
  - Timing: Before bank authorization
  - Use: Validate payment amount, check idempotency

↓ Webhook 2: charge.succeeded
  - Sent: ~2 seconds after webhook 1
  - Contains: chargeId, amount, card info
  - Timing: After bank authorization confirmed
  - Use: Mark order as confirmed, send confirmation email

↓ Webhook 3: payment_intent.succeeded
  - Sent: ~2 seconds after webhook 2
  - Contains: paymentIntentId, charges
  - Timing: After all processing complete
  - Use: Archive payment record
```

### Why Multiple Events?

**Stripe's Design Philosophy:**
- Each webhook = Atomic fact about payment
- `checkout.session.completed`: Customer completed checkout flow
- `payment_intent.succeeded`: Bank confirmed payment
- `charge.succeeded`: Charge recorded in Stripe system

**Our Responsibility:**
- Handle events arriving **out of order**
- Handle events arriving **multiple times**
- Handle some events arriving (others lost due to network)

### Metadata Extraction

**File:** [src/services/payments/stripe.provider.ts](../src/services/payments/stripe.provider.ts#L195-L250)

```typescript
async processEvent(event: Stripe.Event): Promise<PaymentResult> {
  const eventType = event.type;
  const eventId = event.id; // "evt_test_abc123"

  switch (eventType) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Extract metadata stored when creating checkout session
      // Metadata = Bridge between Stripe and our database
      const metadata = session.metadata || {};
      const orderId = metadata.orderId; // Our order ID
      const userId = metadata.userId; // Our user ID
      const source = metadata.source; // "simple-shop" for validation

      return {
        type: 'payment_completed',
        success: true,
        orderId,
        userId,
        source,
        amount: session.amount_total, // In cents
        currency: session.currency,
        providerPaymentId: session.id,
        // Additional details
        customerEmail: session.customer_email,
        paymentStatus: session.payment_status, // 'paid' or 'unpaid'
      };
    }

    case 'charge.succeeded': {
      const charge = event.data.object as Stripe.Charge;
      
      return {
        type: 'charge_confirmed',
        success: true,
        chargeId: charge.id,
        providerPaymentId: event.id,
        amount: charge.amount,
        metadata: charge.metadata || {},
      };
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      
      return {
        type: 'refund_processed',
        success: false,
        chargeId: charge.id,
        refunded: true,
        refundedAmount: charge.refunded,
        reason: charge.refund_reason,
      };
    }

    case 'payment_intent.payment_failed': {
      const intent = event.data.object as Stripe.PaymentIntent;
      
      return {
        type: 'payment_failed',
        success: false,
        paymentIntentId: intent.id,
        failureCode: intent.last_payment_error?.code,
        failureMessage: intent.last_payment_error?.message,
      };
    }

    default:
      // Ignore event types we don't handle yet
      logger.debug({ eventType }, 'Ignoring unhandled event type');
      return {
        type: 'ignored',
        success: true,
      };
  }
}
```

### Metadata Storage During Checkout Creation

**File:** [src/services/payment.service.ts](../src/services/payment.service.ts#L50-L100)

```typescript
async createPaymentIntent(
  orderId: string,
  userId: string,
  totalAmount: number
): Promise<CheckoutLink> {
  // 1. Create order in database
  const order = await OrderModel.create({
    userId,
    total: totalAmount,
    status: 'pending',
    items: [], // populated separately
  });

  // 2. Create Stripe Checkout Session with metadata
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Order items',
          },
          unit_amount: Math.round(totalAmount * 100),
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/cancel`,
    
    // Metadata: Embedded in webhook when customer completes payment
    metadata: {
      orderId: order._id.toString(),
      userId: userId,
      source: 'simple-shop', // Validate webhook came from our app
    },
  });

  return {
    checkoutUrl: session.url,
    sessionId: session.id,
  };
}
```

### Why Metadata Instead of Database Lookup?

**Alternative (Database Lookup):**
```typescript
// When webhook arrives with chargeId
const charge = await stripe.charges.retrieve(chargeId);
// charge.metadata is empty (we didn't set it)
// Need to search database: "What order has this chargeId?"
// Fragile: Stripe IDs might collide, search is slow
```

**Right Approach (Metadata):**
```typescript
// When webhook arrives
const orderId = event.data.object.metadata.orderId;
// Direct lookup: OrderModel.findById(orderId)
// Fast, reliable, no ambiguity
```

**Trade-off:**
- Metadata adds ~100 bytes per webhook
- Eliminated database lookup for every webhook
- Faster processing (direct ID instead of searching)
- More reliable (no search ambiguity)

---

## 5. Retry Logic with Exponential Backoff

### The Partial Failure Scenario

**Realistic Situation:**
```
Time 1: Webhook received
Time 2: Signature verification ✅ passes
Time 3: Idempotency check ✅ passes  
Time 4: Amount verification ✅ passes
Time 5: Stock reduction ✅ passes
Time 6: Update order status ❌ Database timeout
Time 7: Exception thrown
Time 8: HTTP 500 response to Stripe
Time 9: Stripe considers webhook delivery failed
Time 10: Stripe schedules retry
```

**Result:**
- Order stock reduced ✅
- But order status still "pending" (should be "confirmed")
- User can't see order in "My Orders"
- If webhook never retries: Order lost forever

### Exponential Backoff Strategy

**File:** [src/services/webhook-retry.service.ts](../src/services/webhook-retry.service.ts#L40-L90)

```typescript
class WebhookRetryService {
  // Runs every 60 seconds to process failed webhooks
  private start() {
    this.retryInterval = setInterval(() => {
      this.processRetries();
    }, 60000); // Every 60 seconds
  }

  async processRetries() {
    // Find webhooks ready to retry
    const failedWebhooks = await FailedWebhookModel.find({
      nextRetryAt: { $lte: new Date() },
      retryCount: { $lt: 5 }, // Max 5 attempts
      status: 'failed',
    }).limit(10); // Process max 10 at a time

    for (const webhook of failedWebhooks) {
      try {
        // Attempt to process webhook again
        await this.retryWebhook(webhook);
        
        // Success - mark as processed
        webhook.status = 'processed';
        await webhook.save();
      } catch (error) {
        // Still failing - schedule next retry
        await this.scheduleRetry(webhook);
      }
    }
  }

  private scheduleRetry(webhook: any) {
    const retryCount = webhook.retryCount || 0;

    // Exponential backoff: 2^retryCount seconds
    // Attempt 1: 2^0 = 1 second
    // Attempt 2: 2^1 = 2 seconds
    // Attempt 3: 2^2 = 4 seconds
    // Attempt 4: 2^3 = 8 seconds
    // Attempt 5: 2^4 = 16 seconds
    
    const backoffSeconds = Math.pow(2, retryCount);
    const nextRetryAt = new Date(Date.now() + backoffSeconds * 1000);

    webhook.retryCount = retryCount + 1;
    webhook.nextRetryAt = nextRetryAt;
    webhook.lastError = error.message;
    
    return webhook.save();
  }
}
```

### Total Retry Timeline

```
Attempt 1: Immediately (webhook arrives)
   Result: Database timeout
   Reason: Server overloaded

Attempt 2: +1 second (automatic retry)
   Result: Database timeout
   Reason: Server still recovering

Attempt 3: +3 seconds (2 seconds after attempt 2)
   Result: Success ✅
   Reason: Database recovered

Total time: 3 seconds from webhook to success
```

### Why Not Immediate Retry?

**Naive Approach:**
```typescript
// WRONG - Thundering herd
async function retryOnFailure(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === maxRetries - 1) throw e;
      // Retry immediately (no delay)
    }
  }
}

// What happens:
// Webhook fails (e.g., database connection pool exhausted)
// Retry immediately (more connections added to exhausted pool)
// Retry again immediately (pool still exhausted)
// System gets worse, not better
```

**Right Approach (Exponential Backoff):**
```typescript
// Each retry waits longer than the previous
// Gives system time to recover before next attempt
// First retry at 1 second (quick, for transient errors)
// Later retries at 16+ seconds (give system room to breathe)
```

### Configuration: Finding the Right Balance

```typescript
// Current settings (tuned for simple-shop):
// - Retry interval check: Every 60 seconds
// - Max retry attempts: 5
// - Backoff formula: 2^attemptNumber seconds
// - Max backoff: 2^4 = 16 seconds (before attempt 5)

// Why these values?
// - 60 second interval: Balances responsiveness vs. CPU usage
// - 5 attempts: ~32 seconds total (reasonable for webhooks)
// - 2^n formula: Proven pattern, well-understood

// For different scenarios:
// High-frequency, low-latency: 2^n starting at 0.5s
// Batch processing: 2^n starting at 5 seconds
// Critical financial: 2^n starting at 1 second with human alert
```

---

## 6. Testing the Payment Flow

### Test Structure

**File:** [src/__tests__/payment-webhook.test.ts](../src/__tests__/payment-webhook.test.ts)

### Test 1: Webhook Signature Verification

```typescript
describe('Webhook Security', () => {
  test('should reject webhook with invalid signature', async () => {
    // Arrange
    const webhookBody = { type: 'checkout.session.completed' };
    const invalidSignature = 'invalid_sig_123';

    // Act & Assert
    const response = await sendWebhook(webhookBody, invalidSignature);
    expect(response.status).toBe(401);
    expect(response.body.error).toContain('signature');
  });

  test('should accept webhook with valid signature', async () => {
    // Arrange
    const webhookBody = { type: 'checkout.session.completed' };
    const validSignature = generateValidSignature(webhookBody);

    // Act
    const response = await sendWebhook(webhookBody, validSignature);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

### Test 2: Idempotency Check

```typescript
test('should process webhook once, then return cached result on retry', async () => {
  // Arrange
  const webhookBody = {
    type: 'checkout.session.completed',
    id: 'evt_test_abc123', // Event ID
    data: { object: { metadata: { orderId: 'order_123' } } },
  };
  const sig = generateValidSignature(webhookBody);

  // Act - First webhook
  const response1 = await sendWebhook(webhookBody, sig);
  expect(response1.status).toBe(200);
  expect(response1.body.processed).toBe(true);

  // Assert - Order should be in database
  let order = await OrderModel.findById('order_123');
  expect(order.status).toBe('confirmed');

  // Act - Same webhook arrives again (retry)
  const response2 = await sendWebhook(webhookBody, sig);
  expect(response2.status).toBe(200);
  expect(response2.body.processed).toBe(false); // Not newly processed

  // Assert - Order should NOT be duplicated
  order = await OrderModel.findById('order_123');
  expect(order.status).toBe('confirmed'); // Same as before
});
```

### Test 3: Amount Verification

```typescript
test('should reject webhook with mismatched amount', async () => {
  // Arrange
  const order = await OrderModel.create({
    totalAmount: 99.99, // $99.99
    status: 'pending',
  });

  const webhookBody = {
    type: 'checkout.session.completed',
    data: {
      object: {
        amount_total: 1, // $0.01 (attacker's fake amount)
        metadata: { orderId: order._id.toString() },
      },
    },
  };
  const sig = generateValidSignature(webhookBody);

  // Act
  const response = await sendWebhook(webhookBody, sig);

  // Assert
  expect(response.status).toBe(400);
  expect(response.body.error).toContain('amount verification');
  
  // Order should NOT be confirmed
  const updated = await OrderModel.findById(order._id);
  expect(updated.status).toBe('pending');
});
```

### Test 4: Race Condition (Concurrent Webhooks)

```typescript
test('should handle concurrent webhooks for same order safely', async () => {
  // Arrange
  const order = await OrderModel.create({
    totalAmount: 100.00,
    status: 'pending',
  });

  const webhookBody = {
    type: 'checkout.session.completed',
    id: 'evt_test_xyz789',
    data: { object: { amount_total: 10000, metadata: { orderId: order._id.toString() } } },
  };
  const sig = generateValidSignature(webhookBody);

  // Act - Send webhook twice simultaneously
  const [response1, response2] = await Promise.all([
    sendWebhook(webhookBody, sig),
    sendWebhook(webhookBody, sig),
  ]);

  // Assert - Both return success (idempotency)
  expect(response1.status).toBe(200);
  expect(response2.status).toBe(200);

  // But order should only be processed once
  const processed = await WebhookEventModel.find({
    eventId: 'evt_test_xyz789',
  });
  expect(processed.length).toBe(1); // Only one record, despite two concurrent requests
});
```

### Test 5: Out-of-Order Events

```typescript
test('should handle events arriving out of order', async () => {
  // Arrange
  const order = await OrderModel.create({
    totalAmount: 50.00,
    status: 'pending',
  });

  // Event 2 arrives first (usually arrives after Event 1)
  const event2 = {
    type: 'charge.succeeded', // Normally comes after checkout.session.completed
    id: 'evt_charge_001',
    data: { object: { metadata: { orderId: order._id.toString() } } },
  };

  // Event 1 arrives second (normally arrives first)
  const event1 = {
    type: 'checkout.session.completed',
    id: 'evt_checkout_001',
    data: { object: { amount_total: 5000, metadata: { orderId: order._id.toString() } } },
  };

  // Act - Send event 2 first
  const response2 = await sendWebhook(event2, generateValidSignature(event2));
  expect(response2.status).toBe(200);

  // Then send event 1
  const response1 = await sendWebhook(event1, generateValidSignature(event1));
  expect(response1.status).toBe(200);

  // Assert - Order should be confirmed despite out-of-order arrival
  const updated = await OrderModel.findById(order._id);
  expect(updated.status).toBe('confirmed');
});
```

---

## Summary: Payment System Design Principles

1. **Verify Everything** - Signature, amount, idempotency
2. **Be Idempotent** - Same webhook twice should be safe
3. **Trust Database, Not External** - Amount in database > amount in webhook
4. **Retry Smartly** - Exponential backoff, not immediate retry
5. **Log Everything** - Every webhook, verification step, error
6. **Test Thoroughly** - Signature, idempotency, race conditions, out-of-order

---

**End of Payment System Design**

See also:
- [ARCHITECTURE_NARRATIVE.md](./ARCHITECTURE_NARRATIVE.md) - Higher-level design
- [SECURITY_DESIGN_DECISIONS.md](./SECURITY_DESIGN_DECISIONS.md) - Security controls
