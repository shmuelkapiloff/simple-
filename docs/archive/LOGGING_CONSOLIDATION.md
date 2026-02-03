# Logging Consolidation Guide

**Date:** January 28, 2026  
**Version:** 1.0.0  
**Goal:** Standardize on Pino logger, remove duplicate logging utilities

---

## Summary

Consolidated logging from 3 different implementations down to 1:

### Before (3 Loggers):
1. **logger.ts** - Pino-based structured logger (KEEP)
2. **quickLog.ts** - Simple track/log helper (REMOVE)
3. **simpleLogger.ts** - Decorator-based logger (REMOVE)

### After (1 Logger):
- **logger.ts** - Single source of truth for all logging

---

## Changes Made

### 1. Removed Duplicate Logger Files

**Deleted:**
- `src/utils/quickLog.ts` - 48 lines
- `src/utils/simpleLogger.ts` - 289 lines

**Reason:** These created confusion and inconsistent log formats. The main `logger.ts` (Pino) is production-grade with structured logging.

---

### 2. Updated cart.service.ts

**Before:**
```typescript
import { track, log } from "../utils/quickLog";

static async getCart(userId: string): Promise<ICart | null> {
  const t = track("CartService", "getCart");
  try {
    // ...logic...
    t.success(cartObj);
  } catch (error) {
    t.error(error);
    throw error;
  }
}
```

**After:**
```typescript
import { logger } from "../utils/logger";

static async getCart(userId: string): Promise<ICart | null> {
  const startTime = Date.now();
  logger.info({ service: 'CartService', method: 'getCart' }, 'Getting cart');
  
  try {
    // ...logic...
    const duration = Date.now() - startTime;
    logger.info({ service: 'CartService', method: 'getCart', duration }, 'Cart retrieved');
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error({ service: 'CartService', method: 'getCart', duration, error }, 'Cart retrieval failed');
    throw error;
  }
}
```

**Benefits:**
- Structured logs with consistent format
- Request IDs automatically included (via middleware)
- JSON format for easy parsing by log aggregators
- Production-ready with log levels (info, warn, error, debug)

---

### 3. Updated auth.middleware.ts

**Before:**
```typescript
import { track, log } from "../utils/quickLog";

static async requireAuth(req: Request, res: Response, next: NextFunction) {
  const t = track("AuthMiddleware", "requireAuth");
  try {
    // ...logic...
    t.success();
  } catch (error) {
    t.error(error);
  }
}
```

**After:**
```typescript
import { logger } from "../utils/logger";

static async requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // ...logic...
    logger.info({ userId: req.userId }, 'User authenticated');
  } catch (error) {
    logger.error({ error }, 'Authentication failed');
  }
}
```

---

## logger.ts Features (Why It's the Standard)

### Structured Logging
```typescript
logger.info({ userId: '123', orderId: '456', amount: 99.99 }, 'Order created');
// Output: {"level":"info","time":1706428800,"userId":"123","orderId":"456","amount":99.99,"msg":"Order created"}
```

### Request ID Tracking
```typescript
// Automatically includes X-Request-ID from middleware
logger.info({ action: 'payment' }, 'Processing payment');
// Output includes: "requestId":"abc-123-def-456"
```

### Log Levels
```typescript
logger.debug('Detailed debug info'); // Only in development
logger.info('General information');
logger.warn('Warning condition');
logger.error({ error }, 'Error occurred');
```

### Pretty Printing (Development)
```bash
# In development (NODE_ENV=development):
[14:30:45] INFO: Order created
  userId: "123"
  orderId: "456"
  amount: 99.99

# In production (NODE_ENV=production):
{"level":"info","time":1706428800,"userId":"123","orderId":"456","amount":99.99,"msg":"Order created"}
```

---

## Migration Pattern

### For Services (with track)

**Old Pattern:**
```typescript
import { track } from "../utils/quickLog";

static async myMethod() {
  const t = track("ServiceName", "methodName");
  try {
    // logic
    t.success(result);
  } catch (error) {
    t.error(error);
    throw error;
  }
}
```

**New Pattern:**
```typescript
import { logger } from "../utils/logger";

static async myMethod() {
  const startTime = Date.now();
  logger.info({ service: 'ServiceName', method: 'methodName' }, 'Starting operation');
  
  try {
    // logic
    const duration = Date.now() - startTime;
    logger.info({ service: 'ServiceName', method: 'methodName', duration }, 'Operation completed');
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error({ service: 'ServiceName', method: 'methodName', duration, error }, 'Operation failed');
    throw error;
  }
}
```

### For Simple Logs

**Old Pattern:**
```typescript
log.debug("ServiceName", "Debug message", { data: "value" });
```

**New Pattern:**
```typescript
logger.debug({ service: 'ServiceName', data: 'value' }, 'Debug message');
```

---

## Benefits of Consolidation

### 1. **Consistency**
- All logs follow same JSON structure
- Easier to parse and analyze
- Predictable format for log aggregators (CloudWatch, Datadog, etc.)

### 2. **Production Ready**
- Pino is one of the fastest Node.js loggers
- Minimal performance overhead
- Built-in serializers for error objects
- Automatic log rotation support

### 3. **Debugging**
- Request IDs link related logs across services
- Structured data makes searching easier
- Pretty printing in development for readability

### 4. **Maintainability**
- Single logger to configure and update
- No confusion about which logger to use
- Reduced codebase size (-337 lines removed)

### 5. **Integration**
- Works seamlessly with log aggregation services
- Supports log streaming
- Compatible with ELK stack, Splunk, Datadog, etc.

---

## Configuration

### Environment Variables

```env
# .env
NODE_ENV=production           # Controls log format (json vs pretty)
LOG_LEVEL=info                # Minimum log level to output
```

### Log Levels (Ascending)

1. **debug** - Detailed debugging (development only)
2. **info** - General information (default)
3. **warn** - Warning conditions
4. **error** - Error conditions
5. **fatal** - Fatal errors (application crash)

---

## Interview Talking Points

1. **"How do you handle logging in your application?"**
   - Use Pino for structured JSON logging
   - Attach request IDs via middleware for tracing
   - Log levels configured by environment
   - Pretty printing in dev, JSON in production

2. **"How do you track requests across services?"**
   - X-Request-ID header generated by middleware
   - Automatically included in all logs
   - Can trace entire request lifecycle

3. **"How would you debug production issues?"**
   - Check logs filtered by request ID
   - Structured JSON makes querying easy
   - Include context (userId, orderId) in logs
   - Use log aggregation service (CloudWatch, Datadog)

4. **"What happens if logging fails?"**
   - Pino writes to stdout/stderr (non-blocking)
   - Process manager (PM2, systemd) handles log rotation
   - Failures don't crash the application

---

## Future Enhancements

### 1. Centralized Log Aggregation
```typescript
// Send logs to CloudWatch, Datadog, or Elasticsearch
import { createWriteStream } from 'pino-cloudwatch';

const pinoLogger = pino({
  stream: createWriteStream({
    logGroupName: 'simple-shop-api',
    logStreamName: process.env.INSTANCE_ID,
  }),
});
```

### 2. Alerting
```typescript
// Alert on error rate spike
logger.error({ alert: true, severity: 'high' }, 'Payment processing failed');
```

### 3. Log Sampling
```typescript
// Sample 10% of info logs in high-traffic production
const pinoLogger = pino({
  level: 'info',
  // Custom transport for sampling
});
```

---

## Conclusion

**Lines Removed:** 337 (quickLog.ts + simpleLogger.ts)  
**Logger Count:** 3 → 1  
**Interview Readiness:** Enhanced (demonstrates best practices)  
**Production Readiness:** Improved (consistent, performant, scalable)

Logging consolidation is complete. All future logging should use `logger.ts` exclusively.
