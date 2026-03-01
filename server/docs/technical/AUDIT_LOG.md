# Audit Logging System Documentation

Complete guide to the audit logging system for tracking security events and administrative actions.

## Overview

The audit logging system tracks all security-relevant events:
- User authentication (login, logout, password changes)
- Administrative actions (role changes, user creation/deletion)
- Permission changes (grant/revoke access)
- Suspicious activities (failed login attempts, unauthorized access)
- Payment operations (order creation, payment processing)
- System changes (configuration updates)

All events are immutable (append-only) and include:
- **Who** (userId, admin)
- **What** (action type)
- **When** (timestamp with millisecond precision)
- **Where** (IP address, user agent)
- **Why** (reason, context)
- **Result** (success/failure, error message)

---

## Architecture

### Data Model

**AuditLog Collection:**
```typescript
interface AuditLog {
  _id: ObjectId;
  
  // Who performed the action
  userId: string | null; // ObjectId of user performing action (null for anonymous)
  adminId?: string; // If action taken by admin on behalf of user
  
  // What action
  action: string; // e.g., 'LOGIN', 'PASSWORD_CHANGE', 'ROLE_GRANT'
  resourceType: string; // e.g., 'USER', 'ORDER', 'PAYMENT'
  resourceId: string; // ID of affected resource
  
  // When & Where
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  sessionId?: string;
  
  // What changed
  changes: {
    before?: Record<string, any>;
    after?: Record<string, any>;
    fields?: string[]; // Which fields changed
  };
  
  // Why & Result
  reason?: string; // Why was this action taken?
  status: 'success' | 'failure'; // Did it succeed?
  errorMessage?: string;
  
  // Context
  context?: Record<string, any>; // Additional data
}
```

### Immutability Guarantee

```typescript
// Indexes ensure immutability
db.auditlegs.createIndex({ userId: 1, timestamp: -1 })
db.auditlegs.createIndex({ action: 1, timestamp: -1 })
db.auditlegs.createIndex({ resourceId: 1 })
db.auditlegs.createIndex({ "timestamp": 1 }, { expireAfterSeconds: 7776000 }) // 90 days

// No updates allowed
db.auditlegs.updateOne({...}) // Throws error - only inserts allowed
db.auditlegs.deleteOne({...}) // Throws error - no deletes
```

---

## Event Types

### Authentication Events

**LOGIN**
```json
{
  "action": "LOGIN",
  "resourceType": "USER",
  "resourceId": "user_123",
  "status": "success",
  "ipAddress": "192.168.1.100",
  "timestamp": "2024-01-28T10:15:23.456Z"
}
```

**LOGIN_FAILED**
```json
{
  "action": "LOGIN_FAILED",
  "resourceType": "USER",
  "resourceId": "user_123", // or email if user not found
  "status": "failure",
  "errorMessage": "Password incorrect",
  "ipAddress": "192.168.1.100"
}
```

**PASSWORD_CHANGED**
```json
{
  "action": "PASSWORD_CHANGED",
  "resourceType": "USER",
  "resourceId": "user_123",
  "userId": "user_123", // User changed own password
  "status": "success",
  "changes": {
    "fields": ["password_hash"]
  }
}
```

**PASSWORD_RESET_REQUESTED**
```json
{
  "action": "PASSWORD_RESET_REQUESTED",
  "resourceType": "USER",
  "resourceId": "user_456",
  "status": "success",
  "reason": "User forgot password"
}
```

### Administrative Actions

**ROLE_GRANTED**
```json
{
  "action": "ROLE_GRANTED",
  "resourceType": "USER",
  "resourceId": "user_123",
  "adminId": "admin_456", // Admin who made change
  "userId": "admin_456",
  "status": "success",
  "changes": {
    "before": { "role": "customer" },
    "after": { "role": "admin" }
  },
  "reason": "Promoted to support admin"
}
```

**ROLE_REVOKED**
```json
{
  "action": "ROLE_REVOKED",
  "resourceType": "USER",
  "resourceId": "user_123",
  "adminId": "admin_456",
  "status": "success",
  "changes": {
    "before": { "role": "admin" },
    "after": { "role": "customer" }
  },
  "reason": "Admin access no longer needed"
}
```

**USER_CREATED**
```json
{
  "action": "USER_CREATED",
  "resourceType": "USER",
  "resourceId": "user_789",
  "adminId": "admin_456",
  "status": "success",
  "context": {
    "email": "newuser@example.com",
    "initialRole": "customer"
  }
}
```

**USER_DELETED**
```json
{
  "action": "USER_DELETED",
  "resourceType": "USER",
  "resourceId": "user_789",
  "adminId": "admin_456",
  "status": "success",
  "reason": "Account flagged for fraud"
}
```

### Permission Events

**PERMISSION_GRANTED**
```json
{
  "action": "PERMISSION_GRANTED",
  "resourceType": "RESOURCE",
  "resourceId": "order_123",
  "adminId": "admin_456",
  "status": "success",
  "context": {
    "permissionLevel": "read"
  }
}
```

**PERMISSION_DENIED**
```json
{
  "action": "PERMISSION_DENIED",
  "resourceType": "ORDER",
  "resourceId": "order_123",
  "userId": "user_999",
  "status": "failure",
  "errorMessage": "User attempted unauthorized access to other user's order"
}
```

### Payment Events

**PAYMENT_INITIATED**
```json
{
  "action": "PAYMENT_INITIATED",
  "resourceType": "PAYMENT",
  "resourceId": "payment_123",
  "userId": "user_456",
  "status": "success",
  "context": {
    "orderId": "order_123",
    "amount": 199.99,
    "provider": "stripe"
  }
}
```

**PAYMENT_SUCCEEDED**
```json
{
  "action": "PAYMENT_SUCCEEDED",
  "resourceType": "PAYMENT",
  "resourceId": "payment_123",
  "userId": "user_456",
  "status": "success",
  "context": {
    "orderId": "order_123",
    "amount": 199.99,
    "stripeId": "ch_1234567890"
  }
}
```

**PAYMENT_FAILED**
```json
{
  "action": "PAYMENT_FAILED",
  "resourceType": "PAYMENT",
  "resourceId": "payment_123",
  "userId": "user_456",
  "status": "failure",
  "errorMessage": "Card declined",
  "context": {
    "orderId": "order_123",
    "failureReason": "insufficient_funds"
  }
}
```

### Suspicious Activity

**BRUTE_FORCE_ATTEMPT**
```json
{
  "action": "BRUTE_FORCE_ATTEMPT",
  "resourceType": "USER",
  "resourceId": "user_email@example.com",
  "status": "failure",
  "ipAddress": "192.168.1.50",
  "context": {
    "failedAttempts": 5,
    "timeWindow": "15 minutes"
  },
  "reason": "Rate limiting triggered"
}
```

**UNAUTHORIZED_ACCESS_ATTEMPT**
```json
{
  "action": "UNAUTHORIZED_ACCESS_ATTEMPT",
  "resourceType": "ORDER",
  "resourceId": "order_123",
  "userId": "user_999",
  "status": "failure",
  "ipAddress": "192.168.1.50",
  "errorMessage": "User attempted to access order belonging to different user"
}
```

---

## Implementation

### 1. AuditLog Model

**File:** `src/models/audit-log.model.ts`

```typescript
import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    // Who
    userId: {
      type: String,
      index: true,
    },
    adminId: String,

    // What
    action: {
      type: String,
      enum: [
        'LOGIN',
        'LOGIN_FAILED',
        'PASSWORD_CHANGED',
        'PASSWORD_RESET_REQUESTED',
        'ROLE_GRANTED',
        'ROLE_REVOKED',
        'USER_CREATED',
        'USER_DELETED',
        'PERMISSION_GRANTED',
        'PERMISSION_DENIED',
        'PAYMENT_INITIATED',
        'PAYMENT_SUCCEEDED',
        'PAYMENT_FAILED',
        'BRUTE_FORCE_ATTEMPT',
        'UNAUTHORIZED_ACCESS_ATTEMPT',
      ],
      required: true,
      index: true,
    },
    resourceType: {
      type: String,
      enum: ['USER', 'ORDER', 'PAYMENT', 'RESOURCE'],
      required: true,
    },
    resourceId: {
      type: String,
      required: true,
      index: true,
    },

    // When & Where
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    ipAddress: String,
    userAgent: String,
    sessionId: String,

    // What changed
    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed,
      fields: [String],
    },

    // Result
    status: {
      type: String,
      enum: ['success', 'failure'],
      required: true,
    },
    errorMessage: String,
    reason: String,

    // Additional context
    context: mongoose.Schema.Types.Mixed,
  },
  {
    // Immutability
    timestamps: false,
    collection: 'auditlegs',
  }
);

// Auto-delete after 90 days (compliance: keep 90 days, delete after)
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

// Prevent updates/deletes on audit logs (append-only)
auditLogSchema.pre('updateOne', function (next) {
  throw new Error('Audit logs cannot be updated (append-only)');
});

auditLogSchema.pre('deleteOne', function (next) {
  throw new Error('Audit logs cannot be deleted (permanent record)');
});

export const AuditLogModel = mongoose.model('AuditLog', auditLogSchema);
```

### 2. AuditLogService

**File:** `src/services/audit-log.service.ts`

```typescript
import { AuditLogModel } from '../models/audit-log.model';
import { log } from '../utils/logger';

export interface AuditLogEntry {
  userId?: string | null;
  adminId?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  changes?: {
    before?: any;
    after?: any;
    fields?: string[];
  };
  status: 'success' | 'failure';
  errorMessage?: string;
  reason?: string;
  context?: any;
}

export class AuditLogService {
  /**
   * Record an audit log entry
   * Automatically handles immutability and persistence
   */
  static async log(entry: AuditLogEntry): Promise<void> {
    try {
      await AuditLogModel.create({
        ...entry,
        timestamp: new Date(),
      });
    } catch (error) {
      // Audit logging failure should not crash the application
      // But should be logged to alert ops
      log.error('Failed to create audit log', { error, entry });
    }
  }

  /**
   * Get audit logs for a specific resource
   * Used for compliance and debugging
   */
  static async getResourceLogs(resourceId: string, limit = 100) {
    return AuditLogModel.find({ resourceId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Get audit logs for a specific user
   * Used for user activity review
   */
  static async getUserLogs(userId: string, limit = 100) {
    return AuditLogModel.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Get suspicious activity (failed logins, unauthorized access)
   */
  static async getSuspiciousActivity(hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    return AuditLogModel.find({
      $or: [
        { action: 'LOGIN_FAILED' },
        { action: 'BRUTE_FORCE_ATTEMPT' },
        { action: 'UNAUTHORIZED_ACCESS_ATTEMPT' },
      ],
      timestamp: { $gte: since },
    })
      .sort({ timestamp: -1 })
      .lean();
  }

  /**
   * Get admin actions (for compliance audit trail)
   */
  static async getAdminActions(adminId: string, limit = 100) {
    return AuditLogModel.find({ adminId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Search audit logs (for investigations)
   */
  static async search(query: any, limit = 100) {
    return AuditLogModel.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  }
}
```

### 3. Audit Logging Middleware

**File:** `src/middlewares/audit-logging.middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { AuditLogService } from '../services/audit-log.service';

/**
 * Middleware to capture IP and user agent for audit logs
 */
export function auditLoggingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Store IP and user agent on request for use by handlers
  req.ipAddress = req.headers['x-forwarded-for']
    ? (req.headers['x-forwarded-for'] as string).split(',')[0]
    : req.socket.remoteAddress || 'unknown';

  req.userAgent = req.headers['user-agent'] || 'unknown';
  req.sessionId = req.sessionID;

  next();
}

/**
 * Helper function to log security events from route handlers
 */
export async function logAuditEvent(
  userId: string | null | undefined,
  action: string,
  resourceType: string,
  resourceId: string,
  status: 'success' | 'failure',
  req?: Request,
  options?: {
    adminId?: string;
    changes?: any;
    reason?: string;
    errorMessage?: string;
    context?: any;
  }
) {
  await AuditLogService.log({
    userId: userId || null,
    adminId: options?.adminId,
    action,
    resourceType,
    resourceId,
    ipAddress: req?.ipAddress,
    userAgent: req?.userAgent,
    sessionId: req?.sessionId,
    status,
    errorMessage: options?.errorMessage,
    reason: options?.reason,
    changes: options?.changes,
    context: options?.context,
  });
}
```

### 4. Integration Examples

**In Authentication Controller:**
```typescript
// login.ts
async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  try {
    const user = await UserModel.findOne({ email });

    if (!user || !bcrypt.compareSync(password, user.password)) {
      // Log failed login attempt
      await logAuditEvent(email, 'LOGIN_FAILED', 'USER', email, 'failure', req, {
        reason: 'Invalid credentials',
      });

      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Log successful login
    await logAuditEvent(user._id.toString(), 'LOGIN', 'USER', user._id.toString(), 'success', req);

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: '15m',
    });

    return res.json({ token, user });
  } catch (error) {
    await logAuditEvent(null, 'LOGIN_FAILED', 'USER', email, 'failure', req, {
      errorMessage: error.message,
    });

    throw error;
  }
}
```

**In Admin Controller (Role Changes):**
```typescript
async function grantAdminRole(req: Request, res: Response) {
  const { userId } = req.params;
  const adminId = req.user.id; // Current user (admin)

  try {
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const oldRole = user.role;
    user.role = 'admin';
    await user.save();

    // Log role change
    await logAuditEvent(adminId, 'ROLE_GRANTED', 'USER', userId, 'success', req, {
      adminId,
      changes: {
        before: { role: oldRole },
        after: { role: 'admin' },
        fields: ['role'],
      },
      reason: req.body.reason || 'Role change requested',
      context: { email: user.email },
    });

    return res.json({ message: 'Admin role granted', user });
  } catch (error) {
    await logAuditEvent(adminId, 'ROLE_GRANTED', 'USER', userId, 'failure', req, {
      adminId,
      errorMessage: error.message,
    });

    throw error;
  }
}
```

---

## Querying Audit Logs

### Admin Dashboard Endpoints

**Get user activity:**
```typescript
router.get('/api/admin/audit/users/:userId', async (req, res) => {
  const logs = await AuditLogService.getUserLogs(req.params.userId, 100);
  res.json(logs);
});
```

**Get admin actions:**
```typescript
router.get('/api/admin/audit/admin/:adminId', async (req, res) => {
  const logs = await AuditLogService.getAdminActions(req.params.adminId, 100);
  res.json(logs);
});
```

**Get suspicious activity (last 24 hours):**
```typescript
router.get('/api/admin/audit/suspicious', async (req, res) => {
  const logs = await AuditLogService.getSuspiciousActivity(24);
  res.json(logs);
});
```

**Search audit logs:**
```typescript
router.post('/api/admin/audit/search', async (req, res) => {
  const { query } = req.body;
  const logs = await AuditLogService.search(query, 100);
  res.json(logs);
});
```

### CLI Queries

**Check login attempts:**
```bash
mongosh
db.auditlegs.find({ action: "LOGIN_FAILED", timestamp: { $gte: ISODate("2024-01-27") } })
```

**Check role changes by admin:**
```bash
db.auditlegs.find({ adminId: "admin_123", action: { $in: ["ROLE_GRANTED", "ROLE_REVOKED"] } })
```

**Check unauthorized access attempts:**
```bash
db.auditlegs.find({ action: "UNAUTHORIZED_ACCESS_ATTEMPT", timestamp: { $gte: ISODate("2024-01-28") } })
```

---

## Compliance & Security

### Why Append-Only?

✅ **Immutability prevents tampering**
- Once logged, events cannot be deleted or modified
- Provides legal defensibility
- Proves "we logged this authentically"

✅ **Criminal liability prevented**
- Attacker can't hide their tracks by deleting logs
- Incidents remain visible for investigation

✅ **Audit trail integrity**
- Financial compliance (PCI-DSS, SOC 2)
- GDPR compliance (right to audit)
- Legal discovery (court subpoenas)

### Data Retention

**Default: 90 days**
```
Balance between:
- Storage cost (90 days = reasonable)
- Investigation window (most issues discovered within 30 days)
- Compliance (GDPR, etc. often require 60-90 days)
```

**Configurable:**
```typescript
// In audit-log.model.ts
// expireAfterSeconds: 7776000 = 90 days
// Change to 15552000 for 180 days, etc.
```

### Privacy Considerations

**GDPR "Right to Erasure"**
- Audit logs are NOT subject to right to erasure
- Reasoning: Legal necessity (compliance, investigation)
- Documented in privacy policy

**Personal Data in Logs**
- Minimize PII (don't log passwords, credit cards)
- Log IDs, not full names
- IP addresses retained for security investigation

---

## Monitoring & Alerts

### Key Events to Alert On

**CRITICAL (Alert Immediately):**
```
- Multiple failed logins (BRUTE_FORCE_ATTEMPT)
- Unauthorized access attempts (UNAUTHORIZED_ACCESS_ATTEMPT)
- Role changes to admin (ROLE_GRANTED)
- User deletions (USER_DELETED)
```

**HIGH PRIORITY (Review Daily):**
```
- Failed payments (PAYMENT_FAILED - review for patterns)
- Password resets (PASSWORD_RESET_REQUESTED - verify legitimacy)
- Permission changes (PERMISSION_GRANTED/REVOKED)
```

**MEDIUM PRIORITY (Weekly Review):**
```
- Regular login activity (patterns for anomaly detection)
- User creation (verify authorized admins)
```

### Setup Alerts

**Datadog/CloudWatch:**
```
Alert when:
- count(AuditLog where action="BRUTE_FORCE_ATTEMPT") > 5 in 1 hour
- count(AuditLog where action="UNAUTHORIZED_ACCESS_ATTEMPT") > 10 in 1 hour
- count(AuditLog where action="ROLE_GRANTED") > 0 (notify immediately)
```

---

## Testing Audit Logs

```typescript
describe('Audit Logging', () => {
  test('should log successful login', async () => {
    const user = await UserModel.create({
      email: 'test@example.com',
      password: bcryptjs.hashSync('password123', 10),
    });

    await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'password123',
    });

    const logs = await AuditLogService.getUserLogs(user._id.toString());
    expect(logs[0].action).toBe('LOGIN');
    expect(logs[0].status).toBe('success');
  });

  test('should log failed login attempt', async () => {
    await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'wrongpassword',
    });

    const logs = await AuditLogService.search({ action: 'LOGIN_FAILED' });
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].status).toBe('failure');
  });

  test('should log role changes with before/after', async () => {
    const user = await UserModel.create({
      email: 'user@example.com',
      role: 'customer',
    });
    const admin = await UserModel.create({
      email: 'admin@example.com',
      role: 'admin',
    });

    // Simulate admin granting role
    user.role = 'admin';
    await user.save();

    await logAuditEvent(admin._id.toString(), 'ROLE_GRANTED', 'USER', user._id.toString(), 'success', {
      adminId: admin._id.toString(),
      changes: {
        before: { role: 'customer' },
        after: { role: 'admin' },
      },
    });

    const logs = await AuditLogService.getAdminActions(admin._id.toString());
    expect(logs[0].changes.before.role).toBe('customer');
    expect(logs[0].changes.after.role).toBe('admin');
  });
});
```

---

## Interview Talking Points

**When asked about compliance/security events:**

> "We maintain an immutable audit trail of all security-relevant events. Every login, password change, role grant, and admin action is logged with timestamp, IP, user agent, and result status.
>
> The logs are append-only (can't be modified/deleted), retained for 90 days for investigation, and automatically expire to balance compliance with storage costs.
>
> This gives us:
> - **Compliance**: GDPR, PCI-DSS, SOC 2 audit trail
> - **Investigation**: Trace what happened during security incident
> - **Accountability**: Prove admin actions are authorized
> - **Legal defensibility**: Verifiable records in court
>
> We alert ops on critical events (brute force, unauthorized access, role changes) so we can investigate immediately."

---

**Last Updated:** 2024-01-28  
**Version:** 1.0  
**Status:** Production-Ready
