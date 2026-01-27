# Redis Fallback Verification

## Overview
All cart mutations now use safe Redis helpers (`safeCacheSet` / `safeCacheDel`) that **swallow Redis errors** and never interrupt the main flow. If Redis is unavailable:

1. **Read operations** (getCart): Fall back to MongoDB, skip cache write if Redis fails
2. **Write operations** (addToCart, removeFromCart, updateQuantity): Save to MongoDB, attempt cache write but don't fail if Redis is down
3. **Clear operations** (clearCart): Delete from MongoDB, attempt Redis clear but don't throw on failure

---

## Implementation Details

### Safe Helper Functions
Located in [server/src/services/cart.service.ts](server/src/services/cart.service.ts) lines 15-46:

```typescript
private static isRedisReady(): boolean {
  return redisClient.status === "ready";
}

private static async safeCacheSet(
  key: string,
  ttlSeconds: number,
  payload: any
): Promise<void> {
  if (!this.isRedisReady()) {
    logger.warn({ key }, "Redis not ready, skipping cache set");
    return;
  }

  try {
    await redisClient.setex(key, ttlSeconds, JSON.stringify(payload));
  } catch (error) {
    logger.warn({ error, key }, "Redis set failed (swallowed)");
  }
}

private static async safeCacheDel(key: string): Promise<void> {
  if (!this.isRedisReady()) {
    logger.warn({ key }, "Redis not ready, skipping cache delete");
    return;
  }

  try {
    await redisClient.del(key);
  } catch (error) {
    logger.warn({ error, key }, "Redis delete failed (swallowed)");
  }
}
```

### Protected Operations

#### 1. **getCart(userId)** - Line 75
- **Reads**: Attempts Redis read wrapped in try/catch
- **Fallback**: Fetches from MongoDB if Redis unavailable
- **Cache Update**: Uses `safeCacheSet` to avoid throwing on failure

#### 2. **addToCart(productId, quantity, userId)** - Line 250
- **MongoDB Update**: Always succeeds (product validation + stock check)
- **Redis Cache**: Uses `safeCacheSet` for both fallback and main paths
- **Result**: Cart saved to MongoDB regardless of Redis state

#### 3. **removeFromCart(productId, userId)** - Line 390
- **MongoDB Update**: Always succeeds (item removal)
- **Redis Cache**: Uses `safeCacheSet` in fallback and main paths
- **Result**: Item removal persists via MongoDB even if Redis fails

#### 4. **updateQuantity(productId, quantity, userId)** - Line 500
- **MongoDB Update**: Always succeeds (quantity validation + stock check)
- **Redis Cache**: Uses `safeCacheSet` in fallback and main paths
- **Result**: Quantity update persists via MongoDB even if Redis fails

#### 5. **clearCart(userId)** - Line 620
- **MongoDB Delete**: Executes asynchronously (non-blocking)
- **Redis Delete**: Uses `safeCacheDel` and never throws
- **Result**: Cart cleared from MongoDB even if Redis fails

---

## Testing the Behavior

### Scenario 1: Redis Down, Add Item to Cart
```bash
# 1. Stop Redis (or don't connect)
# 2. POST /api/cart/add
# {
#   "productId": "507f1f77bcf86cd799439011",
#   "quantity": 1
# }

# Expected Logs:
# WARN: Redis not ready, skipping cache set
# INFO: Cart updated in Redis with 1 items
# INFO: Cart loaded from MongoDB and cached

# Expected Result:
# ✅ 200 OK - Cart saved to MongoDB
# ✅ Item added successfully
# ⚠️  Redis cache write skipped (logged as warning)
```

### Scenario 2: Redis Crashes Mid-Operation
```bash
# 1. Redis connected, send add-to-cart request
# 2. While processing, Redis crashes
# 3. safeCacheSet catches the error

# Expected Logs:
# WARN: Redis set failed (swallowed)
# INFO: Cart updated in MongoDB

# Expected Result:
# ✅ 200 OK - Cart persisted to MongoDB
# ⚠️  Redis cache write failed but was swallowed
```

### Scenario 3: Health Check with Redis Down
```bash
# GET /api/health

# Expected Response:
# {
#   "success": true,
#   "data": {
#     "status": "degraded",
#     "warning": true,
#     "mongodb": "connected",
#     "redis": "disconnected",
#     "uptime": 1234.5
#   }
# }
```

---

## Console Output Example

When Redis is down and a cart operation occurs:

```
{"level":40,"msg":"Redis not ready, skipping cache set","key":"cart:user:123456"}
{"level":30,"msg":"✅ Cart updated in Redis with 1 items: user:123456"}
{"level":30,"msg":"✅ Item added successfully","product":"Nike Shoes","quantity":1}
{"level":30,"msg":"HTTP Request","path":"/api/cart/add","status":200,"durationMs":45}
```

Notice:
- ✅ Requests complete with **200 OK** even if Redis is unavailable
- ⚠️  Warning logs indicate cache was skipped
- 💾 Data persists in MongoDB despite Redis failure

---

## Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **Redis Down** | ❌ All cart ops fail with 500 | ✅ Works via MongoDB fallback |
| **Error Handling** | Throws exception, stops flow | Logs warning, continues safely |
| **Resilience** | Single point of failure | Graceful degradation |
| **User Experience** | App unavailable | Can still shop and checkout |
| **Recovery** | Manual restart needed | Auto-recovery when Redis restarts |

---

## Deployment Checklist

- [ ] Code deployed to production
- [ ] Logs monitored for "Redis not ready" or "Redis set failed" warnings
- [ ] Cart operations tested without Redis
- [ ] Health endpoint verified returning `"degraded"` status
- [ ] MongoDB connection confirmed stable
- [ ] Health checks configured to alert on `warning: true`

---

## Next Steps (Optional Improvements)

1. **Add Redis reconnect handler**: Auto-restart Redis connection attempts
2. **Circuit breaker pattern**: Skip Redis attempts if repeatedly failing
3. **Metrics**: Count cache hit/miss/failure rates per operation
4. **Alerts**: Trigger monitoring alert if Redis down for >5 minutes
