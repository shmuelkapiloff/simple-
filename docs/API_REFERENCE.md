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

> **💾 Cache Architecture:** העגלה משתמשת ב-**dual-layer caching**:  
> - **Redis** - קריאות מהירות (~5ms), cache חם לכל פעולות GET  
> - **MongoDB** - persistence מלא, עדכונים עם debounce (5 שניות)  
> - **CartService** - מנהל סנכרון אוטומטי בין שתי השכבות  
> כל פעולת ניקוי/עדכון מוחקת מ-**Redis וגם MongoDB** יחד!

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
- `checkout.session.completed` - ⏳ סשן תשלום הושלם (מגיע ראשון, מחזיר status "pending")
- `payment_intent.succeeded` - ✅ התשלום הצליח (מפעיל fulfillment)
- `payment_intent.payment_failed` - ❌ התשלום נכשל

**🔍 Payment Lookup Strategy (Multi-Fallback):**
```
1. חיפוש לפי paymentIntentId (pi_xxx)
2. חיפוש לפי meta.payment_intent (backup)
3. חיפוש לפי metadata.orderId (מ-Payment Intent)
→ אם נמצא, ממשיך ל-fulfillment
```

**When Payment Succeeded (Fulfillment Flow):**
```
1. Webhook received (payment_intent.succeeded)
2. Find payment by PI ID + metadata fallback
3. ✅ Mark order.fulfilled = true
4. 🔒 Status downgrade prevention:
   - אם order.fulfilled = true → לא לעדכן status
   - אם paymentStatus = "paid" → לא לעדכן status
   - מונע checkout.session.completed מלשנות "paid" → "pending"
5. 📦 Stock reduced לכל מוצר (MongoDB transaction + fallback)
6. 🛒 Cart cleared (Redis + MongoDB via CartService)
7. ⏰ paymentVerifiedAt = now
8. Order status: pending_payment → confirmed ✅
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
   ├── Create payment intent via Stripe with metadata:
   │   • orderId: MongoDB ObjectId
   │   • userId: User ID
   │   • orderNumber: ORD-2026-XXX
   └── Return order + clientSecret + checkoutUrl
   ↓
4. Client receives: order (status=pending_payment) + payment data
   ↓
5. Client redirects to Stripe Checkout (checkoutUrl)
   ↓
6. Customer completes payment on Stripe
   ↓
7. Stripe sends webhooks (in order):
   
   🔔 Webhook #1: checkout.session.completed
   ├── Returns status="pending" (doesn't trigger fulfillment)
   └── Waits for payment_intent webhook
   
   🔔 Webhook #2: payment_intent.succeeded
   ├── 🔍 Finds order (3 fallback strategies):
   │   1. paymentIntentId
   │   2. meta.payment_intent
   │   3. metadata.orderId from Payment Intent
   ├── ✅ Marks order.fulfilled = true
   ├── 🔒 Status downgrade protection:
   │   • Checks if order.fulfilled = true
   │   • Checks if paymentStatus = "paid"
   │   → Prevents later webhooks from downgrading status
   ├── 📦 Stock reduction (MongoDB transaction with fallback):
   │   • Tries transaction (if replica set available)
   │   • Falls back to sequential ops (standalone MongoDB)
   ├── 🛒 Cart cleared via CartService:
   │   • Deletes from Redis cache
   │   • Deletes from MongoDB
   │   • Ensures client sees empty cart immediately
   ├── Updates order status: pending_payment → confirmed ✅
   └── Sets paymentVerifiedAt = now
   ↓
8. Order is now confirmed, stock reduced, cart empty!
9. Future webhooks (if any) won't downgrade status ✅
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

## �️ **Client Implementation Guide (React/TypeScript)**

### **Step 1️⃣: Validate Cart**
בדוק שיש items בעגלה לפני יצירת order:

```typescript
const { data: cart } = await api.getCart();

if (!cart || cart.items.length === 0) {
  throw new Error("🛒 Cart is empty - add items before checkout");
}

console.log(`✅ Cart has ${cart.items.length} items, total: ${cart.total}`);
```

### **Step 2️⃣: Create Order**
צור order דרך ה-API עם shipping address:

```typescript
const shippingAddress = {
  street: "הרצל 10",
  city: "תל אביב",
  postalCode: "61000",
  country: "Israel"
};

const response = await fetch('http://localhost:4001/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}` // ⚠️ חובה!
  },
  body: JSON.stringify({ shippingAddress })
});

if (!response.ok) {
  throw new Error(`❌ Order creation failed: ${response.statusText}`);
}

const { data } = await response.json();
const { order, payment } = data;

console.log(`✅ Order created: ${order.orderNumber}`);
console.log(`📦 Status: ${order.status} (pending_payment)`);
console.log(`💳 Ready for payment!`);
```

**Response you get back:**
```json
{
  "order": {
    "_id": "507f...",
    "orderNumber": "ORD-2026-001",
    "status": "pending_payment",
    "totalAmount": 1998
  },
  "payment": {
    "clientSecret": "pi_xxx_secret",
    "checkoutUrl": "https://checkout.stripe.com/..."
  }
}
```

### **Step 3️⃣: Send to Stripe**

#### **Option A - Redirect (Easiest)** ✅ מומלץ
```typescript
// User clicks "Pay Now" → redirect to Stripe Checkout
window.location.href = payment.checkoutUrl;
// Stripe will handle everything, then redirect back to you
```

#### **Option B - Embed Stripe Elements** (More Control)
```typescript
import { loadStripe } from '@stripe/js';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripe = await loadStripe('pk_test_YOUR_KEY');

const handlePayment = async () => {
  const { error, paymentIntent } = await stripe.confirmCardPayment(
    payment.clientSecret,
    {
      payment_method: {
        card: cardElement,
        billing_details: { name: 'Customer Name' }
      }
    }
  );

  if (error) {
    console.error('❌ Payment failed:', error.message);
    return;
  }

  if (paymentIntent.status === 'succeeded') {
    console.log('✅ Payment succeeded! Waiting for server confirmation...');
  }
};
```

### **Step 4️⃣: Poll Payment Status**
המתן עד שה-server יאשר את התשלום דרך webhook:

```typescript
const pollPaymentStatus = () => {
  const maxAttempts = 60; // 60 seconds
  let attempts = 0;

  const interval = setInterval(async () => {
    attempts++;

    try {
      const res = await fetch(
        `http://localhost:4001/api/payments/${order._id}/status`,
        {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }
      );

      const { data } = await res.json();
      const { orderPaymentStatus } = data;

      if (orderPaymentStatus === 'paid') {
        console.log('🎉 Payment confirmed by server!');
        clearInterval(interval);
        
        // ✅ Cart is already cleared by server (Redis + MongoDB)
        // ✅ No need to manually clear cart on client!
        // ✅ Next GET /api/cart will return empty cart
        
        navigate(`/orders/${order._id}`);
      } else if (attempts >= maxAttempts) {
        console.warn('⏱️ Payment confirmation timeout - check manually');
        clearInterval(interval);
      } else {
        console.log(`⏳ Waiting for payment confirmation... (${attempts}s)`);
      }
    } catch (error) {
      console.error('❌ Status check failed:', error);
    }
  }, 1000); // Check every 1 second
};

// Start polling after payment
pollPaymentStatus();
```

**🛒 Important: Cart Auto-Clear Behavior**
```typescript
// ❌ DON'T manually clear cart after payment:
// await api.clearCart(); // Not needed!

// ✅ Server automatically clears cart when payment succeeds:
// 1. payment_intent.succeeded webhook arrives
// 2. Server calls CartService.clearCart(userId)
// 3. Deletes from Redis cache (immediate)
// 4. Deletes from MongoDB (persistent)
// 5. Client's next GET /api/cart returns empty

// ✅ Simply refetch cart to show empty state:
const { data: cart } = await api.getCart();
console.log(cart.items.length); // 0
```

### **Step 5️⃣: Handle Errors**

```typescript
const createOrderWithErrorHandling = async () => {
  try {
    // 1. Get cart
    const { data: cart } = await api.getCart();
    if (!cart?.items.length) {
      throw new Error("🛒 Your cart is empty");
    }

    // 2. Create order
    const orderResponse = await fetch('http://localhost:4001/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ shippingAddress })
    });

    if (!orderResponse.ok) {
      const { message } = await orderResponse.json();
      throw new Error(`📦 ${message}`);
    }

    const { data: { order, payment } } = await orderResponse.json();

    // 3. Send to Stripe
    window.location.href = payment.checkoutUrl;

  } catch (error) {
    console.error('❌ Checkout error:', error.message);
    // Show toast/alert to user
    setError(error.message);
  }
};
```

### **Complete Flow Example** 🚀

```typescript
// CheckoutPage.tsx
import React, { useState } from 'react';

export const CheckoutPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { authToken } = useAuth();

  const handleCheckout = async () => {
    try {
      setIsLoading(true);

      // ✅ Step 1: Get cart
      const cartResponse = await fetch('http://localhost:4001/api/cart', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const { data: cart } = await cartResponse.json();

      if (!cart?.items.length) {
        alert('🛒 Cart is empty');
        return;
      }

      // ✅ Step 2: Create order
      const orderResponse = await fetch(
        'http://localhost:4001/api/orders',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            shippingAddress: {
              street: formData.street,
              city: formData.city,
              postalCode: formData.zip,
              country: 'Israel'
            }
          })
        }
      );
      const { data: { order, payment } } = await orderResponse.json();

      // ✅ Step 3: Redirect to Stripe
      window.location.href = payment.checkoutUrl;

    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>Checkout</h1>
      <button onClick={handleCheckout} disabled={isLoading}>
        {isLoading ? '⏳ Processing...' : '💳 Pay Now'}
      </button>
    </div>
  );
};
```

---

## �📊 **Performance Expectations**

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