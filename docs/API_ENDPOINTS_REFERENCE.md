# 📚 API Endpoints Reference - Simple Shop

**Base URL:** `http://localhost:4001/api`

---

## 🏥 Health Check

### 1. Health Status
```http
GET /api/health
```

**Headers:** None required

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "mongodb": "connected",
    "redis": "connected",
    "uptime": 12345
  }
}
```

**Response Error (503):**
```json
{
  "success": false,
  "message": "Service unavailable",
  "errors": ["MongoDB disconnected"]
}
```

---

### 2. Ping
```http
GET /api/health/ping
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "pong"
}
```

---

## 🔐 Authentication

### 1. Register
```http
POST /api/auth/register
```

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": ["Email is required", "Password must be at least 6 characters"]
}
```

**Response Error (409):**
```json
{
  "success": false,
  "message": "User already exists"
}
```

---

### 2. Login
```http
POST /api/auth/login
```

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response Error (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**Response Error (404):**
```json
{
  "success": false,
  "message": "User not found"
}
```

---

### 3. Verify Token
```http
GET /api/auth/verify
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "john@example.com",
      "name": "John Doe"
    }
  }
}
```

**Response Error (401):**
```json
{
  "success": false,
  "message": "Invalid token"
}
```

---

### 4. Get Profile
```http
GET /api/auth/profile
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "createdAt": "2024-12-01T10:00:00Z"
    }
  }
}
```

**Response Error (401):**
```json
{
  "success": false,
  "message": "Not authenticated"
}
```

---

### 5. Logout
```http
POST /api/auth/logout
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 📦 Products

### 1. Get All Products
```http
GET /api/products
```

**Query Parameters (all optional):**
- `search` - חיפוש חופשי
- `category` - סינון לפי קטגוריה
- `minPrice` - מחיר מינימלי
- `maxPrice` - מחיר מקסימלי
- `sort` - מיון: `price_asc`, `price_desc`, `name`, `newest`

**Example:**
```http
GET /api/products?search=laptop&category=electronics&minPrice=500&maxPrice=2000&sort=price_asc
```

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "prod1",
      "sku": "LAPTOP-HP-001",
      "name": "HP Laptop 15",
      "description": "מחשב נייד עם מעבד i5",
      "price": 1299.90,
      "category": "electronics",
      "image": "https://example.com/laptop.jpg",
      "featured": true,
      "stock": 15,
      "rating": 4.5,
      "isActive": true,
      "createdAt": "2024-12-01T10:00:00Z"
    }
  ]
}
```

**Response Error (500):**
```json
{
  "success": false,
  "message": "Server error"
}
```

---

### 2. Get Product by ID
```http
GET /api/products/:id
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "_id": "prod1",
    "name": "HP Laptop 15",
    "price": 1299.90,
    "stock": 15
  }
}
```

**Response Error (404):**
```json
{
  "success": false,
  "message": "Product not found"
}
```

---

## 🛒 Cart

### 1. Get Cart
```http
GET /api/cart
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "_id": "cart1",
    "userId": "507f1f77bcf86cd799439011",
    "sessionId": "session123",
    "items": [
      {
        "product": {
          "_id": "prod1",
          "name": "HP Laptop",
          "price": 1299.90,
          "image": "..."
        },
        "quantity": 2,
        "lockedPrice": null
      }
    ],
    "total": 2599.80
  }
}
```

**Response Error (401):**
```json
{
  "success": false,
  "message": "Not authenticated"
}
```

---

### 2. Add to Cart
```http
POST /api/cart/add
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "productId": "prod1",
  "quantity": 2
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Item added to cart",
  "data": {
    "items": [...],
    "total": 2599.80
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "Product ID and quantity are required"
}
```

**Response Error (404):**
```json
{
  "success": false,
  "message": "Product not found"
}
```

**Response Error (400) - Out of Stock:**
```json
{
  "success": false,
  "message": "Insufficient stock"
}
```

---

### 3. Update Cart Item
```http
PUT /api/cart/update
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "productId": "prod1",
  "quantity": 5
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Cart updated",
  "data": {
    "items": [...],
    "total": 6499.50
  }
}
```

**Response Error (404):**
```json
{
  "success": false,
  "message": "Item not found in cart"
}
```

---

### 4. Remove from Cart
```http
DELETE /api/cart/remove
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "productId": "prod1"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Item removed from cart",
  "data": {
    "items": [],
    "total": 0
  }
}
```

---

### 5. Clear Cart
```http
DELETE /api/cart/clear
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Cart cleared",
  "data": {
    "items": [],
    "total": 0
  }
}
```

---

### 6. Get Cart Count
```http
GET /api/cart/count
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "count": 3
  }
}
```

---

## 🧾 Orders

### 1. Create Order
```http
POST /api/orders
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "shippingAddress": {
    "street": "הרצל 10",
    "city": "תל אביב",
    "postalCode": "67890",
    "country": "Israel"
  },
  "paymentMethod": "credit_card",
  "notes": "נא לארוז מתנה"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order": {
      "_id": "order1",
      "orderNumber": "ORD-20241223-001",
      "user": "507f1f77bcf86cd799439011",
      "items": [
        {
          "product": "prod1",
          "name": "HP Laptop",
          "price": 1299.90,
          "quantity": 2,
          "image": "..."
        }
      ],
      "totalAmount": 2599.80,
      "status": "pending",
      "paymentStatus": "pending",
      "paymentMethod": "credit_card",
      "shippingAddress": {
        "street": "הרצל 10",
        "city": "תל אביב",
        "postalCode": "67890",
        "country": "Israel"
      },
      "estimatedDelivery": "2024-12-28T23:59:59Z",
      "createdAt": "2024-12-23T10:00:00Z"
    }
  }
}
```

**Response Error (400) - Empty Cart:**
```json
{
  "success": false,
  "message": "Cart is empty"
}
```

**Response Error (400) - Out of Stock:**
```json
{
  "success": false,
  "message": "Product HP Laptop is out of stock"
}
```

---

### 2. Get My Orders
```http
GET /api/orders
```

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters (optional):**
- `status` - סינון לפי סטטוס
- `limit` - מספר תוצאות (default: 10)
- `offset` - offset לפגינציה (default: 0)

**Example:**
```http
GET /api/orders?status=pending&limit=5
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "_id": "order1",
        "orderNumber": "ORD-20241223-001",
        "totalAmount": 2599.80,
        "status": "pending",
        "createdAt": "2024-12-23T10:00:00Z"
      }
    ],
    "total": 1,
    "page": 1
  }
}
```

---

### 3. Get Order by ID
```http
GET /api/orders/:orderId
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "order": {
      "_id": "order1",
      "orderNumber": "ORD-20241223-001",
      "items": [...],
      "totalAmount": 2599.80,
      "status": "pending"
    }
  }
}
```

**Response Error (404):**
```json
{
  "success": false,
  "message": "Order not found"
}
```

**Response Error (403):**
```json
{
  "success": false,
  "message": "Not authorized to view this order"
}
```

---

### 4. Cancel Order
```http
POST /api/orders/:orderId/cancel
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "data": {
    "order": {
      "_id": "order1",
      "status": "cancelled"
    }
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "Cannot cancel order that is already shipped"
}
```

---

## 📊 Status Codes Summary

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Validation error, missing fields |
| 401 | Unauthorized | Not authenticated, invalid token |
| 403 | Forbidden | Not authorized for this action |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists (e.g., email) |
| 500 | Server Error | Internal server error |
| 503 | Service Unavailable | Database/service down |

---

## 🔑 Authentication Flow

```
1. Register/Login → Receive token
2. Store token in client
3. Add to all requests: Authorization: Bearer {token}
4. Server validates token
5. Server extracts userId from token
6. Server processes request for that user
```

---

## 💡 Common Patterns

### Pagination
```http
GET /api/orders?limit=10&offset=20
```

### Filtering
```http
GET /api/products?category=electronics&minPrice=100
```

### Sorting
```http
GET /api/products?sort=price_asc
```

### Search
```http
GET /api/products?search=laptop
```

---

## ⚠️ Important Notes

1. **All authenticated endpoints require:** `Authorization: Bearer {token}`
2. **Cart operations** work for both logged-in users (userId) and guests (sessionId)
3. **Order creation** locks prices at the moment of purchase
4. **Stock is updated** when order is created (not when added to cart)
5. **Token expires** after 7 days (configurable in JWT_EXPIRE env variable)

---

**Created:** December 2024  
**Version:** 1.0  
**Base URL:** http://localhost:4001/api
