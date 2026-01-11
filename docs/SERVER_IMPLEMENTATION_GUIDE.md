# 🚀 Server Best Practices Implementation Guide

## סיכום השיפורים שעשינו

### ✅ 1. CORS Configuration
**File:** `server/src/config/cors.ts`

קובץ זה כולל:
- תמיכה במקורות מרובים (Multiple Origins)
- Credentials support (עבור cookies)
- Standard HTTP methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
- Headers מכוללים: Content-Type, Authorization

**Usage in app.ts:**
```typescript
import corsConfig from "./config/cors";
app.use(corsConfig);
```

---

### ✅ 2. Environment Variables
**File:** `server/src/config/env.ts`

עדכנו להוסיף:
- `ALLOWED_ORIGINS` - מקורות מותרים API
- `LOG_LEVEL` - רמת logging

**In .env:**
```
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:8080
LOG_LEVEL=info
```

---

### ✅ 3. Updated app.ts
**Key Improvements:**
- ✅ Better CORS configuration
- ✅ Health endpoint at `/health` (for load balancers)
- ✅ API documentation in root endpoint
- ✅ Proper status codes and error messages
- ✅ Response format standardization

---

## 📋 כיצד להשתמש בתוך קונטרולרים

### דוגמה: Auth Controller

```typescript
import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      // 1. Validate input
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "Email and password are required",
          details: {
            email: !email ? "Email is required" : undefined,
            password: !password ? "Password is required" : undefined,
          },
        });
      }

      // 2. Call service
      const result = await AuthService.login(email, password);

      // 3. Send success response
      return res.status(200).json({
        success: true,
        data: {
          token: result.token,
          user: {
            id: result.user._id,
            email: result.user.email,
            name: result.user.name,
          },
        },
        message: "Login successful",
      });

    } catch (error: any) {
      // 4. Handle errors
      if (error.message === "Invalid credentials") {
        return res.status(401).json({
          success: false,
          error: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        });
      }

      res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "Internal server error",
      });
    }
  }

  static async register(req: Request, res: Response) {
    try {
      const { email, password, name } = req.body;

      // Validation
      if (!email || !password || !name) {
        return res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "Email, password, and name are required",
        });
      }

      // Check if user exists
      const existing = await AuthService.findByEmail(email);
      if (existing) {
        return res.status(409).json({
          success: false,
          error: "USER_EXISTS",
          message: "User with this email already exists",
        });
      }

      // Register
      const result = await AuthService.register({ email, password, name });

      res.status(201).json({
        success: true,
        data: {
          id: result._id,
          email: result.email,
          name: result.name,
        },
        message: "User registered successfully",
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "Registration failed",
      });
    }
  }
}
```

---

## 🔍 HTTP Status Codes Reference

```typescript
// Success
200 OK              - GET, PUT, PATCH request successful
201 Created         - POST created a new resource
204 No Content      - DELETE successful, no response body

// Client Errors
400 Bad Request     - Invalid input/validation failed
401 Unauthorized    - Missing or invalid authentication
403 Forbidden       - Authenticated but not authorized
404 Not Found       - Resource doesn't exist
409 Conflict        - Resource conflict (e.g., duplicate)

// Server Errors
500 Internal Error  - Server-side error
503 Unavailable     - Service temporarily unavailable
```

**Example Implementation:**
```typescript
router.post("/", async (req, res) => {
  try {
    // Validation
    if (!req.body.name) {
      return res.status(400).json({ /* error */ }); // 400
    }

    // Check duplicate
    const existing = await Product.findOne({ name: req.body.name });
    if (existing) {
      return res.status(409).json({ /* conflict */ }); // 409
    }

    // Create
    const product = await Product.create(req.body);
    res.status(201).json({ 
      success: true,
      data: product, 
      message: "Created"
    }); // 201

  } catch (err) {
    res.status(500).json({ /* error */ }); // 500
  }
});
```

---

## 🛡️ Security Best Practices

### 1. Authentication Middleware
```typescript
// src/middlewares/auth.middleware.ts
import jwt from "jsonwebtoken";

export const authMiddleware = (req: any, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "NO_TOKEN",
      message: "Authorization token required",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: "INVALID_TOKEN",
      message: "Invalid or expired token",
    });
  }
};

// Usage in routes
router.post("/profile", authMiddleware, ProfileController.update);
```

### 2. Rate Limiting
```typescript
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later",
});

app.use("/api/", limiter);
```

### 3. Input Validation with Zod
```typescript
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

router.post("/login", (req, res) => {
  try {
    const validated = loginSchema.parse(req.body);
    // ... handle login
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: "Invalid input",
        details: err.errors,
      });
    }
  }
});
```

---

## 📊 Response Format Examples

### Success Response
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "message": "User retrieved successfully"
}
```

### Validation Error
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid request data",
  "details": [
    {
      "path": ["email"],
      "message": "Invalid email format"
    }
  ]
}
```

### Auth Error
```json
{
  "success": false,
  "error": "INVALID_CREDENTIALS",
  "message": "Invalid email or password"
}
```

### Not Found
```json
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "User with ID 123 not found"
}
```

### Conflict Error
```json
{
  "success": false,
  "error": "CONFLICT",
  "message": "User with this email already exists"
}
```

---

## 🧪 Testing Your API

### Using cURL
```bash
# Health check
curl http://localhost:4001/health

# Login
curl -X POST http://localhost:4001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# With Authorization
curl -H "Authorization: Bearer <token>" \
  http://localhost:4001/api/auth/profile
```

### Using JavaScript Fetch
```typescript
// Login
const response = await fetch("http://localhost:4001/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({ email: "user@example.com", password: "pass" }),
});

const result = await response.json();
if (result.success) {
  // Store token
  localStorage.setItem("token", result.data.token);
}
```

---

## 🚀 Deployment Checklist

- [ ] Change `JWT_SECRET` in production
- [ ] Update `ALLOWED_ORIGINS` for production domains
- [ ] Set `NODE_ENV=production`
- [ ] Use environment-specific `.env` files
- [ ] Enable HTTPS/TLS
- [ ] Configure rate limiting
- [ ] Set up monitoring/logging
- [ ] Use environment variables for sensitive data
- [ ] Test CORS with actual client domains
- [ ] Verify all error responses don't leak sensitive info

---

## 📚 Next Steps

1. **Update all controllers** to use standard response format
2. **Add request validation** using Zod in all routes
3. **Implement rate limiting** for sensitive endpoints
4. **Add comprehensive logging** for debugging
5. **Create API documentation** using Swagger/OpenAPI
6. **Set up automated tests** for critical paths
7. **Monitor API performance** in production

