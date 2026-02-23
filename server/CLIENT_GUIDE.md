# 📘 מדריך לפיתוח צד לקוח — Simple Shop API

> מדריך מלא למתכנת Frontend לבניית חנות אונליין מול ה-Backend.
>
> **Base URL:** `http://localhost:4001`
> **Swagger UI:** `http://localhost:4001/api/docs`
> **OpenAPI JSON:** `http://localhost:4001/api/docs.json`

---

## 📑 תוכן עניינים

1. [מבנה כללי](#1-מבנה-כללי)
2. [אימות (Authentication)](#2-אימות-authentication)
3. [מוצרים (Products)](#3-מוצרים-products)
4. [עגלת קניות (Cart)](#4-עגלת-קניות-cart)
5. [כתובות (Addresses)](#5-כתובות-addresses)
6. [הזמנות (Orders)](#6-הזמנות-orders)
7. [תשלומים (Payments) — Stripe](#7-תשלומים-payments--stripe)
8. [פאנל ניהול (Admin)](#8-פאנל-ניהול-admin)
9. [TypeScript Types](#9-typescript-types)
10. [טיפול בשגיאות](#10-טיפול-בשגיאות)
11. [Flow מלא — מכניסה ועד תשלום](#11-flow-מלא--מכניסה-ועד-תשלום)
12. [דפים מומלצים](#12-דפים-מומלצים)

---

## 1. מבנה כללי

### פורמט תשובה (Response Envelope)

**כל** תשובה מהשרת מגיעה בפורמט אחיד:

```json
// ✅ הצלחה
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}

// ❌ שגיאה
{
  "success": false,
  "message": "Error description",
  "errors": [{ ... }]  // Optional: Zod validation errors
}
```

### Headers בסיסיים

```ts
const headers = {
  'Content-Type': 'application/json',
};

// לנתיבים מוגנים — הוסף:
const authHeaders = {
  ...headers,
  'Authorization': `Bearer ${token}`,
};
```

### HTTP Status Codes

| קוד | משמעות |
|------|--------|
| `200` | הצלחה |
| `201` | נוצר בהצלחה (register, create order, create address) |
| `204` | נמחק בהצלחה (ללא body) |
| `400` | שגיאת validation (שדה חסר / לא תקין) |
| `401` | לא מחובר / token לא תקין |
| `403` | אין הרשאה (לא admin) |
| `404` | משאב לא נמצא |
| `409` | כפילות (email כבר רשום) |
| `423` | חשבון נעול (יותר מדי ניסיונות כושלים) |
| `429` | Rate limit — יותר מדי בקשות |
| `500` | שגיאת שרת |

---

## 2. אימות (Authentication)

> **Base:** `/api/auth`

### 2.1 הרשמה

```
POST /api/auth/register
```

```ts
// Request
{
  "name": "שמואל",         // min 2 chars
  "email": "sam@mail.com",  // valid email
  "password": "123456"      // min 6 chars
}

// Response (201)
{
  "success": true,
  "data": {
    "user": {
      "_id": "665a...",
      "name": "שמואל",
      "email": "sam@mail.com",
      "role": "user",
      "isActive": true,
      "lastLogin": "2026-02-23T10:00:00.000Z",
      "createdAt": "2026-02-23T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "message": "User registered successfully"
}
```

> ⚠️ אם המייל כבר קיים → `409 Conflict`

### 2.2 התחברות

```
POST /api/auth/login
```

```ts
// Request
{
  "email": "sam@mail.com",
  "password": "123456"
}

// Response (200)
{
  "success": true,
  "data": {
    "user": { ... },    // Same as register
    "token": "eyJ..."
  },
  "message": "Login successful"
}
```

> 🔒 **נעילת חשבון:** אחרי 5 ניסיונות כושלים, החשבון ננעל ל-15 דקות (`423`).
> התשובה תכלול כמה ניסיונות נשארו: `"3 attempts remaining before account lockout."`

### 2.3 שמירת ה-Token

```ts
// שמור את הטוקן ב-localStorage או ב-state management
localStorage.setItem('token', data.token);

// Helper function
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
}
```

### 2.4 אימות Token

```
GET /api/auth/verify          🔒 Auth
```

```ts
// Response (200) — Token תקין
{
  "success": true,
  "data": {
    "user": { "_id": "...", "name": "...", "email": "...", "role": "user" }
  }
}

// Response (401) — Token לא תקין או חסר
```

> 💡 קרא לזה כשהאפליקציה נטענת כדי לבדוק אם המשתמש עדיין מחובר.

### 2.5 פרופיל

```
GET /api/auth/profile         🔒 Auth
PUT /api/auth/profile         🔒 Auth
```

```ts
// PUT Request — עדכון פרופיל
{
  "name": "שם חדש",    // optional
  "email": "new@mail.com"  // optional
}
// לפחות שדה אחד חייב
```

### 2.6 סיסמאות

```
POST /api/auth/forgot-password      (public)
POST /api/auth/reset-password/:token (public)
POST /api/auth/change-password       🔒 Auth
```

```ts
// forgot-password
{ "email": "sam@mail.com" }

// reset-password/:token
{
  "password": "newPass123",
  "confirmPassword": "newPass123"
}

// change-password (authenticated)
{
  "currentPassword": "oldPass123",
  "newPassword": "newPass456",
  "confirmPassword": "newPass456"
}
```

### 2.7 יציאה

```
POST /api/auth/logout     🔒 Auth
```

> בצד לקוח — מחק את ה-token מ-localStorage.

---

## 3. מוצרים (Products)

> **Base:** `/api/products` — **כל הנתיבים ציבוריים** (לא צריך token)

### 3.1 רשימת מוצרים (עם פילטרים)

```
GET /api/products
```

| Query Param | Type | תיאור |
|-------------|------|--------|
| `category` | string | סנן לפי קטגוריה |
| `minPrice` | number | מחיר מינימלי |
| `maxPrice` | number | מחיר מקסימלי |
| `search` | string | חיפוש חופשי בשם/תיאור |
| `featured` | boolean | `true` = רק מוצרים מומלצים |
| `sort` | string | מיון (`price_asc`, `price_desc`, `newest`, `rating`) |

```ts
// דוגמה
const res = await fetch('/api/products?category=electronics&minPrice=50&sort=price_asc');
const { data } = await res.json();
// data = [{ _id, sku, name, description, price, stock, category, image, featured, rating }, ...]
```

### 3.2 מוצר בודד

```
GET /api/products/:id
```

```ts
const res = await fetch(`/api/products/${productId}`);
const { data } = await res.json();
// data = { _id, sku, name, description, price, stock, category, image, featured, rating, ... }
```

### 3.3 רשימת קטגוריות

```
GET /api/products/categories/list
```

```ts
const res = await fetch('/api/products/categories/list');
const { data } = await res.json();
// data = ["electronics", "clothing", "books", ...]
```

---

## 4. עגלת קניות (Cart)

> **Base:** `/api/cart` — **כל הנתיבים דורשים 🔒 Auth**

### 4.1 קבלת העגלה

```
GET /api/cart
```

```ts
// Response
{
  "success": true,
  "data": {
    "_id": "...",
    "userId": "...",
    "items": [
      {
        "product": {
          "_id": "prod123",
          "name": "מקלדת",
          "price": 149.90,
          "image": "https://...",
          "stock": 10
        },
        "quantity": 2,
        "lockedPrice": null
      }
    ],
    "total": 299.80
  }
}
```

> 💡 ה-`product` מוחזר כאובייקט מלא (populated) — לא צריך לקרוא שוב ל-products.

### 4.2 הוספה לעגלה

```
POST /api/cart/add
```

```ts
// Request
{
  "productId": "665a1234...",  // ObjectId של המוצר
  "quantity": 1                 // מינימום 1
}
```

### 4.3 עדכון כמות

```
PUT /api/cart/update
```

```ts
// Request
{
  "productId": "665a1234...",
  "quantity": 3                // הכמות החדשה (לא תוספת)
}
```

### 4.4 הסרת פריט

```
DELETE /api/cart/remove
```

```ts
// Request (body in DELETE!)
{
  "productId": "665a1234..."
}
```

### 4.5 ניקוי עגלה

```
DELETE /api/cart/clear
```

> מחזיר: `{ userId, items: [], total: 0 }`

### 4.6 ספירת פריטים (לאייקון עגלה)

```
GET /api/cart/count
```

```ts
// Response
{ "success": true, "data": { "count": 5 } }
```

> 💡 מתאים לתצוגת badge על אייקון העגלה ב-Navbar.

---

## 5. כתובות (Addresses)

> **Base:** `/api/addresses` — **כל הנתיבים דורשים 🔒 Auth**

### 5.1 CRUD

```
GET    /api/addresses              — כל הכתובות
GET    /api/addresses/:addressId   — כתובת בודדת
POST   /api/addresses              — יצירת כתובת חדשה
PUT    /api/addresses/:addressId   — עדכון כתובת
DELETE /api/addresses/:addressId   — מחיקת כתובת (204)
```

```ts
// POST / PUT Request
{
  "street": "רחוב הרצל 5",     // required
  "city": "תל אביב",            // required
  "state": "מרכז",              // optional
  "postalCode": "6120101",      // required
  "country": "ישראל",           // required
  "isDefault": true             // optional
}
```

### 5.2 כתובת ברירת מחדל

```
GET  /api/addresses/default                     — קבלת כתובת ברירת מחדל
POST /api/addresses/:addressId/set-default      — הגדרת כתובת כברירת מחדל
```

> 💡 אפשר לטעון אוטומטית את כתובת ברירת המחדל בדף ה-Checkout.

---

## 6. הזמנות (Orders)

> **Base:** `/api/orders`

### 6.1 יצירת הזמנה ✨ (הנקודה החשובה ביותר)

```
POST /api/orders     🔒 Auth
```

**Headers חובה:**
```
Authorization: Bearer <token>
Content-Type: application/json
Idempotency-Key: <UUID>           ← חובה! מפתח ייחודי למניעת כפילויות
```

```ts
// Request
{
  "shippingAddress": {
    "street": "רחוב הרצל 5",
    "city": "תל אביב",
    "state": "מרכז",              // optional
    "postalCode": "6120101",
    "country": "ישראל"
  },
  "billingAddress": { ... },        // optional, same format
  "paymentMethod": "stripe",        // default: "stripe"
  "notes": "נא לעטוף כמתנה"       // optional
}
```

> ⚠️ **Idempotency-Key** — צור UUID חדש לכל הזמנה:
> ```ts
> const idempotencyKey = crypto.randomUUID();
> ```

```ts
// Response (201) — הזמנה נוצרה + payment intent נוצר אוטומטית
{
  "success": true,
  "data": {
    "order": {
      "_id": "665b...",
      "orderNumber": "ORD-00042",
      "user": "665a...",
      "items": [
        {
          "product": "665a...",
          "name": "מקלדת",
          "price": 149.90,
          "quantity": 2,
          "image": "https://..."
        }
      ],
      "totalAmount": 299.80,
      "status": "pending_payment",
      "paymentStatus": "pending",
      "paymentProvider": "stripe",
      "paymentIntentId": "cs_test_...",
      "shippingAddress": { ... },
      "trackingHistory": [
        { "status": "pending_payment", "timestamp": "...", "message": "Order created..." }
      ]
    },
    "payment": {
      "clientSecret": null,
      "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_...",
      "status": "pending"
    }
  },
  "message": "Order created. Complete payment to confirm."
}
```

> 🎯 **מה לעשות עם התשובה:**
> ```ts
> const { order, payment } = response.data;
> // redirect המשתמש לדף התשלום של Stripe:
> window.location.href = payment.checkoutUrl;
> ```

### 6.2 רשימת הזמנות

```
GET /api/orders                 🔒 Auth
GET /api/orders?status=pending  🔒 Auth (עם פילטר)
```

```ts
// Response
{
  "success": true,
  "data": {
    "orders": [
      {
        "_id": "...",
        "orderNumber": "ORD-00042",
        "totalAmount": 299.80,
        "status": "confirmed",
        "paymentStatus": "paid",
        "createdAt": "..."
      }
    ]
  }
}
```

**סטטוסים אפשריים:**
| status | משמעות |
|--------|--------|
| `pending` | ממתין |
| `pending_payment` | ממתין לתשלום |
| `confirmed` | אושר (תשלום התקבל) |
| `processing` | בעיבוד/הכנה |
| `shipped` | נשלח |
| `delivered` | הגיע |
| `cancelled` | בוטל |

### 6.3 הזמנה בודדת

```
GET /api/orders/:orderId    🔒 Auth
```

### 6.4 מעקב הזמנה (ציבורי!)

```
GET /api/orders/track/:orderId    (ללא auth)
```

```ts
// Response
{
  "success": true,
  "data": {
    "orderNumber": "ORD-00042",
    "status": "shipped",
    "trackingHistory": [
      { "status": "pending_payment", "timestamp": "...", "message": "Order created" },
      { "status": "confirmed", "timestamp": "...", "message": "Payment confirmed" },
      { "status": "shipped", "timestamp": "...", "message": "Shipped via DHL" }
    ],
    "estimatedDelivery": "2026-02-28T00:00:00.000Z"
  }
}
```

> 💡 אפשר לשתף קישור מעקב בלי שהמשתמש יהיה מחובר.

### 6.5 ביטול הזמנה

```
POST /api/orders/:orderId/cancel    🔒 Auth
```

---

## 7. תשלומים (Payments) — Stripe

> **Base:** `/api/payments`

### 7.1 Flow מלא של תשלום

```
┌─────────────────┐
│   צד לקוח       │
│                 │
│ 1. POST /orders │──────────→ שרת יוצר Order + Checkout Session
│                 │←──────────  { checkoutUrl: "https://checkout.stripe.com/..." }
│                 │
│ 2. redirect     │──────────→ דף תשלום של Stripe
│    window.      │
│    location.    │
│    href = url   │
│                 │
│ 3. משתמש משלם   │──────────→ Stripe מעבד את הכרטיס
│                 │
│ 4. redirect     │←──────────  Stripe מחזיר ל: /checkout?payment=success
│    back to app  │
│                 │
│ 5. Webhook      │            Stripe → POST /api/payments/webhook
│    (background) │            השרת מעדכן: order.status = "confirmed"
│                 │
│ 6. סקר סטטוס    │──────────→ GET /api/payments/:orderId/status
│                 │←──────────  { status: "succeeded" }
└─────────────────┘
```

### 7.2 יצירת Payment Intent (בנפרד)

```
POST /api/payments/create-intent    🔒 Auth
POST /api/payments/checkout         🔒 Auth (alias)
```

```ts
// Request
{ "orderId": "665b..." }

// Response
{
  "success": true,
  "data": {
    "payment": {
      "_id": "...",
      "order": "665b...",
      "amount": 299.80,
      "currency": "ILS",
      "status": "pending",
      "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_..."
    },
    "status": "pending",
    "clientSecret": null,
    "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_..."
  }
}
```

> ⚠️ **בדרך כלל לא צריך לקרוא לזה ישירות!** כי `POST /api/orders` כבר יוצר את ה-payment intent אוטומטית. זה שימושי רק אם צריך ליצור intent חדש להזמנה קיימת.

### 7.3 בדיקת סטטוס תשלום

```
GET /api/payments/:orderId/status    🔒 Auth
```

```ts
// Response
{
  "success": true,
  "data": {
    "status": "succeeded",    // pending | succeeded | failed | refunded
    "payment": { ... }
  }
}
```

> 💡 אחרי שהמשתמש חוזר מ-Stripe, בדוק את הסטטוס עם polling:
> ```ts
> // בדף success — סקר כל 2 שניות עד שהתשלום מאושר
> const interval = setInterval(async () => {
>   const res = await fetch(`/api/payments/${orderId}/status`, { headers: authHeaders });
>   const { data } = await res.json();
>   if (data.status === 'succeeded') {
>     clearInterval(interval);
>     showSuccessMessage();
>   }
> }, 2000);
> ```

### 7.4 Webhook (רקע — לא רלוונטי לצד לקוח)

```
POST /api/payments/webhook    (Stripe calls this — לא קוראים מהצד לקוח!)
```

---

## 8. פאנל ניהול (Admin)

> **Base:** `/api/admin` — **כל הנתיבים דורשים 🔒 Auth + role=admin**

### 8.1 ניהול מוצרים

```
GET    /api/admin/products                 — רשימת מוצרים (כולל לא פעילים)
POST   /api/admin/products                 — יצירת מוצר
PUT    /api/admin/products/:id             — עדכון מוצר
DELETE /api/admin/products/:id             — מחיקת מוצר (soft delete)
```

```ts
// POST — יצירת מוצר
{
  "sku": "KB-001",
  "name": "מקלדת מכנית",
  "description": "מקלדת גיימינג עם תאורה",
  "price": 349.90,
  "stock": 50,
  "category": "electronics",
  "image": "https://example.com/keyboard.jpg",
  "featured": true
}
```

Query params:
- `GET /api/admin/products?includeInactive=false` — רק מוצרים פעילים

### 8.2 ניהול משתמשים

```
GET /api/admin/users                  — רשימת משתמשים
GET /api/admin/users?page=2&limit=20  — עם עימוד
PUT /api/admin/users/:id/role         — שינוי תפקיד
```

```ts
// PUT — שינוי תפקיד
{ "role": "admin" }  // או "user"
```

### 8.3 ניהול הזמנות

```
GET /api/admin/orders                     — כל ההזמנות
GET /api/admin/orders?status=confirmed    — סינון לפי סטטוס
GET /api/admin/orders?userId=665a...      — הזמנות של משתמש
PUT /api/admin/orders/:id/status          — עדכון סטטוס
```

```ts
// PUT — עדכון סטטוס הזמנה
{
  "status": "shipped",
  "message": "נשלח עם DHL, מספר מעקב: 12345"
}
```

### 8.4 סטטיסטיקות

```
GET /api/admin/stats/summary    🔒 Admin
```

```ts
// Response
{
  "success": true,
  "data": {
    "stats": {
      "totalUsers": 150,
      "totalProducts": 45,
      "totalOrders": 320,
      "revenue": 125000,
      // ...
    }
  }
}
```

---

## 9. TypeScript Types

העתק את ה-types האלה לפרויקט ה-Frontend:

```ts
// types/api.ts

// ──────────────── Response Envelope ────────────────
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{ message: string; path?: string[] }>;
}

// ──────────────── Auth ────────────────
export interface User {
  _id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'user' | 'admin';
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RegisterInput {
  name: string;      // min 2
  email: string;     // valid email
  password: string;  // min 6
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;       // min 6
  confirmPassword: string;   // must match newPassword
}

export interface UpdateProfileInput {
  name?: string;   // min 2
  email?: string;  // valid email
}

// ──────────────── Products ────────────────
export interface Product {
  _id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image: string;
  featured: boolean;
  rating: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  featured?: boolean;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'rating';
}

// ──────────────── Cart ────────────────
export interface CartItem {
  product: Product;  // populated
  quantity: number;
  lockedPrice: number | null;
}

export interface Cart {
  _id: string;
  userId: string;
  items: CartItem[];
  total: number;
  createdAt: string;
  updatedAt: string;
}

// ──────────────── Address ────────────────
export interface Address {
  _id: string;
  user: string;
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddressInput {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

// ──────────────── ShippingAddress (embedded) ────────────────
export interface ShippingAddress {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

// ──────────────── Orders ────────────────
export type OrderStatus =
  | 'pending'
  | 'pending_payment'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  product: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface TrackingEntry {
  status: string;
  timestamp: string;
  message: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  paymentProvider: 'stripe' | 'paypal';
  paymentIntentId: string;
  shippingAddress: ShippingAddress;
  billingAddress?: ShippingAddress;
  trackingHistory: TrackingEntry[];
  estimatedDelivery: string | null;
  notes?: string;
  fulfilled: boolean;
  fulfilledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  shippingAddress: ShippingAddress;
  billingAddress?: ShippingAddress;
  paymentMethod?: 'stripe';  // default: "stripe"
  notes?: string;
}

export interface CreateOrderResponse {
  order: Order;
  payment: {
    clientSecret: string | null;
    checkoutUrl: string;
    status: string;
  };
}

// ──────────────── Payments ────────────────
export type PaymentProviderStatus =
  | 'pending'
  | 'requires_action'
  | 'succeeded'
  | 'failed'
  | 'refunded'
  | 'canceled';

export interface Payment {
  _id: string;
  order: string;
  user: string;
  amount: number;
  currency: string;   // "ILS"
  status: PaymentProviderStatus;
  provider: string;
  providerPaymentId: string;
  paymentIntentId: string;
  clientSecret?: string;
  checkoutUrl?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 10. טיפול בשגיאות

### API Client מומלץ

```ts
// lib/api.ts
const API_BASE = 'http://localhost:4001';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private getHeaders(auth = false): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (auth) {
      const token = this.getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request<T>(
    method: string,
    path: string,
    options: {
      body?: any;
      auth?: boolean;
      headers?: Record<string, string>;
    } = {}
  ): Promise<ApiResponse<T>> {
    const { body, auth = false, headers: extraHeaders } = options;

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { ...this.getHeaders(auth), ...extraHeaders },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data: ApiResponse<T> = await res.json();

    if (!data.success) {
      throw new ApiError(res.status, data.message || 'Unknown error', data.errors);
    }

    return data;
  }

  // Shorthand methods
  get<T>(path: string, auth = false) {
    return this.request<T>('GET', path, { auth });
  }

  post<T>(path: string, body: any, auth = false, headers?: Record<string, string>) {
    return this.request<T>('POST', path, { body, auth, headers });
  }

  put<T>(path: string, body: any, auth = true) {
    return this.request<T>('PUT', path, { body, auth });
  }

  delete<T>(path: string, body?: any, auth = true) {
    return this.request<T>('DELETE', path, { body, auth });
  }
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: any[],
  ) {
    super(message);
  }
}

export const api = new ApiClient();
```

### טיפול בשגיאות validation

```ts
try {
  await api.post('/api/auth/register', formData);
} catch (err) {
  if (err instanceof ApiError) {
    switch (err.status) {
      case 400:
        // Zod validation errors
        err.errors?.forEach(e => {
          console.log(`Field: ${e.path?.join('.')}, Error: ${e.message}`);
        });
        break;
      case 401:
        // Token expired — redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
        break;
      case 409:
        // Email already exists
        showToast('המייל כבר רשום במערכת');
        break;
      case 423:
        // Account locked
        showToast(err.message); // "Account locked... try again in X minutes"
        break;
      case 429:
        showToast('יותר מדי בקשות, נסה שוב עוד מעט');
        break;
    }
  }
}
```

---

## 11. Flow מלא — מכניסה ועד תשלום

```ts
import { api } from './lib/api';

// ═══════════════ 1. הרשמה / התחברות ═══════════════
const { data: authData } = await api.post<AuthResponse>(
  '/api/auth/login',
  { email: 'sam@mail.com', password: '123456' }
);
localStorage.setItem('token', authData!.token);
// ✅ מעכשיו כל הבקשות עם auth=true ישלחו את ה-token

// ═══════════════ 2. צפייה במוצרים ═══════════════
const { data: products } = await api.get<Product[]>(
  '/api/products?category=electronics&sort=price_asc'
);

// ═══════════════ 3. הוספה לעגלה ═══════════════
await api.post('/api/cart/add', { productId: products![0]._id, quantity: 2 }, true);
await api.post('/api/cart/add', { productId: products![1]._id, quantity: 1 }, true);

// ═══════════════ 4. צפייה בעגלה ═══════════════
const { data: cart } = await api.get<Cart>('/api/cart', true);
console.log(`סה"כ: ₪${cart!.total}`);

// ═══════════════ 5. הוספת כתובת (אם אין) ═══════════════
let { data: addresses } = await api.get<Address[]>('/api/addresses', true);
if (!addresses?.length) {
  await api.post('/api/addresses', {
    street: 'רחוב הרצל 5',
    city: 'תל אביב',
    postalCode: '6120101',
    country: 'ישראל',
    isDefault: true,
  }, true);
}

// ═══════════════ 6. יצירת הזמנה ═══════════════
const { data: orderData } = await api.post<CreateOrderResponse>(
  '/api/orders',
  {
    shippingAddress: {
      street: 'רחוב הרצל 5',
      city: 'תל אביב',
      postalCode: '6120101',
      country: 'ישראל',
    },
    notes: 'נא לעטוף כמתנה',
  },
  true,
  { 'Idempotency-Key': crypto.randomUUID() }
);

// ═══════════════ 7. הפניה לתשלום ═══════════════
window.location.href = orderData!.payment.checkoutUrl;
// 🔒 המשתמש עובר לדף של Stripe, מזין כרטיס, ומשלם

// ═══════════════ 8. חזרה מ-Stripe ═══════════════
// URL: /checkout?payment=success&orderId=665b...
// בדוק סטטוס:
const urlParams = new URLSearchParams(window.location.search);
const orderId = urlParams.get('orderId');
const paymentResult = urlParams.get('payment');

if (paymentResult === 'success') {
  // Poll for payment confirmation (webhook might take a few seconds)
  const checkPayment = async () => {
    const { data } = await api.get<any>(`/api/payments/${orderId}/status`, true);
    if (data.status === 'succeeded') {
      showToast('🎉 התשלום בוצע בהצלחה!');
      return true;
    }
    return false;
  };

  // Try every 2 seconds, up to 30 seconds
  let attempts = 0;
  const interval = setInterval(async () => {
    attempts++;
    const done = await checkPayment();
    if (done || attempts >= 15) {
      clearInterval(interval);
      if (attempts >= 15) showToast('ממתין לאישור מ-Stripe...');
    }
  }, 2000);
}
```

---

## 12. דפים מומלצים

### מבנה דפים (Routes)

| דף | נתיב | תיאור |
|----|-------|--------|
| דף הבית | `/` | מוצרים מומלצים, קטגוריות |
| קטלוג | `/products` | רשימת מוצרים + פילטרים |
| מוצר | `/products/:id` | פרטי מוצר + "הוסף לעגלה" |
| עגלה | `/cart` | פריטים + כמויות + סה"כ |
| Checkout | `/checkout` | כתובת משלוח + לחצן תשלום |
| אישור | `/checkout?payment=success` | סטטוס תשלום + פרטי הזמנה |
| הזמנות | `/orders` | רשימת הזמנות |
| הזמנה | `/orders/:id` | פרטי הזמנה + מעקב |
| מעקב | `/track/:id` | מעקב ציבורי (ללא login) |
| הרשמה | `/register` | טופס הרשמה |
| התחברות | `/login` | טופס התחברות |
| פרופיל | `/profile` | פרטי משתמש + עדכון |
| כתובות | `/addresses` | ניהול כתובות |
| שכחתי סיסמה | `/forgot-password` | טופס שכחת סיסמה |
| איפוס סיסמה | `/reset-password/:token` | טופס איפוס |
| Admin | `/admin` | דשבורד ניהול |
| Admin - מוצרים | `/admin/products` | ניהול מוצרים |
| Admin - הזמנות | `/admin/orders` | ניהול הזמנות |
| Admin - משתמשים | `/admin/users` | ניהול משתמשים |

### Hooks מומלצים (React)

```ts
// hooks/useAuth.ts
function useAuth() {
  // GET /api/auth/verify on mount
  // Store user in context
  // Return: { user, login, register, logout, isLoading }
}

// hooks/useCart.ts
function useCart() {
  // GET /api/cart on mount
  // Return: { cart, addItem, updateQuantity, removeItem, clearCart, itemCount }
}

// hooks/useProducts.ts
function useProducts(filters: ProductFilters) {
  // GET /api/products?... with filters
  // Return: { products, isLoading, categories }
}

// hooks/useOrders.ts
function useOrders() {
  // GET /api/orders
  // Return: { orders, isLoading, cancelOrder }
}
```

### Stripe Setup (בצד לקוח)

```bash
npm install @stripe/stripe-js
```

```ts
// lib/stripe.ts
import { loadStripe } from '@stripe/stripe-js';

// ⚠️ Publishable Key — בטוח לשימוש בצד לקוח
export const stripePromise = loadStripe(
  'pk_test_51SoV0pCLVbzxhjNr9SIVzq6fS5X8vKYZmjmGQNoa66kqexlhFjqFXHEn7IhhI3tJVtS0eQUJ8JTE6e4fWhGt8mwZ00kFZPOEKs'
);
```

> הפרויקט הזה משתמש ב-**Stripe Checkout** (דף מתארח של Stripe), אז לא צריכים Stripe Elements. פשוט `window.location.href = checkoutUrl`.

---

## 🔗 קישורים שימושיים

| משאב | קישור |
|------|--------|
| Swagger UI (אינטראקטיבי) | `http://localhost:4001/api/docs` |
| OpenAPI JSON (לייצוא) | `http://localhost:4001/api/docs.json` |
| קובץ סטטי | `openapi.json` בתיקיית הפרויקט |
| מטבע | `ILS` (שקלים) |
| Stripe Test Card | `4242 4242 4242 4242` (exp: any future, CVC: any) |
| Stripe Docs | https://stripe.com/docs |

---

> 📝 **מדריך זה נוצר אוטומטית מתוך קוד השרת. עודכן לאחרונה: 2026-02-23**
