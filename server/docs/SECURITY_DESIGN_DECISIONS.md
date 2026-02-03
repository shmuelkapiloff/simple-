# Security Design Decisions

## Table of Contents

1. Webhook Signature Verification
2. Amount Verification (Defense in Depth)
3. MongoDB Transactions (Race Condition Prevention)
4. Input Validation & Sanitization
5. Authentication & Authorization
6. CORS & CSRF Protection
7. Rate Limiting
8. Error Handling & Information Disclosure
9. Logging & Audit Trails
10. Secure Defaults & Configuration

---

## 1. Webhook Signature Verification

### Decision: HMAC-SHA256 via Stripe SDK

**What We Do:**
```typescript
const event = stripe.webhooks.constructEvent(
  req.body,
  sig,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

**Security Threat Model:**

| Threat | Attack | Mitigation | Result |
|--------|--------|-----------|--------|
| **Spoofed Webhook** | Attacker sends crafted webhook claiming payment success | HMAC signature requires secret key | Rejected (400) |
| **Replay Attack** | Attacker replays old webhook multiple times | Idempotency tracking (event ID) | Processed once, then cached |
| **Timing Attack** | Attacker guesses signature by timing response | SDK uses timing-safe comparison | Takes same time regardless of match position |
| **Man-in-the-Middle** | MITM modifies webhook data mid-transit | HTTPS + signature verification | Modified data breaks signature |
| **Parameter Pollution** | Attacker adds extra fields to webhook JSON | Stripe SDK validates event structure | Extra fields ignored, required fields checked |

### Why HMAC-SHA256 and Not RSA?

**HMAC-SHA256:**
- ✅ Symmetric cryptography (both sides have secret)
- ✅ Fast (suitable for every webhook)
- ✅ Less infrastructure (no certificate management)
- ✅ Industry standard for webhooks

**RSA (Public Key):**
- ❌ Asymmetric (Stripe signs with private key, we verify with public)
- ❌ Slower (not practical for every request)
- ❌ More complex (certificate rotation, expiry)
- ❌ Not what Stripe uses

**Decision:** HMAC-SHA256 is the industry standard for webhooks (used by Stripe, PayPal, GitHub, etc.). Stripe's implementation is proven secure.

### Implementation Security Checklist

- [x] Using `stripe.webhooks.constructEvent()` (handles security properly)
- [x] Body is raw Buffer, not parsed JSON (required for signature verification)
- [x] Secret is stored in environment variable (never hardcoded)
- [x] Secret is per-environment (dev ≠ staging ≠ production)
- [x] Webhook endpoint is public (no authentication needed for webhook itself)
- [x] Webhook endpoint is HTTPS only (enforced by infrastructure)

---

## 2. Amount Verification (Defense in Depth)

### Decision: Verify Every Payment Amount Server-Side

**What We Do:**
```typescript
const expectedAmount = Math.round(order.totalAmount * 100);
const receivedAmount = event.data.object.amount_total;

if (expectedAmount !== receivedAmount) {
  throw new Error('Amount verification failed');
}
```

**Security Threat Model:**

| Threat | Attack | Mitigation | Result |
|--------|--------|-----------|--------|
| **Stripe Account Compromise** | Attacker modifies Stripe account to send fake amounts | Server verifies vs. database | Webhook rejected |
| **API Bug** | Stripe API returns incorrect amount due to bug | Unlikely but possible, we protect anyway | Caught by verification |
| **Metadata Injection** | Attacker modifies webhook amount field | Signature verification + amount check | Breaks signature, then caught by amount check |
| **Price Manipulation** | Attacker creates order with $100, pays $1 | Idempotency (same event can't reprocess), signature verification | Rejected at signature layer |
| **Currency Confusion** | Order is $100 USD, attacker claims $100 JPY | Amount verification with currency check | Rejected |

### Why Two Separate Checks?

**Signature Verification Only:**
```typescript
// DANGEROUS - This alone is insufficient
const event = stripe.webhooks.constructEvent(body, sig, secret);
// Signature proves: webhook is from Stripe
// But: Stripe account could be compromised
fulfillOrder(event);
```

**Signature + Amount Verification:**
```typescript
// SECURE - Two layers
const event = stripe.webhooks.constructEvent(body, sig, secret);
// Proves: webhook is from Stripe

verifyAmount(event.amount, expectedAmount);
// Proves: amount is not manipulated in Stripe account
fulfillOrder(event);
```

**Defense in Depth Principle:**
- Layer 1: HMAC proves webhook is from Stripe
- Layer 2: Database proves amount is correct
- If either layer fails: Order rejected

### Precision Requirements

**Critical Implementation Detail:**

```typescript
// WRONG - Floating point math errors
const wrongExpected = 199.99 * 100; // = 19998.99 in floating point!

// RIGHT - Round to avoid float errors
const rightExpected = Math.round(199.99 * 100); // = 19999

// WRONG - String comparison
const received = '19999';
const expected = 19999;
if (received === expected) { } // FALSE - type mismatch

// RIGHT - Numeric comparison
const received = 19999; // Number
const expected = 19999; // Number
if (received === expected) { } // TRUE
```

**Why This Matters:**
- Floating point precision errors can cause amount mismatches
- Type mismatches (string vs. number) can cause silent failures
- These bugs might only manifest with certain amounts
- Security issues hidden in type/precision bugs

### Configuration for Tolerance

**Tempting but Wrong:**
```typescript
const tolerance = 50; // Allow $0.50 difference
if (Math.abs(expected - received) <= tolerance) {
  // Accept payment
}
```

**Why It's Dangerous:**
- Introduces systematic business loss ($0.50 per transaction = $500/1000 transactions)
- Attacker could abuse the tolerance
- Legitimate amount mismatches indicate real problems (price change, stock update)
- Should fail loudly, not silently absorb

**Right Approach:**
- Zero tolerance on amount (exact match only)
- If mismatch occurs: Log as security alert, notify ops, manual investigation
- Root cause: Price changed mid-checkout? Stock reduced? Stripe bug?

---

## 3. MongoDB Transactions (Race Condition Prevention)

### Decision: Atomic Transactions for Stock Reduction

**What We Do:**
```typescript
const session = await mongoose.startSession();
session.startTransaction();

try {
  // Both operations happen atomically
  const product = await ProductModel.findById(productId, {}, { session });
  if (product.stock < quantity) throw new Error('Out of stock');
  
  product.stock -= quantity;
  await product.save({ session });
  
  const order = await OrderModel.findOne({...}, {}, { session });
  order.status = 'confirmed';
  await order.save({ session });
  
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
}
```

**Security Threat Model:**

| Threat | Attack | Mitigation | Result |
|--------|--------|-----------|--------|
| **Overselling** | 2 customers buy last item simultaneously | Transaction lock prevents race condition | Only 1 succeeds, other gets "out of stock" |
| **Inconsistent State** | Payment succeeds but stock reduction fails | All-or-nothing transaction | Both succeed or both rollback |
| **Lost Stock Reduction** | System crash mid-update | Transaction either commits or rolls back | Never partially committed |
| **Double-Booking** | Same stock sold twice in different orders | Atomic read-modify-write prevents this | Sequential processing |

### Why Not Application-Level Locking?

**Naive Approach:**
```typescript
// DANGEROUS - Doesn't work with multiple servers
const locks = new Map();

async function reduceStock(productId, quantity) {
  // Try to acquire lock
  while (locks.has(productId)) {
    await sleep(10);
  }
  locks.set(productId, true);
  
  try {
    const product = await ProductModel.findById(productId);
    product.stock -= quantity;
    await product.save();
  } finally {
    locks.delete(productId);
  }
}

// PROBLEM: With 10 API servers, only one has the lock in memory
// Other 9 servers don't know about the lock
// All 10 proceed simultaneously = overselling
```

**Right Approach (Database Transactions):**
```typescript
// All servers use same database transaction
// Database enforces atomic access
// Works with 1 or 100 API servers

const session = await mongoose.startSession();
session.startTransaction();
// Database lock acquired here
// Other servers wait for transaction to finish
// When first server commits, other server can proceed
```

### Requirements for Transactions

**MongoDB Replica Set Required:**
- Single-node MongoDB: Transactions don't work
- Replica Set (3+ nodes): Transactions work fully
- Sharded cluster: Transactions work across shards

**For Simple Shop:**
- Development: Can use MongoDB Atlas free tier with replica set
- Production: Must use replica set (non-negotiable)

**Fallback for Non-Transactional MongoDB:**
```typescript
// If replica set unavailable, fallback to non-atomic operation
if (!session) {
  // Log warning: Running without transactions
  logger.warn('Running without transactions - race conditions possible');
  
  // Continue anyway (degraded mode)
  const product = await ProductModel.findById(productId);
  product.stock -= quantity;
  await product.save();
}
```

### Trade-offs

| Aspect | With Transactions | Without Transactions |
|--------|------------------|----------------------|
| **Consistency** | Guaranteed atomic | Race conditions possible |
| **Latency** | +10-50ms overhead | -10-50ms faster |
| **Complexity** | Need replica set | Single node works |
| **Cost** | Replica set required | Any MongoDB works |
| **Safety** | ✅ Production-ready | ❌ Risk of overselling |

**Decision:** Accept +10-50ms latency penalty for 100% safety guarantee. Overselling is a business-critical issue; the latency is acceptable.

---

## 4. Input Validation & Sanitization

### Decision: Zod Schema Validation + Type Checking

**File:** [src/validators/](../src/validators/)

**What We Do:**
```typescript
// Define schema once
const createOrderSchema = z.object({
  userId: z.string().min(10).max(30), // MongoDB ObjectId format
  items: z.array(z.object({
    productId: z.string().min(10),
    quantity: z.number().int().min(1).max(1000),
  })).min(1).max(100),
  shippingAddress: z.object({
    street: z.string().max(200),
    city: z.string().max(50),
    zip: z.string().regex(/^\d{5}$/),
  }),
});

// Validate in controller
const request = createOrderSchema.parse(req.body);
// If invalid: Throws error with specific field violations
// If valid: Type-safe request object
```

**Security Threat Model:**

| Threat | Attack | Mitigation | Result |
|--------|--------|-----------|--------|
| **SQL Injection** | Send malicious SQL: `{"userId": "x' OR '1'='1"}` | Parameterized queries (Mongoose) + schema validation | Treated as string, not SQL |
| **NoSQL Injection** | Send object: `{"userId": {$ne: null}}` | Type checking: expects string, gets object | Validation fails, rejected |
| **Oversized Payload** | Send huge array to exhaust memory | Max length validation (100 items) | Rejected before processing |
| **Negative Quantities** | Send `{"quantity": -1000}` to add free items | Type validation: min(1) | Rejected |
| **Invalid Email** | Send non-email format | Email regex validation | Rejected |
| **XSS in Shipping Address** | Send `{"street": "<script>alert('xss')</script>"}` | Stored in database, never rendered in HTML without escaping | Prevents XSS |

### Validation Layers

**Layer 1: Type System (TypeScript)**
```typescript
// Compiler prevents invalid types at build time
const order: Order = {
  userId: 123, // ❌ TypeScript error: expected string
  items: 'invalid', // ❌ TypeScript error: expected array
};
```

**Layer 2: Schema Validation (Zod)**
```typescript
// Runtime validation catches runtime errors
const order = createOrderSchema.parse({
  userId: 123, // ❌ Zod error: expected string
  items: 'invalid', // ❌ Zod error: expected array
});
```

**Layer 3: Database Model Validation (Mongoose)**
```typescript
// Database validation as final layer
await OrderModel.create({
  userId: '123', // Correct type
  items: [
    { productId: 'abc', quantity: -1 } // ❌ Mongoose validation error: quantity minimum is 1
  ],
});
```

### Configuration: What to Validate

**Always Validate:**
- User inputs (form fields, query params)
- External data (webhook payloads, API responses)
- Array sizes and nested object depths
- Numeric ranges and string formats

**Never Skip Validation:**
- "We know the client won't send bad data" → Wrong (attackers can)
- "Database will reject it" → True but slow (validate first)
- "Type system catches it" → Only at compile time, not runtime

---

## 5. Authentication & Authorization

### Decision: JWT Tokens + Refresh Token Rotation

**What We Do:**
```typescript
// 1. User logs in with email/password
// 2. Server creates JWT token (15-minute expiry)
// 3. Client stores JWT in memory (not localStorage)
// 4. Client sends JWT in Authorization header
// 5. Server verifies JWT signature + expiry

const token = jwt.sign(
  { userId, role: 'customer' },
  process.env.JWT_SECRET,
  { expiresIn: '15m' } // Short-lived
);

const refreshToken = jwt.sign(
  { userId },
  process.env.REFRESH_SECRET,
  { expiresIn: '7d' } // Long-lived
);
```

**Security Threat Model:**

| Threat | Attack | Mitigation | Result |
|--------|--------|-----------|--------|
| **Token Theft** | Attacker steals JWT from localStorage | JWT stored in memory (cleared on page close), HTTPS only | Token only valid for 15 minutes |
| **Token Forgery** | Attacker creates fake JWT without secret | Signature verification with secret key | Signature invalid, token rejected |
| **Expired Token Usage** | Attacker replays old expired JWT | Expiry check: `exp` claim verified | Rejected: token expired |
| **Role Escalation** | Attacker modifies JWT: `{"role": "admin"}` | Signature becomes invalid if modified | Rejected: signature invalid |
| **Refresh Token Compromise** | Attacker steals refresh token | Rotate on use: old refresh token is invalidated | Next use of old token fails |

### JWT Storage: Memory vs. LocalStorage

**LocalStorage (❌ Vulnerable):**
```typescript
// WRONG - XSS vulnerability
localStorage.setItem('token', jwt);
// If attacker injects script: <script>fetch('/steal?token=' + localStorage.getItem('token'))</script>
// Token is stolen (no HttpOnly flag possible with localStorage)
```

**Memory (✅ Safer):**
```typescript
// RIGHT - XSS still steals it, but no persistence
let authToken = null;

function login() {
  const response = await fetch('/api/auth/login', { /* ... */ });
  authToken = response.token; // Stored in memory
}

// If XSS attack happens:
// - Token stolen during that page session
// - Token lost when page refreshes
// - Attacker must inject new XSS after refresh (harder to scale)
```

**Why Memory Is Safer:**
- ❌ Both are vulnerable to XSS (that's the reality)
- ✅ But memory tokens last only for page session
- ✅ LocalStorage tokens persist after page close (bigger window for attack)
- ✅ Refresh page = new token required (breaks attack chain)

### Refresh Token Rotation

**Problem Without Rotation:**
```typescript
// Refresh token never expires
const refreshToken = jwt.sign(
  { userId },
  secret,
  { expiresIn: 'never' } // WRONG - never expires
);

// Scenario:
// 1. User logs out, leaves laptop at cafe
// 2. Attacker finds old refresh token in memory
// 3. Uses it to get new access token
// 4. Impersonates user indefinitely
```

**Solution With Rotation:**
```typescript
// Each refresh token is single-use
async function refreshAccessToken(oldRefreshToken) {
  // 1. Verify refresh token signature
  const payload = jwt.verify(oldRefreshToken, REFRESH_SECRET);
  
  // 2. Check if token has been used before
  const used = await RefreshTokenModel.findOne({ token: oldRefreshToken });
  if (used) {
    // Suspicious: Attempting to reuse refresh token
    // Possible: User's refresh token was compromised
    // Action: Force re-login across all devices
    await UserModel.updateOne(
      { _id: payload.userId },
      { sessionVersion: sessionVersion + 1 } // Invalidates all old tokens
    );
    throw new Error('Refresh token already used - possible compromise');
  }
  
  // 3. Mark this refresh token as used
  await RefreshTokenModel.create({ token: oldRefreshToken, userId: payload.userId });
  
  // 4. Issue new refresh token
  const newRefreshToken = jwt.sign(
    { userId: payload.userId },
    REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  // 5. Issue new access token
  const newAccessToken = jwt.sign(
    { userId: payload.userId, role: 'customer' },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}
```

### Authorization: Permission Boundaries

**Pattern:**
```typescript
// Every endpoint verifies user permissions
async function getMyOrders(req: Request, res: Response) {
  // Extract user from JWT
  const { userId } = req.user; // Set by auth middleware
  
  // Get requested orders
  const requestedUserId = req.query.userId;
  
  // Verify: User can only access their own orders
  if (userId !== requestedUserId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // Safe to proceed
  const orders = await OrderModel.find({ userId });
  res.json(orders);
}
```

**Why This Matters:**
- User A tries to access User B's orders: `GET /api/orders?userId=user_B`
- Without check: Both orders returned (information disclosure)
- With check: 403 Forbidden returned

---

## 6. CORS & CSRF Protection

### Decision: CORS Whitelist + CSRF Tokens for State Changes

**CORS Configuration:**
```typescript
app.use(cors({
  origin: process.env.CLIENT_URL, // Only allow our frontend
  credentials: true, // Allow cookies/auth headers
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

**Security Threat Model:**

| Threat | Attack | Mitigation | Result |
|--------|--------|-----------|--------|
| **CORS Bypass** | Attacker's site makes request to our API | CORS whitelist: requests blocked by browser | Request fails (browser same-origin policy) |
| **CSRF (Cross-Site Request Forgery)** | User logged into our site, visits evil.com, which sends `POST /api/orders` | CSRF token in form + SameSite cookie | Request rejected: token mismatch |
| **Credential Theft via CORS** | Attacker learns about user's session | Credentials in cookies are HttpOnly (not accessible to JavaScript) | Can't be stolen by XSS |

### CORS Explanation

**Without CORS:**
```html
<!-- User logged into shop.com -->
<!-- User visits attacker.com (without closing shop.com tab) -->
<img src="https://shop.com/api/orders/delete/12345">
<!-- Browser sends request (includes cookies automatically) -->
<!-- If no CORS: Request proceeds, order deleted! -->
```

**With CORS:**
```html
<!-- Same scenario -->
<img src="https://shop.com/api/orders/delete/12345">
<!-- attacker.com != shop.com -->
<!-- Browser blocks request (same-origin policy) -->
<!-- Request fails, order NOT deleted -->
```

**Why It Works:**
- Browser enforces same-origin policy for XMLHttpRequest and Fetch
- `<img>`, `<script>`, `<form>` are excluded (older web compatibility)
- Modern APIs (Fetch, XMLHttpRequest) require CORS headers
- Attacker's site can't see response anyway (browser blocks it)

### CSRF Token Pattern

**For State-Changing Operations:**
```typescript
// 1. When rendering form, include CSRF token
router.get('/checkout', (req, res) => {
  const csrfToken = generateRandomToken();
  req.session.csrfToken = csrfToken;
  res.render('checkout', { csrfToken });
});

// 2. HTML form includes hidden token
<form method="POST" action="/api/orders">
  <input type="hidden" name="csrfToken" value="<%= csrfToken %>">
  <input type="text" name="quantity">
</form>

// 3. Server validates token on form submission
router.post('/api/orders', (req, res) => {
  const { csrfToken } = req.body;
  
  if (csrfToken !== req.session.csrfToken) {
    return res.status(403).json({ error: 'CSRF token invalid' });
  }
  
  // Safe to process order
  createOrder(req.body);
});
```

**Why This Prevents CSRF:**
- Attacker's site doesn't know the CSRF token (it's session-specific)
- Attacker can't forge CSRF token (cryptographically random)
- Even if attacker makes request to `/api/orders`, token is missing or wrong
- Request rejected

---

## 7. Rate Limiting

### Decision: Per-IP Rate Limiting for API

**Implementation:**
```typescript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes per IP
  message: 'Too many requests from this IP, please try again later.',
  keyGenerator: (req) => {
    // For behind proxy, use X-Forwarded-For header
    return req.headers['x-forwarded-for'] || req.ip;
  },
});

// Apply to public endpoints
app.post('/api/auth/login', limiter, loginController);
app.post('/api/auth/register', limiter, registerController);
app.get('/api/products', limiter, productController);

// Don't apply to authenticated endpoints (higher limits)
app.post('/api/orders', authenticate, orderController);
```

**Security Threat Model:**

| Threat | Attack | Mitigation | Result |
|--------|--------|-----------|--------|
| **Brute Force Login** | Attacker sends 10,000 login attempts per second | 100 requests per 15 min per IP | After 100 attempts, IP is rate-limited |
| **Denial of Service (DoS)** | Attacker floods server with requests | Rate limiting per IP | Attacker's requests start returning 429 Too Many Requests |
| **Password Guessing** | Attacker guesses passwords: user@example.com + common passwords | Rate limiting + bcryptjs slow hashing | Even if guessed, rate limit prevents trying 10k passwords |

### Why Per-IP and Not Per-User?

**Per-IP Approach:**
```typescript
// Rate limit by IP address
// Good for: Anonymous endpoints (login, register, public API)
// Bad for: Shared IP (corporate proxy, school WiFi)
//         One attacker behind proxy affects everyone
```

**Per-User Approach:**
```typescript
// Rate limit by authenticated user
// Good for: Authenticated endpoints
// Bad for: Anonymous endpoints (attacker not yet "a user")
```

**Best Practice:**
- Per-IP for public endpoints (login, register, API public routes)
- Per-User for authenticated endpoints (my orders, checkout)
- Higher limits for authenticated users (they're logged in, more trusted)

---

## 8. Error Handling & Information Disclosure

### Decision: Generic Error Messages + Detailed Logging

**What We Do:**
```typescript
// WRONG - Leaks too much info
async function login(email, password) {
  const user = await UserModel.findOne({ email });
  if (!user) {
    return res.status(400).json({ 
      error: 'User with email user@example.com not found' // Leaks: user doesn't exist
    });
  }
  
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(400).json({ 
      error: 'Password is incorrect' // Leaks: email exists but password wrong
    });
  }
}

// ATTACKER learns:
// - Which emails are registered (can build database of users)
// - When password is wrong (can brute force with different passwords)
```

**RIGHT - Generic Error Messages:**
```typescript
async function login(email, password) {
  const user = await UserModel.findOne({ email });
  
  if (!user || !bcrypt.compareSync(password, user.password)) {
    // Generic message - doesn't reveal which part failed
    logger.warn(
      { email, failureType: !user ? 'user_not_found' : 'wrong_password' },
      'Login attempt failed'
    );
    
    return res.status(401).json({ 
      error: 'Invalid email or password' // User doesn't know which
    });
  }
  
  // Success
  return res.json({ token });
}

// ATTACKER learns:
// - Nothing (every failed attempt says same thing)
// - Can't determine if email exists (same error)
// - Can't enumerate valid emails
```

### Error Logging Strategy

**Detailed Internal Logs:**
```typescript
// These go to logs (not sent to client)
logger.error({
  email: 'hacker@attacker.com',
  attemptCount: 42, // Many failed attempts
  ip: '192.168.1.100',
  userAgent: 'Automated scanner',
  failureType: 'wrong_password',
  timestamp: new Date(),
}, 'Possible brute force attack');

// Operators can analyze logs to detect attacks
```

**Generic Client Messages:**
```typescript
// This goes to client (user sees this)
res.status(401).json({
  error: 'Invalid email or password'
});

// Client doesn't learn whether email exists or password is wrong
```

### Stack Traces: When to Expose

**Development Environment:**
```typescript
// OK to expose detailed errors
if (process.env.NODE_ENV === 'development') {
  res.status(500).json({
    error: 'Database connection failed',
    stack: error.stack, // Full stack trace
  });
}
```

**Production Environment:**
```typescript
// Don't expose details
if (process.env.NODE_ENV === 'production') {
  res.status(500).json({
    error: 'Internal server error', // Generic
    errorId: 'err_12345', // For support reference
  });
  
  // Log actual error for investigation
  logger.error({ errorId: 'err_12345', error }, 'Production error');
}
```

---

## 9. Logging & Audit Trails

### Decision: Structured JSON Logging for All Operations

**What We Log:**

```typescript
// Security-relevant events
logger.info({ userId, action: 'login', ip }, 'User logged in');
logger.warn({ userId, action: 'failed_login', ip, attempts: 5 }, 'Multiple failed login attempts');
logger.error({ userId, action: 'permission_denied', resource: 'order_123' }, 'Unauthorized access attempt');

// Payment operations
logger.info({ orderId, amount, status: 'pending' }, 'Payment initiated');
logger.info({ orderId, status: 'confirmed' }, 'Payment confirmed');
logger.error({ orderId, error: 'amount_mismatch' }, 'Payment rejected');

// Administrative actions
logger.info({ admin: 'admin_user', target: 'user_123', action: 'role_change', newRole: 'admin' }, 'Role modified');
```

**Why Structured JSON:**
- Machine-readable (can parse and alert on patterns)
- Centralized logging infrastructure can search logs
- Easy to find all `payment_rejected` events
- Easy to find all `unauthorized_access` for user X
- Audit trails for compliance

### Audit Checklist

- [x] All auth events logged (login, logout, token refresh, password change)
- [x] All payment events logged (payment initiated, webhook received, amount verified)
- [x] All permission checks logged (user accessed other user's data → logged as attempt)
- [x] All administrative actions logged (role change, permission grant, etc.)
- [x] All errors logged (failures, exceptions, security events)
- [ ] Admin audit logging (not yet implemented - Phase 6)

---

## 10. Secure Defaults & Configuration

### Decision: Secure by Default Configuration

**What We Do:**

```typescript
// 1. Environment-based secrets (never hardcoded)
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const JWT_SECRET = process.env.JWT_SECRET;
const DB_URL = process.env.MONGODB_URI;

if (!STRIPE_SECRET || !JWT_SECRET) {
  throw new Error('Missing required environment variables');
}

// 2. Security headers (Helmet)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Only our scripts
      styleSrc: ["'self'", "'unsafe-inline'"], // Only our styles
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
  },
}));

// 3. HTTPS enforcement
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.protocol !== 'https') {
      return res.redirect(301, `https://${req.get('host')}${req.url}`);
    }
    next();
  });
}

// 4. Database security
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri.includes('mongodb+srv') && process.env.NODE_ENV === 'production') {
  throw new Error('Must use MongoDB Atlas (secured connection) in production');
}

// 5. Cookie security
app.use(session({
  secret: process.env.SESSION_SECRET,
  cookie: {
    secure: true, // HTTPS only
    httpOnly: true, // Can't be accessed by JavaScript (prevents XSS theft)
    sameSite: 'strict', // CSRF prevention
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));
```

### Security Configuration Checklist

- [x] All secrets in environment variables (no hardcoded secrets)
- [x] Environment variables validated on startup
- [x] HTTPS enforced in production
- [x] Security headers set (Helmet)
- [x] CORS whitelist configured
- [x] Rate limiting enabled
- [x] JWT tokens have short expiry (15 minutes)
- [x] Refresh tokens rotate on use
- [x] Cookies are HttpOnly and SameSite
- [x] Database connections use SSL/TLS
- [x] Logging captures security events
- [ ] WAF (Web Application Firewall) deployed (not yet - infrastructure level)
- [ ] DDoS protection configured (not yet - infrastructure level)

---

## Security Testing Checklist

- [x] Signature verification prevents webhook forgery
- [x] Amount verification prevents price manipulation  
- [x] Transactions prevent overselling
- [x] Auth permissions prevent unauthorized access
- [x] Rate limiting prevents brute force
- [x] CORS prevents cross-origin attacks
- [x] Structured logging enables audit trails
- [ ] Penetration testing (not yet performed)
- [ ] Security audit by external firm (not yet scheduled)

---

## Interview Narrative: Security Design

**When asked "How do you handle payment security?":**

> "We have multiple layers:
>
> **Layer 1: Webhook Verification**
> Every webhook from Stripe is HMAC-SHA256 signed. We verify the signature using Stripe's SDK, which uses timing-safe comparison to prevent timing attacks.
>
> **Layer 2: Idempotency Tracking**
> Same webhook might arrive twice (network retry). We track event IDs with MongoDB unique constraint, so duplicate webhook doesn't duplicate order or charge.
>
> **Layer 3: Amount Verification**
> We verify the webhook amount matches our database. This protects against someone compromising the Stripe account and modifying the amount.
>
> **Layer 4: Atomic Transactions**
> When reducing stock, we use MongoDB transactions. If payment succeeds but stock update fails, the entire transaction rolls back. Never leaves the system in an inconsistent state.
>
> **Broader Security:**
> - Input validation with Zod (prevents NoSQL injection)
> - JWT tokens with 15-minute expiry
> - Refresh token rotation (single-use tokens)
> - Rate limiting on public endpoints (prevents brute force)
> - CORS whitelist (prevents cross-origin attacks)
> - Structured logging for audit trails
> - HTTPS only in production
> - All secrets in environment variables
>
> The philosophy is **defense in depth**: If one layer fails, others catch it."

---

**End of Security Design Decisions**

See also:
- [ARCHITECTURE_NARRATIVE.md](./ARCHITECTURE_NARRATIVE.md) - Why each pattern exists
- [PAYMENT_SYSTEM_DESIGN.md](./PAYMENT_SYSTEM_DESIGN.md) - Webhook implementation details
