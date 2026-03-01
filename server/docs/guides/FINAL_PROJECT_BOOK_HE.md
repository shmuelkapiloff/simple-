# ספר פרויקט גמר - Simple Shop Backend

---

## עמוד שער

**שם המכללה:** [שם המכללה]  
**סמל לוגו:** [לוגו המכללה]  
**שם מגמה:** הנדסת תוכנה  
**מסלול הכשרה:** הנדסאי  

**נושא הפרויקט:** מערכת API לניהול חנות קנייה אונליין עם תשלומים וניהול מלאי  

**שמות הסטודנטים:**
- [שם סטודנט 1] – צד שרת (Server-side)
- [שם סטודנט 2] – צד לקוח (Client-side)

**שם המנחה האישי:** [שם המנחה]  
**תאריך מסירה:** [תאריך]  

---

## תוכן עניינים

1. [תאור ורקע כללי](#13-תאור-ורקע-כללי)
2. [מטרות המערכת](#132-מטרות-המערכת)
3. [סקירת מצב קיים בשוק](#133-סקירת-מצב-קיים-בשוק)
4. [מה הפרויקט אמור לחדש](#134-מה-הפרויקט-אמור-לחדש-או-לשפר)
5. [דרישות מערכת ופונקציונאליות](#135-דרישות-מערכת-ופונקציונאליות)
6. [בעיות צפויות ופתרונות](#136-בעיות-צפויות-ופתרונות)
7. [פתרון טכנולוגי נבחר](#137-פתרון-טכנולוגי-נבחר)
8. [שימוש במבני נתונים](#138-שימוש-במבני-נתונים-וארגון-קבצים)
9. [תרשימי מערכת](#139-תרשימי-מערכת-מרכזיים)
10. [מרכיב אלגוריתמי](#1310-תיאור-המרכיב-האלגוריתמי-חישובי)
11. [אבטחת מידע](#1311-תיאור-התייחסות-לנושאי-אבטחת-מידע)
12. [משאבים הנדרשים](#1312-משאבים-הנדרשים-לפרויקט)
13. [תכנית עבודה ושלבים](#1313-תכנית-עבודה-ושלבים-למימוש)
14. [תכנון הבדיקות](#1314-תכנון-הבדיקות)
15. [בקרת גרסאות](#1315-בקרת-גרסאות)

---

## 1.3 תכולת הפרויקט

### 1.3.1 תאור ורקע כללי

**Simple Shop** היא מערכת e-commerce מקומית שנועדה לניהול חנות קנייה אונליין. המערכת מאפשרת לחנות:
- להציג קטלוג של מוצרים
- לניהול המלאי בזמן אמת
- לניהול עגלות קניות של הלקוחות
- לעיבוד תשלומים בטוחים דרך Stripe
- לניהול הזמנות מתחילה עד משלוח

הפרויקט בנוי כ-**Backend API** המשדר נתונים לממשק Frontend (צד לקוח) דרך REST API.

---

### 1.3.2 מטרות המערכת

**מטרות עיקריות:**

1. **חנות אונליין פונקציונאלית** – מערכת קמלה לניהול הזמנות, מוצרים, ותשלומים
2. **אבטחה גבוהה** – הגנה מפני התקפות (brute force, SQL injection, CSRF וכו')
3. **ביצועים טובים** – טיפול בעומסים גבוהים ותגובה מהירה
4. **קל לתחזוקה** – קוד clean, מתועד, ובעל test coverage טוב
5. **עמידות בעת כשל** – recovery מכשל ניהול זיכרון ותקשורת

**מטרות למידה:**
- בנות API ניתן לקנה מידה בסביבה production
- עבודה עם מסדי נתונים MongoDB ו-Redis
- קישור עם שירות תשלומים חיצוני (Stripe)
- ניהול סטטוסיות בעגלות והזמנות
- logging ו-monitoring בסביבה production

---

### 1.3.3 סקירת מצב קיים בשוק

**סוגי פתרונות קיימים:**

| פתרון | יתרונות | חסרונות |
|------|---------|---------|
| Shopify, WooCommerce | מוכנים, חזקים | יקרים, פחות גמישות |
| Magento | מלא תכונות | מסובך ללמידה, דורש שרת חזק |
| Open-source (Medusa) | חינם, גמיש | צריך בניית ממשק משלהם |
| בנית עצמית | מלא בקרה, למידה | זמן רב, דורש ידע רב |

**בחירת הפתרון שלנו:**
בחרנו לבנות API משלנו כדי:
- ללמוד את כל השכבות של e-commerce
- לבקר בטיחות בעצמנו
- להתאים לדרישות ספציפיות
- להשתלט על כל הקוד

---

### 1.3.4 מה הפרויקט אמור לחדש או לשפר

**שיפורים ותכונות חדשות:**

1. **תשלומים בטוחים עם Stripe** – integration עם Stripe עם webhook verification וidempotency
2. **ניהול מלאי atomic** – מניעת overselling עם MongoDB transactions
3. **account lockout** – הגנה מפני brute force attacks
4. **rate limiting per-user** – שמירת משאבים מפני ניסיונות התקפה
5. **audit logging** – רישום כל פעולה משמעותית
6. **idempotency keys** – הבטחה שפעולות לא יבוצעו פעמיים
7. **webhook reliability** – retry logic לwebhooks עם exponential backoff

**חדשנות:**
המערכת משלבת מספר טכניקות אבטחה מתקדמות:
- Atomic transactions למניעת race conditions
- HMAC-SHA256 לverification של webhooks
- JWT עם refresh tokens
- Password hashing ב-bcrypt
- Structured logging עם Pino

---

### 1.3.5 דרישות מערכת ופונקציונאליות

#### 1.3.5.1 דרישות מערכת

| דרישה | פרטים |
|------|--------|
| **סביבת הטמעה** | Node.js 22.x, MongoDB 8.6, Redis 5.4 |
| **שרידות** | הצפנה עבור הסיסמאות, JWT tokens בטוחים |
| **ביצועים** | תמיכה ב-100+ בקשות/שנייה, latency < 100ms |
| **התמודדות עם עומסים** | Rate limiting, connection pooling, caching |
| **זמינות** | Graceful shutdown, health checks |

#### 1.3.5.2 דרישות פונקציונאליות

**ניהול משתמשים:**
- ✅ Registration (יצירת חשבון חדש)
- ✅ Login / Logout (אימות)
- ✅ Reset password (איפוס סיסמה)
- ✅ Account lockout (נעילה אחרי 5 ניסיונות שגויים)

**ניהול מוצרים:**
- ✅ Get all products (עם pagination)
- ✅ Get product by ID
- ✅ Create/Update/Delete product (admin only)
- ✅ Search and filter

**ניהול עגלות:**
- ✅ Add item to cart
- ✅ Remove item from cart
- ✅ Update quantity
- ✅ Get cart items

**ניהול הזמנות:**
- ✅ Create order from cart
- ✅ Get order by ID
- ✅ Get all user orders
- ✅ Cancel order
- ✅ Track order status

**ניהול תשלומים:**
- ✅ Create payment intent (checkout)
- ✅ Process webhook from Stripe
- ✅ Verify payment signature
- ✅ Refund logic

---

### 1.3.6 בעיות צפויות ופתרונות

#### 1.3.6.1 תיאור הבעיות הצפויות

| בעיה | משפעות | חומרה |
|------|--------|--------|
| **Race conditions** | שני לקוחות קונים אותו מוצר בו-זמנית = overselling | 🔴 קריטי |
| **Brute force attacks** | התקפות על login/password reset | 🔴 קריטי |
| **Webhook failures** | Stripe שלח webhook אבל לא קיבלנו | 🟠 חשוב |
| **חוסר תיעוד** | קשה להבין את הקוד אחרי חודשים | 🟡 בינוני |
| **בעיות performance** | API איטה תחת עומס גבוה | 🟡 בינוני |

#### 1.3.6.2 פתרונות אפשריים

| בעיה | פתרון | בחירה |
|------|-------|--------|
| **Race conditions** | MongoDB transactions + atomic operations | ✅ **בחרנו זה** |
| **Brute force** | Rate limiting + account lockout | ✅ **בחרנו זה** |
| **Webhook reliability** | Idempotency + retry logic + DB tracking | ✅ **בחרנו זה** |
| **תיעוד** | JSDoc comments + structured logs | ✅ **בחרנו זה** |
| **Performance** | Redis caching + connection pooling | ✅ **בחרנו זה** |

---

### 1.3.7 פתרון טכנולוגי נבחר

#### 1.3.7.1 טופולוגיית הפתרון

```
┌─────────────────────────────────────┐
│  Frontend (React/Vue - צד לקוח)     │
│  רץ ב-Browser של משתמש              │
└────────────┬────────────────────────┘
             │
        HTTPS API
             │
             ▼
┌─────────────────────────────────────┐
│  Backend API (Node.js/Express)      │
│  רץ בcluster עם load balancer       │
│  ┌───────────────────────────────┐  │
│  │ Controllers (endpoints)       │  │
│  │ Services (business logic)     │  │
│  │ Middleware (auth, logging)    │  │
│  └───────────────┬───────────────┘  │
└────────┬─────────┼────────┬──────────┘
         │         │        │
    HTTP │    HTTP │   HTTP │
         ▼         ▼        ▼
    ┌────────┐ ┌──────┐ ┌──────┐
    │MongoDB │ │Redis │ │Stripe│
    │Database│ │Cache │ │(API) │
    └────────┘ └──────┘ └──────┘
```

**Deployment:**
- Frontend: Vercel / Netlify
- Backend: Cloud (AWS/GCP/Azure) או VPS
- Database: MongoDB Atlas (cloud)
- Cache: Redis Cloud

#### 1.3.7.2 טכנולוגיות בשימוש

| Layer | טכנולוגיה | גרסה | תפקיד |
|-------|-----------|------|--------|
| **Backend** | Express.js | 4.18 | HTTP server framework |
| **Runtime** | Node.js | 22.x | JavaScript execution |
| **Language** | TypeScript | 5.x | Type safety |
| **Database** | MongoDB | 8.6 | NoSQL data store |
| **Cache** | Redis | 5.4 | In-memory cache |
| **Payment** | Stripe API | v1 | Payment processing |
| **Auth** | JWT | - | Token-based auth |
| **Logging** | Pino | 8.x | Structured logging |
| **Metrics** | Prometheus | - | Observability |
| **Validation** | Zod | - | Runtime type checking |
| **Testing** | Jest + Supertest | 29.x | Unit & integration tests |

#### 1.3.7.3 שפות הפיתוח

- **TypeScript** – שפת ראשית, compiled to JavaScript
- **JavaScript (ES2023)** – בזמן runtime
- **HTML/CSS** – ממשק Frontend (צד לקוח)

#### 1.3.7.4 תיאור הארכיטקטורה הנבחרת

**MVC + Layered Architecture:**

```
Routes (הגדרת endpoints)
   ↓
Controllers (HTTP handlers)
   ↓
Services (business logic)
   ↓
Models (MongoDB schemas)
   ↓
Database
```

**Middleware stack:**
```
express.json() → CORS → helmet → logging → auth → rate-limit → handlers
```

**זרימת בקשה:**
1. Client שולח HTTP request
2. Router מחפש matching endpoint
3. Middleware (auth, logging, rate-limit)
4. Controller עיבד ה-request
5. Service ביצע עסקי logic
6. Model תקשורת עם DB
7. Response חוזר ל-Client

#### 1.3.7.5 חלוקה לתכניות ומודולים

**ארגון תיקיות:**

```
src/
├── controllers/         (HTTP handlers)
│   ├── auth.controller.ts
│   ├── product.controller.ts
│   ├── order.controller.ts
│   └── ...
├── services/           (business logic)
│   ├── auth.service.ts
│   ├── order.service.ts
│   └── payment.service.ts
├── models/             (MongoDB schemas)
│   ├── user.model.ts
│   ├── product.model.ts
│   ├── order.model.ts
│   └── ...
├── routes/             (endpoint definitions)
│   ├── auth.routes.ts
│   ├── product.routes.ts
│   └── ...
├── middlewares/        (request handlers)
│   ├── auth.middleware.ts
│   ├── rate-limiter.middleware.ts
│   ├── error.middleware.ts
│   └── logging.middleware.ts
├── config/             (configuration)
│   ├── db.ts
│   ├── redisClient.ts
│   └── env.ts
└── utils/              (utility functions)
    ├── logger.ts
    ├── errors.ts
    └── response.ts
```

#### 1.3.7.10 פונקציות מרכזיות וחשובות (עם הסברים קצרים)

**צד שרת – פונקציות ליבה (דוגמה):**

| פונקציה | מיקום | תיאור קצר |
|---------|-------|-----------|
| `AuthService.login()` | services/auth.service.ts | אימות משתמש, בדיקת נעילה, עדכון ניסיונות, יצירת JWT |
| `AuthService.register()` | services/auth.service.ts | יצירת משתמש חדש, הצפנת סיסמה, יצירת token ראשוני |
| `OrderService.createOrder()` | services/order.service.ts | יצירת הזמנה מהעגלה, חישוב סכום ושמירת מצב pending |
| `PaymentService.handleWebhook()` | services/payment.service.ts | אימות webhook, בדיקת idempotency, עדכון תשלום והזמנה |
| `PaymentService.fulfillOrder()` | services/payment.service.ts | הפחתת מלאי אטומית ופתרון race conditions |
| `CartService.addItem()` | services/cart.service.ts | הוספת פריט לעגלה, אימות מלאי ועדכון כמות |
| `ProductService.getProducts()` | services/product.service.ts | שליפת מוצרים עם סינון ופג'ינציה |
| `RateLimiter.authRateLimiter()` | middlewares/rate-limiter.middleware.ts | הגנה מפני brute force לפי משתמש/IP |
| `AuthMiddleware.protect()` | middlewares/auth.middleware.ts | אימות JWT והגבלת גישה לנתיבים מוגנים |

**הערה:** הרשימה מיועדת להסביר את פונקציות הליבה בפרויקט. ניתן להחליף/לעדכן לפי שמות פונקציות בפועל בקוד.

#### 1.3.7.6 סביבת השרת

- **Development:** Local Node.js, local MongoDB, local Redis
- **Testing:** In-memory databases, mocked Stripe
- **Production:** Cloud infrastructure (AWS/GCP/Azure)
  - App server: Node.js cluster
  - Load balancer: nginx / cloud provider
  - Database: MongoDB Atlas (managed)
  - Cache: Redis Cloud / ElastiCache
  - Monitoring: CloudWatch / DataDog

#### 1.3.7.7 ממשק המשתמש / לקוח (GUI)

**צד לקוח (Frontend):**
- React / Vue.js application
- Responsive design
- API calls דרך axios / fetch
- State management (Redux / Vuex)

**Screens עיקריים:**
- Home page (רשימת מוצרים)
- Product detail page
- Shopping cart
- Checkout (עם Stripe)
- Order tracking
- Account management

#### 1.3.7.8 ממשקים למערכות אחרות (API)

**External APIs:**

1. **Stripe API** – לעיבוד תשלומים
   - `POST /v1/checkout/sessions` – יצירת session
   - `POST /webhooks` – קבלת events
   
2. **Email service** – לשליחת מיילים (optional)
   - Password reset emails
   - Order confirmation emails

**Internal API endpoints:**

```
Authentication:
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh-token

Products:
GET    /api/products
GET    /api/products/:id
POST   /api/products (admin)
PUT    /api/products/:id (admin)
DELETE /api/products/:id (admin)

Orders:
POST   /api/orders
GET    /api/orders
GET    /api/orders/:id
PUT    /api/orders/:id/cancel

Payments:
POST   /api/payments/create-checkout
POST   /api/payments/webhook (Stripe)

Health:
GET    /api/health
```

#### 1.3.7.9 שימוש בחבילות תוכנה

**Production Dependencies:**

```json
{
  "express": "^4.18.2",           // HTTP server
  "mongoose": "^7.5.0",           // MongoDB ODM
  "redis": "^4.6.0",              // Redis client
  "stripe": "^12.0.0",            // Payment processor
  "jsonwebtoken": "^9.0.0",       // JWT tokens
  "bcryptjs": "^2.4.3",           // Password hashing
  "helmet": "^7.0.0",             // Security headers
  "cors": "^2.8.5",               // CORS middleware
  "pino": "^8.0.0",               // Structured logging
  "zod": "^3.22.0",               // Runtime validation
  "prom-client": "^14.0.0"        // Prometheus metrics
}
```

**Dev Dependencies:**

```json
{
  "typescript": "^5.0.0",
  "@types/node": "^20.0.0",
  "jest": "^29.0.0",
  "supertest": "^6.3.0",
  "ts-node": "^10.0.0",
  "nodemon": "^3.0.0"
}
```

---

### 1.3.8 שימוש במבני נתונים וארגון קבצים

#### 1.3.8.1 פרוט מבנה הנתונים

**User Collection:**
```javascript
{
  _id: ObjectId,
  email: String,
  password: String (hashed),
  name: String,
  phone: String,
  role: String ("user" | "admin"),
  failedLoginAttempts: Number,
  lockedUntil: Date,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Product Collection:**
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  price: Number,
  stock: Number,
  category: String,
  image: String (URL),
  isActive: Boolean,
  createdAt: Date
}
```

**Order Collection:**
```javascript
{
  _id: ObjectId,
  orderNumber: String (unique),
  user: ObjectId (ref: User),
  items: [
    {
      product: ObjectId (ref: Product),
      name: String,
      price: Number,
      quantity: Number,
      image: String
    }
  ],
  totalAmount: Number,
  status: String ("pending" | "confirmed" | "shipped" | "delivered"),
  paymentStatus: String ("pending" | "paid" | "failed"),
  shippingAddress: Address,
  createdAt: Date
}
```

**Payment Collection:**
```javascript
{
  _id: ObjectId,
  order: ObjectId (ref: Order),
  user: ObjectId (ref: User),
  providerPaymentId: String (Stripe ID),
  amount: Number,
  currency: String,
  status: String ("pending" | "succeeded" | "failed"),
  checkoutUrl: String,
  createdAt: Date
}
```

**WebhookEvent Collection (Idempotency):**
```javascript
{
  _id: ObjectId,
  eventId: String (unique, from Stripe),
  provider: String ("stripe"),
  eventType: String,
  processedAt: Date,
  ttl: Date (expires after 30 days)
}
```

#### 1.3.8.2 שיטת האיחסון

**MongoDB:**
- Primary data store
- Durable (data persists across crashes)
- Atomic transactions (prevent race conditions)
- Indexing for performance

**Redis:**
- Session storage
- Cart caching (temporary)
- Rate limit counters
- Pub/Sub for notifications (future)

**File Storage:**
- Product images: Cloud storage (S3 / Firebase)
- Logs: Local files + cloud (LogDNA / DataDog)

#### 1.3.8.3 מנגנוני התאוששות

**מ-Database failures:**
- Automatic reconnection logic
- Connection pooling
- Graceful degradation

**מ-Payment failures:**
- Webhook retry logic (exponential backoff)
- Failed webhook tracking
- Admin dashboard for manual recovery

**מ-Server crashes:**
- Session persistence (Redis)
- Distributed tracing
- Health checks

---

### 1.3.9 תרשימי מערכת מרכזיים

#### 1.3.9.1 Use Case Diagram

```
                    ┌──────────────────┐
                    │   לקוח משתמש     │
                    └──────┬───────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
  ┌──────────────┐  ┌────────────────┐  ┌──────────┐
  │ צפייה במוצרים│  │ קנייה (checkout)│  │ מעקב HZ │
  └──────────────┘  └────────────────┘  └──────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                           ▼
                    ┌──────────────────┐
                    │  API Backend     │
                    └──────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
  ┌──────────────┐  ┌────────────────┐  ┌──────────┐
  │   MongoDB    │  │     Stripe     │  │  Redis   │
  │  Database    │  │   Payment API  │  │  Cache   │
  └──────────────┘  └────────────────┘  └──────────┘
```

#### 1.3.9.2 Sequence Diagram – Checkout Flow

```
Client          Backend         Stripe          MongoDB
  │               │               │               │
  │─ POST /order─>│               │               │
  │               │─ verify stock─────────────────>│
  │               │<─ stock OK────────────────────│
  │               │               │               │
  │               │─ create payment intent───────>│
  │               │<─ session URL─────────────────│
  │               │               │               │
  │<─ checkout URL│               │               │
  │               │               │               │
  │─ redirect to Stripe ──────────────────────────>
  │               │               │
  │               │  (user enters card details)
  │               │               │
  │               │<─ webhook: payment.success───│
  │               │               │               │
  │               │─ reduce stock─────────────────>
  │               │<─ stock reduced────────────────│
  │               │               │               │
  │               │─ create order─────────────────>
  │               │<─ order created────────────────│
  │               │               │               │
  │<─ success ────│               │               │
```

#### 1.3.9.3 Data Flow Diagram

```
INPUT:                 PROCESS:                OUTPUT:
User fills cart   →   Validate cart      →    Order created
                  →   Check stock         →    Payment intent
                  →   Calculate total     →    Confirmation email
                  
Payment webhook   →   Verify signature   →    Order fulfilled
                  →   Check idempotency  →    Stock reduced
                  →   Reduce stock       →    Webhook logged
                  
Login attempt     →   Check if locked    →    JWT token
                  →   Verify password    →    Session created
                  →   Hash password      →    Rate limit updated
                  →   Track failed tries
```

#### 1.3.9.4 תרשים שכבות (Layered Architecture)

```
┌───────────────────────────────┐
│           Routes              │  הגדרת נתיבים
└───────────────┬───────────────┘
        │
┌───────────────▼───────────────┐
│         Controllers           │  טיפול ב-HTTP
└───────────────┬───────────────┘
        │
┌───────────────▼───────────────┐
│           Services            │  לוגיקה עסקית
└───────────────┬───────────────┘
        │
┌───────────────▼───────────────┐
│            Models             │  סכמות DB
└───────────────┬───────────────┘
        │
┌───────────────▼───────────────┐
│           Database            │  MongoDB
└───────────────────────────────┘
```

#### 1.3.9.5 תרשים זרימת Login + Lockout

```
User → POST /login
     │
     ▼
   Check lockedUntil?
     │ Yes (locked) ──> Return 423/401
     │ No
     ▼
   Verify password
     │
     ├─ Success → Reset failed attempts → Issue JWT
     │
     └─ Fail → failedLoginAttempts++
         │
         ├─ < 5 → Return error (remaining attempts)
         └─ >= 5 → lockedUntil = now + 15 min
```

#### 1.3.9.6 תרשים Webhook Processing

```
Stripe Webhook → Verify Signature → Check Idempotency
              │                │
              │                ├─ already processed → return 200
              │                │
              ▼                ▼
          Verify Amount → Reduce Stock (transaction)
              │                │
              ▼                ▼
          Update Payment → Update Order Status
              │
              ▼
             Return 200
```

---

### 1.3.10 תיאור המרכיב האלגוריתמי חישובי

#### 1.3.10.1 בעיות וחישובים

**בעיה 1: Overselling (קנייה כפולה)**
- מה: שני לקוחות קונים את אותו מוצר בו-זמנית
- פתרון: MongoDB atomic transactions
- אלגוריתם:
  ```
  BEGIN TRANSACTION
    1. Lock product in transaction
    2. Check stock >= quantity needed
    3. Reduce stock
    4. Create order
    5. COMMIT or ROLLBACK
  END TRANSACTION
  ```

**בעיה 2: Brute Force Attack**
- מה: התקפה ניסיון-וטעייה על login
- פתרון: Account lockout + rate limiting
- אלגוריתם:
  ```
  ON LOGIN FAILURE:
    1. Increment failedLoginAttempts
    2. IF attempts >= 5:
         Set lockedUntil = now + 15 minutes
    3. Save to DB
    4. Return error with remaining time
  ```

**בעיה 3: Webhook Replay Attack**
- מה: Stripe שלח את אותו webhook פעמיים
- פתרון: Idempotency with DB tracking
- אלגוריתם:
  ```
  ON WEBHOOK:
    1. Verify signature (HMAC-SHA256)
    2. Check if eventId already in DB
    3. IF already processed:
         Return 200 OK (don't reprocess)
    4. ELSE:
         Process webhook
         Store eventId in DB
    5. Return 200 OK
  ```

#### 1.3.10.2 איסוף מידע וניתוחים סטטיסטיים

**Metrics collected:**

| Metric | תפקיד | דוגמה |
|--------|--------|--------|
| **Response time** | ביצועים | 95th percentile < 200ms |
| **Error rate** | אמינות | < 0.1% (fewer than 1 per 1000) |
| **Login attempts** | אבטחה | 5 failed = lockout |
| **Stock levels** | עסקים | Alert if < 10 units |
| **Payment success** | הכנסות | 98% of checkouts complete |
| **Webhook retries** | reliability | 3 retries before manual review |

**Logging format (Structured logs):**

```json
{
  "level": "info",
  "timestamp": "2026-02-01T12:34:56Z",
  "service": "OrderService",
  "method": "createOrder",
  "userId": "507f1f77bcf86cd799439011",
  "orderId": "ORD-20260201-001",
  "totalAmount": 199.99,
  "duration_ms": 145,
  "status": "success"
}
```

---

### 1.3.11 תיאור התייחסות לנושאי אבטחת מידע

#### אזורים הדורשים אבטחה:

**1. Authentication & Authorization**
- ✅ **JWT tokens** – כל בקשה אחרי login צריכה token
- ✅ **Password hashing** – bcrypt with 12 rounds
- ✅ **Account lockout** – אחרי 5 failed logins
- ✅ **Rate limiting** – 5 attempts per 15 minutes per user
- ✅ **Refresh tokens** – JWT עם expiry כדי להגביל חלון זמן

**2. Database (MongoDB)**
- ✅ **Connection encryption** – HTTPS + TLS
- ✅ **At-rest encryption** – MongoDB Atlas encryption
- ✅ **Access control** – Network whitelist, IAM roles
- ✅ **Input validation** – Zod schemas prevent injection
- ✅ **Sensitive fields** – Passwords hidden with `select: false`

**3. API Security**
- ✅ **CORS** – Whitelist allowed origins
- ✅ **CSRF protection** – SameSite cookies
- ✅ **Helmet.js** – Security headers (CSP, X-Frame-Options, etc.)
- ✅ **Input validation** – All user input validated
- ✅ **Rate limiting** – Prevent brute force & DoS

**4. Payment Security (Stripe)**
- ✅ **Webhook signature verification** – HMAC-SHA256
- ✅ **Idempotency** – No duplicate charges
- ✅ **Amount verification** – DB vs webhook
- ✅ **PCI compliance** – Never touch card data (Stripe handles it)
- ✅ **Tokenization** – Card details stored in Stripe, not our DB

**5. Data Privacy**
- ✅ **No sensitive logs** – Passwords/tokens never logged
- ✅ **Email validation** – Prevent data enumeration
- ✅ **Account deletion** – Support GDPR compliance
- ✅ **Audit logs** – Track who did what when

#### 5 סצנריוים של התקפה ותגובה:

| התקפה | טרחת | תגובה |
|--------|-------|--------|
| **Brute force login** | 100 attempts | Account locked, logged, admin alerted |
| **SQL Injection** | `email: "'; DROP TABLE users; --"` | Zod validation rejects, query safe |
| **Rate limit bypass** | 1000 req/min | Rate limiter blocks, IP banned |
| **Webhook spoofing** | Fake Stripe webhook | Signature verify fails, rejected |
| **CSRF attack** | Cross-site form | SameSite cookie blocks request |

---

### 1.3.12 משאבים הנדרשים לפרויקט

#### 1.3.12.1 חלוקת שעות

| משימה | שעות | סטודנט 1 (Server) | סטודנט 2 (Client) |
|-------|------|-------------------|-------------------|
| Planning & Design | 30 | 15 | 15 |
| Backend API | 120 | 120 | - |
| Frontend | 100 | - | 100 |
| Testing | 30 | 20 | 10 |
| Deployment | 10 | 7 | 3 |
| Documentation | 10 | 6 | 4 |
| **Total** | **300** | **168** | **132** |

#### 1.3.12.2 ציוד נדרש

- Laptop (Windows/Mac/Linux) עם 8GB RAM
- Internet connection (לapi.stripe.com וmongodb.com)
- Text editor: VS Code + extensions
- Git/GitHub account
- MongoDB Atlas account (חינם)
- Stripe account (חינם - test mode)

#### 1.3.12.3 תוכנות נדרשות

| תוכנה | קובץ הורדה | קצת |
|------|-----------|------|
| Node.js 22+ | nodejs.org | Runtime |
| npm / yarn | (included w/ Node) | Package manager |
| MongoDB (local) | mongodb.com/download | Database (optional - use Atlas) |
| Redis (local) | redis.io | Cache (optional - use Redis Cloud) |
| Postman / Insomnia | postman.com | API testing |
| VS Code | code.visualstudio.com | Text editor |

#### 1.3.12.4 ידע חדש שנדרש ללמידה

- **Express.js** – HTTP framework
- **MongoDB & Mongoose** – NoSQL database
- **JWT & bcrypt** – Authentication
- **Stripe API** – Payment processing
- **Webhooks** – Async event handling
- **TypeScript** – Type-safe JavaScript
- **Testing** (Jest) – Unit & integration tests
- **Docker** (optional) – Containerization

#### 1.3.12.5 ספרות ומקורות מידע

- Express.js Documentation: expressjs.com
- MongoDB Docs: mongodb.com/docs
- Stripe Documentation: stripe.com/docs
- OWASP Top 10: owasp.org (Security)
- Node.js Best Practices: goldbergyoni/nodebestpractices
- Clean Code: Martin, Robert C.

---

### 1.3.13 תכנית עבודה ושלבים למימוש

**Sprint 1 (שבועות 1-2):**
- [ ] Setup project + Git
- [ ] Design DB schemas
- [ ] Setup MongoDB + Redis
- [ ] User model + registration/login

**Sprint 2 (שבועות 3-4):**
- [ ] Product CRUD
- [ ] Category filtering
- [ ] Rate limiting & account lockout
- [ ] Unit tests for auth

**Sprint 3 (שבועות 5-6):**
- [ ] Order creation
- [ ] Cart management
- [ ] MongoDB transactions
- [ ] Order tracking

**Sprint 4 (שבועות 7-8):**
- [ ] Stripe integration
- [ ] Webhook handling
- [ ] Idempotency
- [ ] Payment tests

**Sprint 5 (שבועות 9-10):**
- [ ] Admin endpoints
- [ ] Audit logging
- [ ] Metrics & monitoring
- [ ] Performance testing

**Sprint 6 (שבועות 11-12):**
- [ ] Deployment
- [ ] Documentation
- [ ] Security audit
- [ ] Final testing

---

### 1.3.14 תכנון הבדיקות

#### 1.3.14.1 בדיקות תהליכיות (Full Flow)

| מס | תיאור | צעדים | תוצאה צפויה |
|----|--------|--------|----------------|
| 1 | משתמש חדש נרשם | 1. POST /register 2. Check DB | User created, token issued |
| 2 | Login מוצלח | 1. POST /login 2. GET /me | JWT token returned |
| 3 | קנייה מלאה | 1. Add to cart 2. Checkout 3. Stripe payment 4. Webhook | Order created, stock reduced |
| 4 | Brute force blocked | 1. POST /login (wrong password x5) | Account locked after 5 attempts |
| 5 | Order tracking | 1. Create order 2. GET /orders/:id | Status = pending → shipped |

#### 1.3.14.2 בדיקות יחידה (Unit Tests)

| מודול | Test cases | Coverage |
|--------|-----------|----------|
| **Auth Service** | - Login success/failure - Password hashing - Token generation - Account lockout | 95% |
| **Order Service** | - Create order - Stock validation - Overselling prevention - Order cancellation | 90% |
| **Payment Service** | - Webhook verification - Idempotency - Amount validation - Retry logic | 92% |
| **Product Service** | - Get/create/update/delete - Stock updates - Search/filter | 88% |

---

### 1.3.15 בקרת גרסאות

**Git Workflow:**
- `main` – Production-ready
- `develop` – Latest development
- `feature/*` – New features
- `bugfix/*` – Bug fixes

**Commit convention:**
```
feat: Add account lockout after 5 failed logins
fix: Correct race condition in order creation
docs: Update API documentation
test: Add tests for payment webhook
```

**Version numbering:** Semantic Versioning (1.0.0)
- Major (1.x.x) – Breaking changes
- Minor (x.1.x) – New features
- Patch (x.x.1) – Bug fixes

---

## הערות סיום

מערכת זו היא דוגמה למערכת e-commerce production-ready עם דגש על:
- ✅ **אבטחה** – מרובה שכבות הגנה
- ✅ **אמינות** – Atomic operations, retry logic
- ✅ **ביצועים** – Caching, indexing, optimization
- ✅ **קריאות** – Clean code, good documentation

עם הערכה,
[שמות הסטודנטים]

---

**תאריך עדכון אחרון:** [תאריך]  
**מצב:** [Draft / Final]
