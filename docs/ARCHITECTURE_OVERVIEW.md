# 📊 Server Architecture Summary

## ✅ השיפורים שעשינו

### 1️⃣ **CORS Configuration** (`src/config/cors.ts`)
```typescript
// ✅ מאפשר בקשות מ:
- http://localhost:5173 (Vite dev client)
- http://localhost:3000 (Next.js, Nuxt)
- http://localhost:8080 (Vue dev server)
- וכל מקור שתוסיף ל ALLOWED_ORIGINS בـ .env

✅ תמיכה ב:
- GET, POST, PUT, DELETE, PATCH, OPTIONS
- Authorization header
- Credentials (cookies)
```

### 2️⃣ **Environment Variables** (`src/config/env.ts`)
```typescript
// ✅ מנוהל מרכזי
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
LOG_LEVEL=info
JWT_SECRET=your-key
PORT=4001
```

### 3️⃣ **Updated app.ts**
```typescript
✅ Health endpoint (/health)
  - עבור load balancers
  - עבור health checks

✅ Root API endpoint (/)
  - מציג את כל ה-endpoints
  - שימושי לתיעוד

✅ Standard error handling
  - 404 responses
  - Global error middleware
```

---

## 🔄 Data Flow: Web/Mobile/Desktop Client

```
┌─────────────────────────────────────────────────────────────┐
│             ANY CLIENT (Web, Mobile, Desktop)               │
│                                                             │
│  - Browser (React, Vue, Angular)                          │
│  - Mobile App (React Native, Flutter)                     │
│  - Desktop (Electron, Tauri)                              │
│  - CLI Tool (Node.js script)                              │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP/HTTPS Request
                   │ ✅ CORS allowed
                   │ ✅ Authorization: Bearer token
                   ▼
┌──────────────────────────────────────────────────────────────┐
│                    SIMPLE SHOP SERVER                        │
│                    (Express.js on port 4001)                 │
│                                                              │
│  Middleware Stack:                                          │
│  1. Helmet - Security headers                              │
│  2. CORS - Cross-origin handling                           │
│  3. JSON Parser - Request body parsing                     │
│  4. Morgan - Request logging                               │
│                                                              │
│  Routers:                                                   │
│  /api/auth       - Login, Register, Profile               │
│  /api/products   - List, Search, Details                  │
│  /api/cart       - Add, Remove, Update                    │
│  /api/orders     - Create, Status, History               │
│  /api/addresses  - CRUD operations                        │
│  /api/admin      - Admin dashboard                        │
│  /health         - Health check (load balancers)         │
│                                                              │
│  Error Handler:                                            │
│  - Standard error responses                               │
│  - HTTP status codes                                      │
│  - Error codes & messages                                │
└──────────────────┬───────────────────────────────────────────┘
                   │ HTTP/JSON Response
                   │ Standard Format:
                   │ {
                   │   "success": true/false,
                   │   "data": {...},
                   │   "error": "ERROR_CODE",
                   │   "message": "Human readable"
                   │ }
                   ▼
┌──────────────────────────────────────────────────────────────┐
│                   CLIENT RECEIVES RESPONSE                   │
│                                                              │
│  ✅ Can parse standard JSON                                │
│  ✅ Knows error codes (VALIDATION_ERROR, UNAUTHORIZED, etc)│
│  ✅ Can retry on specific errors                          │
│  ✅ Handles different client types same way              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎯 Client Compatibility Matrix

| Feature | Web (React) | Mobile (RN) | Desktop (Electron) | CLI |
|---------|-----------|-----------|-------------------|-----|
| CORS | ✅ | ✅* | ✅ | N/A |
| JSON | ✅ | ✅ | ✅ | ✅ |
| Auth (JWT) | ✅ | ✅ | ✅ | ✅ |
| Error Handling | ✅ | ✅ | ✅ | ✅ |
| Cookies | ✅ | ✅ | ✅ | ✅** |

*Mobile doesn't enforce CORS in-app
**CLI tools can handle cookies with proper libraries

---

## 📋 Standard Response Format

### ✅ Success Response (200/201)
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "message": "Operation successful"
}
```

### ❌ Validation Error (400)
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

### ❌ Unauthorized (401)
```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "Authorization token required"
}
```

### ❌ Forbidden (403)
```json
{
  "success": false,
  "error": "FORBIDDEN",
  "message": "You don't have permission to access this resource"
}
```

### ❌ Not Found (404)
```json
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "Resource not found"
}
```

### ❌ Conflict (409)
```json
{
  "success": false,
  "error": "CONFLICT",
  "message": "User with this email already exists"
}
```

### ❌ Server Error (500)
```json
{
  "success": false,
  "error": "SERVER_ERROR",
  "message": "Internal server error"
}
```

---

## 🔐 Authentication Flow

```
1. Client Requests Login
   POST /api/auth/login
   Body: { email, password }
   ↓

2. Server Validates & Issues Token
   Response: { token: "jwt_token_xyz" }
   ↓

3. Client Stores Token
   localStorage / AsyncStorage / Keychain
   ↓

4. Client Makes Authenticated Requests
   Header: Authorization: Bearer jwt_token_xyz
   ↓

5. Server Validates Token via Middleware
   If valid → Continue request
   If invalid → Return 401 Unauthorized
```

---

## 🚀 How Your Server Works with Different Clients

### Web Client (React)
```typescript
// client/src/api.ts
const API_URL = "http://localhost:4001";

export const login = async (email: string, password: string) => {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  
  const data = await res.json();
  if (data.success) {
    localStorage.setItem("token", data.data.token);
    return data.data;
  }
  throw new Error(data.message);
};

export const getProducts = async () => {
  const res = await fetch(`${API_URL}/api/products`, {
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    },
  });
  return res.json();
};
```

### Mobile Client (React Native)
```typescript
// api.ts
const API_URL = "http://localhost:4001";

export const login = async (email: string, password: string) => {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  if (data.success) {
    await AsyncStorage.setItem("token", data.data.token);
    return data.data;
  }
  throw new Error(data.message);
};

export const getProducts = async () => {
  const token = await AsyncStorage.getItem("token");
  const response = await fetch(`${API_URL}/api/products`, {
    headers: {
      "Authorization": `Bearer ${token}`
    },
  });
  return response.json();
};
```

### Desktop Client (Electron)
```typescript
// main.ts (Electron main process)
const https = require("https");

const request = (method: string, path: string, data?: any) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 4001,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };
    
    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => body += chunk);
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (err) {
          reject(err);
        }
      });
    });
    
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
};
```

---

## 🧪 Testing Current Setup

```bash
# Health check
curl http://localhost:4001/health

# API info
curl http://localhost:4001/

# Login
curl -X POST http://localhost:4001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Get products
curl http://localhost:4001/api/products

# With authentication
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4001/api/orders
```

---

## 📊 Current Server Status

```
✅ Server Running on port 4001
✅ CORS Configured
✅ Health Endpoint Active
✅ API Routes Ready
✅ Error Handling Set Up
✅ JWT Authentication Ready
✅ MongoDB Connected
✅ Redis Connected
✅ Logging Enabled
```

---

## 🎯 Next Steps

1. **Test with your React client** - Verify CORS is working
2. **Update all controllers** - Use consistent response format
3. **Add request validation** - Use Zod schemas
4. **Implement rate limiting** - Protect against abuse
5. **Add API documentation** - Use Swagger/OpenAPI
6. **Set up tests** - Unit & integration tests
7. **Monitor in production** - Use APM tools

