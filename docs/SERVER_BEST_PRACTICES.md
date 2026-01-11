# 🚀 Server Best Practices - עבור כל סוג קליינט

## 1. API Response Format (עקבי לכל הקליינטים)

### ✅ Standard Response Format
```typescript
// Success response
{
  "success": true,
  "data": { /* actual data */ },
  "message": "Operation completed successfully"
}

// Error response
{
  "success": false,
  "error": "error_code",
  "message": "Human readable message",
  "details": { /* optional */ }
}
```

### Implement Response Wrapper
```typescript
// src/utils/response.ts
export const sendSuccess = (data: any, message = "Success") => ({
  success: true,
  data,
  message,
});

export const sendError = (error: string, message: string, details?: any) => ({
  success: false,
  error,
  message,
  details,
});
```

---

## 2. HTTP Status Codes (Standard)

```
200 OK              ✅ Successful request
201 Created         ✅ Resource created
204 No Content      ✅ Successful with no response body
400 Bad Request     ❌ Invalid input
401 Unauthorized    ❌ Not authenticated
403 Forbidden       ❌ Not authorized
404 Not Found       ❌ Resource doesn't exist
409 Conflict        ❌ Resource conflict
500 Server Error    ❌ Internal server error
```

---

## 3. CORS Configuration (לכל קליינט)

```typescript
// src/config/cors.ts
import cors from 'cors';

export const corsConfig = cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// app.ts
app.use(corsConfig);
```

---

## 4. Error Handling (עקבי לכל הקליינטים)

```typescript
// src/middlewares/error.middleware.ts
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    success: false,
    error: err.code || 'INTERNAL_ERROR',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
```

---

## 5. Request Validation (Zod Schema)

```typescript
// src/validators/auth.validator.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be 6+ chars'),
});

// In controller
export const login = async (req: Request, res: Response) => {
  try {
    const validated = loginSchema.parse(req.body);
    // ... handle login
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: err.errors,
      });
    }
  }
};
```

---

## 6. Authentication & Authorization

```typescript
// src/middlewares/auth.middleware.ts
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: any, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'NO_TOKEN',
      message: 'Authorization token required',
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'INVALID_TOKEN',
      message: 'Invalid or expired token',
    });
  }
};
```

---

## 7. API Versioning (for future clients)

```typescript
// app.ts
import v1Routes from './routes/v1';

app.use('/api/v1/auth', v1Routes.auth);
app.use('/api/v1/products', v1Routes.products);

// This way, when you need v2, you can support both:
// /api/v1/... (old clients)
// /api/v2/... (new clients)
```

---

## 8. Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later',
});

app.use('/api/', limiter);
```

---

## 9. Logging

```typescript
// src/utils/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
  },
});

// Usage in routes
logger.info({ userId: req.user.id }, 'User logged in');
logger.error({ err }, 'Failed to process order');
```

---

## 10. Environment Variables

```
# .env
NODE_ENV=development
PORT=4001
MONGODB_URI=mongodb://localhost:27017/simple-shop
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
LOG_LEVEL=info
```

---

## ✅ Checklist for Client Compatibility

- [ ] Consistent response format for all endpoints
- [ ] Proper HTTP status codes
- [ ] CORS properly configured
- [ ] Clear error messages with error codes
- [ ] Request validation (Zod/Joi)
- [ ] Authentication via JWT in Authorization header
- [ ] Comprehensive logging
- [ ] Rate limiting
- [ ] API versioning ready
- [ ] Health check endpoint
- [ ] Documentation of all endpoints
- [ ] Environment variables properly managed

---

## Example: Complete Endpoint

```typescript
// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    // 1. Validate request
    const validated = loginSchema.parse(req.body);
    
    // 2. Process
    const user = await User.findOne({ email: validated.email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }
    
    // 3. Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!);
    
    // 4. Send success response
    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
      },
      message: 'Login successful',
    });
  } catch (err) {
    // 5. Handle errors
    logger.error({ err }, 'Login failed');
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Internal server error',
    });
  }
});
```

---

## 📚 References
- REST API Best Practices: https://restfulapi.net/
- HTTP Status Codes: https://httpwg.org/specs/rfc9110.html
- CORS Specification: https://fetch.spec.whatwg.org/#cors-protocol
