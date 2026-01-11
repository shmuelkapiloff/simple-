# 🔗 Client-Server Integration Guide

## Current Setup ✅

### Server
```
✅ Running on http://localhost:4001
✅ CORS enabled for http://localhost:5173
✅ Health check at /health
✅ API routes at /api/...
✅ Standard response format
```

### Client
```
✅ React with TypeScript
✅ Redux Toolkit Query for API calls
✅ Base URL: http://localhost:4001/api/
✅ Token storage in localStorage
```

---

## API Integration Pattern

### 1. Standard Response Format

**Your server responds:**
```json
{
  "success": true,
  "data": {
    "_id": "123",
    "name": "Product",
    "price": 100
  },
  "message": "Success"
}
```

**Your client expects:**
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message: string;
  details?: Record<string, any>;
}
```

### 2. Error Handling

**Server sends errors:**
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid input",
  "details": [...]
}
```

**Client handles them:**
```typescript
if (!response.success) {
  if (response.error === "UNAUTHORIZED") {
    // Redirect to login
  }
  if (response.error === "VALIDATION_ERROR") {
    // Show validation errors
  }
}
```

---

## Authentication Flow

### 1. User Logs In
```
Client Sends:
POST /api/auth/login
{ email: "user@test.com", password: "password" }

Server Responds:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_123",
      "email": "user@test.com",
      "name": "John Doe"
    }
  },
  "message": "Login successful"
}

Client Action:
localStorage.setItem("token", response.data.token);
```

### 2. Client Makes Authenticated Requests
```
Client Sends:
GET /api/orders
Headers: {
  Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Server Response:
{
  "success": true,
  "data": [{...orders...}],
  "message": "Orders retrieved successfully"
}
```

### 3. Token Expires
```
Server Responds:
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "Invalid or expired token"
}
Status: 401

Client Action:
- Clear localStorage
- Redirect to login
- Show "Session expired" message
```

---

## Redux Toolkit Query Integration

### Setup (Already Done)

**File:** `client/src/app/api.ts`

```typescript
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4001/api/",
    prepareHeaders: (headers, { getState }: any) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    // ... endpoints
  }),
});
```

### Using Endpoints

```typescript
// In components
import { useGetProductsQuery } from "../app/api";

export const ProductList = () => {
  const { data, isLoading, error } = useGetProductsQuery();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading products</div>;
  if (!data?.success) return <div>{data?.message}</div>;

  return (
    <div>
      {data.data.map((product) => (
        <div key={product._id}>{product.name}</div>
      ))}
    </div>
  );
};
```

---

## Handling Different Response Types

### List Endpoint
```
GET /api/products

Response:
{
  "success": true,
  "data": [
    { _id: "1", name: "Product 1" },
    { _id: "2", name: "Product 2" }
  ],
  "message": "Products retrieved"
}
```

### Single Resource
```
GET /api/products/123

Response:
{
  "success": true,
  "data": {
    "_id": "123",
    "name": "Product 1",
    "price": 100
  },
  "message": "Product retrieved"
}
```

### Create/Update
```
POST /api/products
Response:
{
  "success": true,
  "data": { _id: "new_id", ... },
  "message": "Product created"
}
```

### Delete
```
DELETE /api/products/123
Response:
{
  "success": true,
  "data": null,
  "message": "Product deleted"
}
```

---

## Error Codes & Client Actions

| Error Code | HTTP Status | Client Action |
|-----------|------------|---------------|
| `VALIDATION_ERROR` | 400 | Show form errors |
| `UNAUTHORIZED` | 401 | Redirect to login |
| `FORBIDDEN` | 403 | Show permission denied |
| `NOT_FOUND` | 404 | Show 404 page |
| `CONFLICT` | 409 | Show duplicate error |
| `SERVER_ERROR` | 500 | Show server error |

### Example Error Handler
```typescript
// hooks/useApiError.ts
export const useApiError = (error: any) => {
  if (!error) return null;

  const errorData = error.data;

  switch (errorData.error) {
    case "VALIDATION_ERROR":
      return {
        type: "form-error",
        fields: errorData.details,
      };
    case "UNAUTHORIZED":
      // Redirect to login
      return { type: "redirect", path: "/login" };
    case "FORBIDDEN":
      return { type: "alert", message: "Permission denied" };
    case "NOT_FOUND":
      return { type: "redirect", path: "/404" };
    default:
      return { type: "alert", message: errorData.message };
  }
};
```

---

## API Endpoints Your Client Uses

### Authentication
```
POST /api/auth/register      - Create new user
POST /api/auth/login         - Login user
GET  /api/auth/profile       - Get current user
PUT  /api/auth/profile       - Update profile
```

### Products
```
GET  /api/products           - List all products
GET  /api/products?search=x  - Search products
GET  /api/products/:id       - Get single product
POST /api/products           - Create (admin)
PUT  /api/products/:id       - Update (admin)
DELETE /api/products/:id     - Delete (admin)
```

### Cart
```
GET  /api/cart               - Get user cart
POST /api/cart               - Add to cart
PUT  /api/cart/:itemId       - Update quantity
DELETE /api/cart/:itemId     - Remove from cart
DELETE /api/cart             - Clear cart
```

### Orders
```
GET  /api/orders             - List user orders
POST /api/orders             - Create order
GET  /api/orders/:id         - Get order details
GET  /api/orders/:id/track   - Track order
```

### Addresses
```
GET  /api/addresses          - List user addresses
POST /api/addresses          - Create address
PUT  /api/addresses/:id      - Update address
DELETE /api/addresses/:id    - Delete address
```

---

## Testing Integration

### 1. Check Server Health
```bash
curl http://localhost:4001/health
# Should return: { "success": true, "status": "ok" }
```

### 2. Test Login Flow
```bash
curl -X POST http://localhost:4001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
```

### 3. Test with Token
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
curl http://localhost:4001/api/orders \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Test from Browser Console
```javascript
// Login
fetch("http://localhost:4001/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    email: "test@test.com",
    password: "password123"
  })
})
.then(r => r.json())
.then(data => {
  if (data.success) {
    localStorage.setItem("token", data.data.token);
    console.log("Logged in:", data.data.user);
  } else {
    console.error(data.message);
  }
});

// Get products
fetch("http://localhost:4001/api/products")
  .then(r => r.json())
  .then(data => console.log(data));

// Get orders (requires token)
const token = localStorage.getItem("token");
fetch("http://localhost:4001/api/orders", {
  headers: { Authorization: `Bearer ${token}` }
})
  .then(r => r.json())
  .then(data => console.log(data));
```

---

## Troubleshooting

### CORS Error in Browser
```
Error: Access to XMLHttpRequest has been blocked by CORS policy
```

**Solution:**
1. Check `ALLOWED_ORIGINS` in `server/.env`
2. Verify client URL matches (e.g., http://localhost:5173)
3. Restart server after env change

### 401 Unauthorized on Authenticated Requests
```
{ "success": false, "error": "UNAUTHORIZED" }
```

**Solution:**
1. Token not in localStorage
2. Token is expired
3. Authorization header not being sent
4. Token format is wrong (should be "Bearer TOKEN")

### 400 Validation Error
```
{ "success": false, "error": "VALIDATION_ERROR", "details": [...] }
```

**Solution:**
1. Check request data matches schema
2. All required fields present
3. Data types are correct

### 500 Server Error
```
{ "success": false, "error": "SERVER_ERROR" }
```

**Solution:**
1. Check server console for error
2. Check MongoDB is running
3. Check Redis is running
4. Check environment variables

---

## Best Practices for Client

### 1. Always Check `success` Field
```typescript
// ❌ BAD
const data = await response.json();
dispatch(setProducts(data)); // Might be error!

// ✅ GOOD
const data = await response.json();
if (data.success) {
  dispatch(setProducts(data.data));
} else {
  dispatch(setError(data.message));
}
```

### 2. Handle Network Errors
```typescript
try {
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.success) {
    return data.data;
  } else {
    throw new Error(data.message);
  }
} catch (error) {
  // Handle network error or parse error
  console.error("Request failed:", error);
}
```

### 3. Always Include Token
```typescript
// ✅ In Redux Toolkit Query
const api = createApi({
  baseQuery: fetchBaseQuery({
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
});
```

### 4. Handle Token Expiration
```typescript
// In Redux Toolkit Query error interceptor
baseQuery: fetchBaseQuery({
  baseUrl: "http://localhost:4001/api/",
  credentials: "include",
}),
async onQueryStarted(arg, { dispatch, queryFulfilled }) {
  try {
    await queryFulfilled;
  } catch (error: any) {
    if (error.status === 401) {
      localStorage.removeItem("token");
      // Redirect to login
    }
  }
}
```

---

## Environment-Specific URLs

### Development
```
Server: http://localhost:4001
Client: http://localhost:5173
```

### Production
```
Server: https://api.yourapp.com
Client: https://yourapp.com

# In client/.env.production
VITE_API_URL=https://api.yourapp.com
```

### Update API Base URL
```typescript
// client/src/app/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 
                     "http://localhost:4001/api/";

export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
  }),
});
```

---

## Summary

Your client-server integration is **ready to go**:

✅ Server sends standard JSON responses
✅ Client expects and handles them correctly
✅ Authentication flow is implemented
✅ Error handling is in place
✅ Token management is set up
✅ CORS is configured
✅ All endpoints are documented

**Everything works together!** 🎉

