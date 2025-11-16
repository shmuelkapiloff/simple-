# 📋 Server API Endpoints Documentation

## 🔧 **Base URL:** `http://localhost:4001/api`

---

## 🏥 **Health Endpoints**

### **🟢 GET `/health`**
```http
GET /api/health
```
**תיאור:** בדיקת חיות בסיסית של השרת  
**Response:**
```json
{
  "success": true,
  "message": "Server is running!",
  "data": {
    "status": "healthy",
    "timestamp": "2025-11-13T00:31:15.123Z",
    "uptime": "0:05:23"
  }
}
```

### **🔍 GET `/health/detailed`**
```http
GET /api/health/detailed
```
**תיאור:** בדיקה מפורטת של כל הרכיבים  
**Response:**
```json
{
  "success": true,
  "data": {
    "server": "healthy",
    "mongodb": "connected",
    "redis": "connected",
    "timestamp": "2025-11-13T00:31:15.123Z"
  }
}
```

---

## 🛍️ **Product Endpoints**

### **📋 GET `/products`**
```http
GET /api/products
```
**תיאור:** קבלת כל המוצרים הפעילים  
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "sku": "IPHONE15PRO",
      "name": "iPhone 15 Pro",
      "description": "Latest iPhone with Pro features",
      "price": 999,
      "category": "Smartphones",
      "image": "iphone15pro.jpg",
      "featured": true,
      "stock": 50,
      "rating": 4.8,
      "isActive": true,
      "createdAt": "2025-11-01T00:00:00.000Z",
      "updatedAt": "2025-11-01T00:00:00.000Z"
    }
  ]
}
```

### **🔍 GET `/products/:id`**
```http
GET /api/products/507f1f77bcf86cd799439011
```
**תיאור:** קבלת מוצר ספציפי לפי ID  
**Parameters:**
- `id` (string, required) - MongoDB ObjectId של המוצר

**Response Success:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "sku": "IPHONE15PRO",
    "name": "iPhone 15 Pro",
    "description": "Latest iPhone with Pro features",
    "price": 999,
    "category": "Smartphones",
    "image": "iphone15pro.jpg",
    "featured": true,
    "stock": 50,
    "rating": 4.8,
    "isActive": true,
    "createdAt": "2025-11-01T00:00:00.000Z",
    "updatedAt": "2025-11-01T00:00:00.000Z"
  }
}
```

**Response Error (404):**
```json
{
  "success": false,
  "message": "Product not found",
  "errors": []
}
```

---

## 🛒 **Cart Endpoints**

### **🔍 GET `/cart`**
```http
GET /api/cart?sessionId=guest-1762688526749-lc9dle37n
```
**תיאור:** קבלת עגלה נוכחית  
**Query Parameters:**
- `sessionId` (string, required) - מזהה הסשן

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "guest-1762688526749-lc9dle37n",
    "userId": null,
    "items": [
      {
        "_id": "item1",
        "product": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "iPhone 15 Pro",
          "price": 999,
          "image": "iphone15pro.jpg",
          "sku": "IPHONE15PRO"
        },
        "quantity": 2,
        "price": 1998
      }
    ],
    "total": 1998,
    "createdAt": "2025-11-13T00:30:00.000Z",
    "updatedAt": "2025-11-13T00:31:00.000Z"
  }
}
```

### **🔢 GET `/cart/count`**
```http
GET /api/cart/count?sessionId=guest-1762688526749-lc9dle37n
```
**תיאור:** ספירת פריטים בעגלה  
**Query Parameters:**
- `sessionId` (string, required) - מזהה הסשן

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 3
  }
}
```

### **➕ POST `/cart/add`**
```http
POST /api/cart/add
Content-Type: application/json
```
**תיאור:** הוספת פריט לעגלה  
**Request Body:**
```json
{
  "sessionId": "guest-1762688526749-lc9dle37n",
  "productId": "507f1f77bcf86cd799439011",
  "quantity": 2
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Item added to cart",
  "data": {
    "sessionId": "guest-1762688526749-lc9dle37n",
    "items": [...],
    "total": 1998,
    "updatedAt": "2025-11-13T00:31:00.000Z"
  }
}
```

**Response Errors:**
```json
// Missing fields
{
  "success": false,
  "message": "Missing required fields",
  "errors": ["sessionId", "productId", "quantity"]
}

// Product not found
{
  "success": false,
  "message": "Product not found",
  "errors": []
}

// Insufficient stock
{
  "success": false,
  "message": "Insufficient stock",
  "errors": []
}
```

### **📝 PUT `/cart/update`**
```http
PUT /api/cart/update
Content-Type: application/json
```
**תיאור:** עדכון כמות פריט בעגלה  
**Request Body:**
```json
{
  "sessionId": "guest-1762688526749-lc9dle37n",
  "productId": "507f1f77bcf86cd799439011",
  "quantity": 5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cart updated successfully",
  "data": {
    "sessionId": "guest-1762688526749-lc9dle37n",
    "items": [...],
    "total": 4995,
    "updatedAt": "2025-11-13T00:31:00.000Z"
  }
}
```

### **🗑️ DELETE `/cart/remove`**
```http
DELETE /api/cart/remove
Content-Type: application/json
```
**תיאור:** הסרת פריט מעגלה  
**Request Body:**
```json
{
  "sessionId": "guest-1762688526749-lc9dle37n",
  "productId": "507f1f77bcf86cd799439011"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Item removed from cart",
  "data": {
    "sessionId": "guest-1762688526749-lc9dle37n",
    "items": [],
    "total": 0,
    "updatedAt": "2025-11-13T00:31:00.000Z"
  }
}
```

### **🧹 DELETE `/cart/clear`**
```http
DELETE /api/cart/clear
Content-Type: application/json
```
**תיאור:** ניקוי עגלה מלאה  
**Request Body:**
```json
{
  "sessionId": "guest-1762688526749-lc9dle37n"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cart cleared successfully",
  "data": {
    "sessionId": "guest-1762688526749-lc9dle37n",
    "items": [],
    "total": 0,
    "updatedAt": "2025-11-13T00:31:00.000Z"
  }
}
```

---

## 🔄 **Data Flow לפי Endpoint**

### **🛒 Cart Add Flow:**
```
1. POST /api/cart/add
   ↓
2. CartController.addToCart
   ↓ [Logging: 22:31:49 [CartService] → addToCart]
3. CartService.addToCart
   ├── ✅ Product validation (MongoDB)
   ├── 🔍 Get current cart (Redis → MongoDB)
   ├── ➕ Add/update item
   ├── 💰 Calculate total
   ├── ⚡ Update Redis cache (immediate)
   └── ⏰ Schedule MongoDB save (5sec debounce)
   ↓ [Logging: 22:31:49 [CartService] ✅ addToCart (123ms)]
4. Response to client
```

### **🔍 Cart Get Flow:**
```
1. GET /api/cart?sessionId=xxx
   ↓
2. CartController.getCart
   ↓ [Logging: 22:31:49 [CartService] → getCart]
3. CartService.getCart
   ├── ⚡ Try Redis first (~5ms)
   ├── 🔍 If not found → MongoDB (~50ms)
   ├── 📥 Cache result in Redis
   └── 🔄 Populate product data
   ↓ [Logging: 22:31:49 [CartService] ✅ getCart (55ms)]
4. Response to client
```

---

## 📊 **Performance Expectations**

| Endpoint | Cache Hit | Cache Miss | Error Rate |
|----------|-----------|------------|------------|
| GET `/health` | ~5ms | ~5ms | <0.1% |
| GET `/products` | ~50ms | ~100ms | <1% |
| GET `/cart` | ~5ms | ~50ms | <1% |
| POST `/cart/add` | ~30ms | ~80ms | <2% |
| PUT `/cart/update` | ~25ms | ~70ms | <2% |
| DELETE `/cart/remove` | ~20ms | ~60ms | <1% |

---

## 🛡️ **Error Handling**

### **Common Error Response Format:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["specific", "error", "details"]
}
```

### **HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (missing/invalid data)
- `404` - Not Found (product/cart not found)
- `500` - Internal Server Error

---

## 🔍 **Debugging בזמן אמת**

רוצה לראות מה קורה? הבט בטרמינל השרת:

```bash
22:31:49 [CartService] → getCart
22:31:49 [CartService] ✅ getCart (55ms)

22:31:50 [CartService] → addToCart  
22:31:50 [CartService] ✅ addToCart (123ms)
```

**כל קריאה מתועדת עם זמני תגובה מדויקים!** 🎯