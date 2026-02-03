# Audit Logging Middleware & Helpers

## Overview
This document describes the architecture, usage, and design considerations for the audit logging middleware and helper utilities in the Simple Shop server.

---

## Middleware: `auditLoggingMiddleware`

### Purpose
- Inject IP address and user agent into request context
- Provide helper functions for handlers to log security events
- Standardize how security events are recorded

### Design
- Middleware extracts environment details (IP, user agent)
- Handlers call `logAuditEvent()` helper to record events
- Non-blocking: failures don't crash request

### Usage in Express App
```typescript
import { auditLoggingMiddleware } from './middlewares/audit-logging.middleware';

app.use(auditLoggingMiddleware);
// Now all routes can use logAuditEvent() helper
```

### Position in Middleware Stack
- Place AFTER `express.json()` but BEFORE auth middleware
- Early in stack so all handlers have access

### IP Address Extraction Logic
1. Try `x-forwarded-for` header (set by proxy/load balancer)
   - Format: "client_ip, proxy1_ip, proxy2_ip"
   - We take first IP (client's actual IP)
2. Fallback to `req.socket.remoteAddress` (direct connection)
3. Fallback to 'unknown' (should never happen in practice)

### Security Notes
- `x-forwarded-for` can be spoofed by attacker if not behind trusted proxy
- Only trust `x-forwarded-for` if reverse proxy is configured correctly
- For most applications: AWS/Nginx/HAProxy handle this correctly

---

## Helper: `logAuditEvent`

### Purpose
- Standardized way to record security events
- Ensures all audit logs have consistent structure
- Non-blocking (fire-and-forget logging)

### Usage in Route Handlers
```typescript
// In auth controller - successful login
router.post('/api/auth/login', async (req, res) => {
  try {
    const user = await UserModel.findOne({ email: req.body.email });
    // ... password verification ...

    // Log successful login
    await logAuditEvent(
      user._id.toString(),     // userId
      'LOGIN',                 // action
      'USER',                  // resourceType
      user._id.toString(),     // resourceId
      'success',               // status
      req,                     // request (for IP, user agent)
      { context: { email: user.email } }
    );

    return res.json({ token: '...' });
  } catch (error) {
    // Log failed login
    await logAuditEvent(
      null,
      'LOGIN_FAILED',
      'USER',
      req.body.email,
      'failure',
      req,
      { errorMessage: 'Invalid credentials' }
    );

    return res.status(401).json({ error: 'Invalid credentials' });
  }
});
```

### Example 2: Admin Role Grant
```typescript
router.post('/api/admin/users/:userId/make-admin', async (req, res) => {
  const user = await UserModel.findById(req.params.userId);
  const oldRole = user.role;

  user.role = 'admin';
  await user.save();

  // Log role change with before/after
  await logAuditEvent(
    req.user.id,           // Admin's ID
    'ROLE_GRANTED',        // Action
    'USER',                // Resource type
    req.params.userId,     // Which user got role
    'success',             // Status
    req,
    {
      adminId: req.user.id,
      reason: req.body.reason,
      changes: {
        before: { role: oldRole },
        after: { role: 'admin' },
        fields: ['role'],
      },
      context: { email: user.email },
    }
  );

  return res.json(user);
});
```

### Parameters
- userId: Who performed action (can be null for anonymous)
- action: Type of action (must match AuditLog enum)
- resourceType: Type of resource affected
- resourceId: ID of affected resource
- status: 'success' or 'failure'
- req: Express request (for IP, user agent)
- options: Additional context

### Performance
- Non-blocking (fire-and-forget)
- Returns immediately
- Actual write happens in background
- Even if audit log write fails, request continues

---

## Higher-order Middleware: `autoLogAction`

### Purpose
- Automatically log certain actions without explicit calls
- Reduces boilerplate in handlers
- Ensures consistent logging for sensitive operations

### Usage
```typescript
// Auto-log all admin endpoint actions
router.post(
  '/api/admin/users/:userId/role',
  authMiddleware,
  autoLogAction('ROLE_GRANTED', 'USER'),
  async (req, res) => {
    // Handler runs normally
    // Logging happens automatically before next()
  }
);
```

---

## Helper: `getFailedLoginsByIP`

### Usage: Rate Limiting
```typescript
const failedAttempts = await getFailedLoginsByIP(req.ipAddress, 1);
if (failedAttempts > 5) {
  // Block this IP from further login attempts
  return res.status(429).json({ error: 'Too many failed attempts' });
}
```

---

## Helper: `isBruteForceAttempt`

### Usage: Security Monitoring
```typescript
const isBruteForce = await isBruteForceAttempt(req.ipAddress);
if (isBruteForce) {
  await logAuditEvent(..., 'BRUTE_FORCE_ATTEMPT', ...);
}
```

---

## Helper: `getUserRecentActivity`

### Usage: Admin Dashboard
```typescript
const activity = await getUserRecentActivity(userId, 24); // Last 24h
```
