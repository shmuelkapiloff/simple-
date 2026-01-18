# 📋 Server API Endpoints Documentation

## 🔧 **Base URL:** `http://localhost:4001/api`

---

## 🏥 **Health Endpoints**

### **🟢 GET `/health`**
```http
GET /api/health
```
**תיאור:** בדיקת חיות ומצב חיבורי Mongo/Redis  \
**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "mongodb": "connected",
    "redis": "connected",
    "uptime": 523.12
  }
}
```

### **🔍 GET `/health/ping`**
```http
GET /api/health/ping
```
**תיאור:** פינג מהיר לבדיקת זמינות השרת  
**Response:**
```json
{
  "success": true,
  "message": "pong",
  "data": {
    "time": 1700000000000
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

## 🔐 **Authentication Endpoints**

> כל ה-endpoints תחת `/api/auth`

### **🆕 POST `/auth/register`**
```http
POST /api/auth/register
Content-Type: application/json
```
**Body:** `{ "name": "John Doe", "email": "john@example.com", "password": "secret123" }`  
**Response:** יוצר משתמש חדש ומחזיר JWT (cookie) + user

### **🔑 POST `/auth/login`**
```http
POST /api/auth/login
Content-Type: application/json
```
**Body:** `{ "email": "john@example.com", "password": "secret123" }`  
**Response:** מתחבר ומחזיר JWT (cookie) + user

### **🚪 POST `/auth/logout`** (⚠️ דורש התחברות)
```http
POST /api/auth/logout
```
**תיאור:** מוחק את ה-cookie של ה-JWT ומנתק

### **✅ GET `/auth/verify`** (⚠️ דורש התחברות)
```http
GET /api/auth/verify
```
**תיאור:** בודק שה-Token תקף ומחזיר פרטי משתמש בסיסיים

### **👤 GET `/auth/profile`** (⚠️ דורש התחברות)
```http
GET /api/auth/profile
```
**תיאור:** מחזיר פרופיל מלא של המשתמש

### **✏️ PUT `/auth/profile`** (⚠️ דורש התחברות)
```http
PUT /api/auth/profile
Content-Type: application/json
```
**Body נפוץ:** `{ "name": "New Name" }`  
**תיאור:** עדכון פרטים בסיסיים של המשתמש

### **🧠 POST `/auth/forgot-password`**
```http
POST /api/auth/forgot-password
Content-Type: application/json
```
**Body:** `{ "email": "john@example.com" }`  
**תיאור:** שולח מייל לשחזור סיסמה; בסביבת פיתוח מוחזר גם `resetToken` בתגובה לנוחות

### **🔄 POST `/auth/reset-password/:token`**
```http
POST /api/auth/reset-password/<token>
Content-Type: application/json
```
**Body:** `{ "password": "newStrongPass123" }`  
**תיאור:** מחליף סיסמה באמצעות token תקף

---

## 🛒 **Cart Endpoints** (⚠️ **דורש אימות - Authentication Required**)

> **הערה חשובה:** כל endpoints העגלה דורשים JWT token בכותרת Authorization.  
> אין עוד מצב אורח - חובה להיות מחובר כדי להשתמש בעגלה.

### **🔍 GET `/cart`**
```http
GET /api/cart
Authorization: Bearer <JWT_TOKEN>
```
**תיאור:** קבלת עגלה נוכחית של המשתמש המחובר  
**Headers:**
- `Authorization: Bearer <token>` (required) - JWT token

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439012",
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

**Response Error (401):**
```json
{
  "success": false,
  "message": "Authentication required",
  "errors": []
}
```

### **🔢 GET `/cart/count`**
```http
GET /api/cart/count
Authorization: Bearer <JWT_TOKEN>
```
**תיאור:** ספירת פריטים בעגלה של המשתמש  
**Headers:**
- `Authorization: Bearer <token>` (required)

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
Authorization: Bearer <JWT_TOKEN>
```
**תיאור:** הוספת פריט לעגלה  
**Headers:**
- `Authorization: Bearer <token>` (required)

**Request Body:**
```json
{
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
    "userId": "507f1f77bcf86cd799439012",
    "items": [...],
    "total": 1998,
    "updatedAt": "2025-11-13T00:31:00.000Z"
  }
}
```

**Response Errors:**
```json
// Not authenticated
{
  "success": false,
  "message": "Authentication required",
  "errors": []
}

// Missing fields
{
  "success": false,
  "message": "Missing required fields",
  "errors": ["productId", "quantity"]
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
Authorization: Bearer <JWT_TOKEN>
```
**תיאור:** עדכון כמות פריט בעגלה  
**Headers:**
- `Authorization: Bearer <token>` (required)

**Request Body:**
```json
{
  "productId": "507f1f77bcf86cd799439011",
  "quantity": 5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Quantity updated",
  "data": {
    "userId": "507f1f77bcf86cd799439012",
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
Authorization: Bearer <JWT_TOKEN>
```
**תיאור:** הסרת פריט מעגלה  
**Headers:**
- `Authorization: Bearer <token>` (required)

**Request Body:**
```json
{
  "productId": "507f1f77bcf86cd799439011"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Item removed from cart",
  "data": {
    "userId": "507f1f77bcf86cd799439012",
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
Authorization: Bearer <JWT_TOKEN>
```
**תיאור:** ניקוי עגלה מלאה  
**Headers:**
- `Authorization: Bearer <token>` (required)

**Request Body:**
```json
{}
```

**Response:**
```json
{
  "success": true,
  "message": "Cart cleared",
  "data": {
    "userId": "507f1f77bcf86cd799439012",
    "items": [],
    "total": 0,
    "updatedAt": "2025-11-13T00:31:00.000Z"
  }
}
```

---

## 📦 **Order Endpoints**

> כל ה-endpoints תחת `/api/orders`

### **Order Statuses (סטטוסים זמינים):**
```
pending_payment    ← הזמנה יוצרה, בהמתנה לתשלום
confirmed          ← תשלום אומת דרך webhook ✅
processing         ← בהכנה לשיגור
shipped            ← משוגר
delivered          ← הגיע ליעד
cancelled          ← בוטלה
```

### **🛒 POST `/` - Create Order** (⚠️ דורש התחברות)
יוצר הזמנה מהעגלה **עם secure payment flow:**

1. ✅ יוצר order עם status `"pending_payment"`
2. ✅ יוצר payment intent ב-Stripe
3. ✅ מחזיר `clientSecret` ו-`checkoutUrl` ל-client
4. ⏳ Client משלם דרך Stripe Checkout
5. 🔔 Stripe שולח webhook -> Server מעדכן order ל-`"confirmed"`
6. 🎯 Stock מצטמצם **רק אחרי אישור התשלום**

**Request:**
```json
{
  "shippingAddress": {
    "street": "Herzl 10",
    "city": "Tel Aviv",
    "postalCode": "61000",
    "country": "Israel"
  },
  "billingAddress": {
    "street": "Dizengoff 50",
    "city": "Tel Aviv",
    "postalCode": "62000",
    "country": "Israel"
  },
  "paymentMethod": "stripe",
  "notes": "Ring the bell"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "order": {
      "_id": "507f1f77bcf86cd799439050",
      "orderNumber": "ORD-2026-001",
      "user": "507f1f77bcf86cd799439012",
      "status": "pending_payment",
      "paymentStatus": "pending",
      "paymentIntentId": "pi_stripe123",
      "paymentProvider": "stripe",
      "totalAmount": 1998,
      "items": [...],
      "shippingAddress": {...},
      "createdAt": "2026-01-18T12:00:00Z"
    },
    "payment": {
      "clientSecret": "pi_stripe123_secret",
      "checkoutUrl": "https://checkout.stripe.com/..."
    }
  },
  "message": "Order created. Complete payment to confirm."
}
```

### **📋 GET `/` - Get My Orders** (⚠️ דורש התחברות)
מחזיר את כל ההזמנות של המשתמש, אפשרי סינון `?status=`

**Query params:**
- `status` - filter by status (pending_payment, confirmed, processing, etc.)

### **🔍 GET `/:orderId` - Get Order Details** (⚠️ דורש התחברות)
פרטי הזמנה ספציפית

### **🚫 POST `/:orderId/cancel` - Cancel Order** (⚠️ דורש התחברות)
ביטול הזמנה פתוחה (רק אם `status` הוא `pending_payment`)

### **📍 GET `/track/:orderId` - Track Order** (ציבורי)
מעקב סטטוס ללא צורך ב-Token - מחזיר:
- סטטוס הזמנה
- היסטוריית עדכונים
- תאריך משוער הגעה



---

## 💳 **Payment Endpoints (Stripe Integration)**

> כל ה-endpoints תחת `/api/payments`

### **🔐 POST `/webhook` - Stripe Webhook** (ציבורי - אין auth)
קבלת webhook מ-Stripe כשתשלום הצליח/נכשל. **אין צורך בטוקן!**

**Event Types:**
- `payment_intent.succeeded` - ✅ התשלום הצליח
- `payment_intent.payment_failed` - ❌ התשלום נכשל

**When Succeeded:**
```
1. Webhook received
2. Order status: pending_payment → confirmed ✅
3. Stock reduced לכל מוצר
4. Cart cleared
5. paymentVerifiedAt = now
```

**Request (from Stripe):**
```json
{
  "id": "evt_1234567890",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_stripe123",
      "status": "succeeded"
    }
  }
}
```

**Response (200 OK):**
```json
{
  "received": true
}
```

### **💰 GET `/:orderId/status` - Get Payment Status** (⚠️ דורש התחברות)
קבלת סטטוס תשלום להזמנה

**Response:**
```json
{
  "success": true,
  "data": {
    "orderPaymentStatus": "paid|pending|failed",
    "paymentStatus": "succeeded|pending|failed",
    "paymentId": "507f1f77bcf86cd799439051",
    "providerPaymentId": "pi_stripe123",
    "clientSecret": "pi_stripe123_secret",
    "checkoutUrl": "https://checkout.stripe.com/..."
  }
}
```

---

## 🏠 **Address Endpoints** (⚠️ דורש התחברות)

> כל ה-endpoints תחת `/api/addresses`

- **GET /** — כל הכתובות של המשתמש (ממוינות לפי ברירת מחדל קודם).
- **GET `/default`** — הכתובת ברירת מחדל.
- **GET `/:addressId`** — פרטי כתובת.
- **POST /** — יצירת כתובת: חובה `street`, `city`, `postalCode`; אפשרי `label` (`home`/`work`/`other`), `country`, `isDefault`.
- **PUT `/:addressId`** — עדכון כתובת קיימת.
- **DELETE `/:addressId`** — מחיקת כתובת.
- **POST `/:addressId/set-default`** — סימון כברירת מחדל (מסיר ברירת מחדל קודמת אוטומטית).

---

## 🛠️ **Admin Endpoints** (⚠️ דורש `admin` role)

> כל ה-endpoints תחת `/api/admin`

- **Products:** `GET /products`, `POST /products`, `PUT /products/:id`, `DELETE /products/:id` (מחיקה רכה).
- **Users:** `GET /users`, `PUT /users/:id/role`.
- **Orders:** `GET /orders`, `PUT /orders/:id/status`.
- **Stats:** `GET /stats/summary` — סיכום מכירות, משתמשים והזמנות.

---

## 🔄 **Data Flow לפי Endpoint**

### **🛒 Order Creation Flow (Secure Payment):**
```
1. POST /api/orders + JWT Token + shippingAddress
   ↓
2. requireAuth middleware (validates token)
   ↓
3. OrderController.createOrder
   ├── Validate cart has items
   ├── Validate stock available
   ├── Create order with status="pending_payment"
   ├── Create payment intent via Stripe
   └── Return order + clientSecret
   ↓
4. Client receives: order (status=pending_payment) + clientSecret
   ↓
5. Client sends clientSecret → Stripe Checkout
   ↓
6. Customer completes payment on Stripe
   ↓
7. Stripe sends webhook POST /api/payments/webhook
   ├── Finds order by paymentIntentId
   ├── Updates order status: pending_payment → confirmed ✅
   ├── Reduces stock for all items
   ├── Clears cart
   └── Sets paymentVerifiedAt = now
   ↓
8. Order is now confirmed and ready to ship!
```

### **🛒 Cart Add Flow (Auth Required):**
```
1. POST /api/cart/add + JWT Token
   ↓
2. requireAuth middleware (validates token)
   ↓
3. CartController.addToCart
   ↓ [Logging: 22:31:49 [CartService] → addToCart]
3. CartService.addToCart
   ├── ✅ Product validation (MongoDB)
   ├── 🔍 Get current cart by userId (Redis → MongoDB)
   ├── ➕ Add/update item
   ├── 💰 Calculate total
   ├── ⚡ Update Redis cache (immediate)
   └── ⏰ Schedule MongoDB save (5sec debounce)
   ↓ [Logging: 22:31:49 [CartService] ✅ addToCart (123ms)]
4. Response to client
```

### **🔍 Cart Get Flow (Auth Required):**
```
1. GET /api/cart + JWT Token
   ↓
2. requireAuth middleware (validates token, sets userId)
   ↓
3. CartController.getCart
   ↓ [Logging: 22:31:49 [CartService] → getCart]
4. CartService.getCart(userId)
   ├── ⚡ Try Redis first (~5ms)
   ├── 🔍 If not found → MongoDB (~50ms)
   ├── 📥 Cache result in Redis
   └── 🔄 Populate product data
   ↓ [Logging: 22:31:49 [CartService] ✅ getCart (55ms)]
5. Response to client
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