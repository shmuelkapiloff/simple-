# 📘 מדריך לימוד מקיף - Simple Shop Backend

> **מטרה:** להבין כל חלק בפרויקט כך שתוכל לענות על כל שאלה במראיין

---

## 🎯 תוכן עניינים

1. [סקירה כללית](#1-סקירה-כללית)
2. [ארכיטקטורה ומבנה](#2-ארכיטקטורה-ומבנה)
3. [זרימות עסקיות מרכזיות](#3-זרימות-עסקיות-מרכזיות)
4. [מודולים ושכבות](#4-מודולים-ושכבות)
   - 4.1-4.5 Routes, Control
   - lers, Services, Models, Middlewares
   - 4.6 Error Handling 🆕
   - 4.7 Validators (Zod) 🆕
   - 4.8 Admin Panel 🆕
   - 4.9 Address Management 🆕
   - 4.10 Sequence (מספרי הזמנה) 🆕
   - 4.11 Audit Logging 🆕
   - 4.12 Swagger/OpenAPI 🆕
5. [אבטחה](#5-אבטחה)
6. [ביצועים וסקלביליות](#6-ביצועים-וסקלביליות)
7. [Observability](#7-observability)
8. [Testing (בדיקות)](#8-testing-בדיקות) 🆕
9. [שאלות מראיין נפוצות](#9-שאלות-מראיין-נפוצות)
10. [טיפים למראיין](#10-טיפים-למראיין)
11. [מילות מפתח לחיפוש מהיר](#11-מילות-מפתח-לחיפוש-מהיר)

---

## 🆕 מה נוסף במדריך המעודכן:

| סעיף | נושא | למה חשוב למראיין |
|------|------|------------------|
| **4.6** | Error Handling | איך מטפלים בשגיאות בצורה מקצועית |
| **4.7** | Validators (Zod) | אימות קלט, Type Safety |
| **4.8** | Admin Panel | CRUD, סטטיסטיקות, Soft Delete |
| **4.9** | Address Management | ניהול כתובות, Default Address |
| **4.10** | Sequence | מספרי הזמנה אטומיים |
| **4.11** | Audit Logging | Compliance, Security Events |
| **4.12** | Swagger | תיעוד API אוטומטי |
| **5.2** | tokenVersion | 🆕 ביטול טוקנים מיידי (Instant Logout) |
| **8** | Testing | Jest, Unit/Integration Tests |

---

## 1. סקירה כללית

### 1.1 מה הפרויקט עושה?

**Simple Shop** הוא REST API לניהול חנות אונליין עם:
- ✅ אימות משתמשים (JWT)
- ✅ ניהול מוצרים וקטלוג
- ✅ עגלת קניות (Redis + MongoDB)
- ✅ יצירת הזמנות
- ✅ תשלומים מאובטחים (Stripe)
- ✅ פאנל אדמין

### 1.2 טכנולוגיות

| טכנולוגיה | תפקיד | למה בחרנו |
|-----------|-------|-----------|
| **Node.js + Express** | HTTP server | פשוט, גמיש, ביצועים טובים |
| **TypeScript** | שפה | Type safety, פחות באגים |
| **MongoDB** | Database ראשי | Schema גמיש, ACID transactions |
| **Redis** | Cache | Sub-millisecond latency |
| **Stripe** | Payment processor | PCI compliant, לא נוגעים בכרטיסי אשראי |
| **JWT** | Authentication | Stateless, scalable |
| **Pino** | Logging | Structured JSON logs |
| **Prometheus** | Metrics | Time-series monitoring |

### 1.3 מבנה תיקיות (מה כל תיקייה עושה)

```
src/
├── app.ts              # הגדרת Express app + middleware pipeline
├── server.ts           # נקודת כניסה, חיבור DB, הפעלת שרת
├── routes/             # הגדרת endpoints (מיפוי URL לפונקציות)
├── controllers/        # HTTP logic (קריאת request, החזרת response)
├── services/           # Business logic (חישובים, אינטגרציות)
├── models/             # MongoDB schemas (מבנה נתונים)
├── middlewares/        # Request processors (auth, logging, rate limit)
├── config/             # הגדרות (env, db, redis, constants)
├── utils/              # Helper functions (logger, metrics, errors)
└── validators/         # Zod schemas לאימות קלט
```

---

## 2. ארכיטקטורה ומבנה

### 2.1 ארכיטקטורה כללית (MVC + Layers)

```
┌─────────────────────────────────────────┐
│           Client (React)                 │
└─────────────┬───────────────────────────┘
              │ HTTP/HTTPS
              ↓
┌─────────────────────────────────────────┐
│        Express Server (Node.js)          │
│  ┌────────────────────────────────────┐ │
│  │   Middleware Pipeline              │ │
│  │   - CORS, Helmet, Body Parser      │ │
│  │   - Request ID, Logging            │ │
│  │   - Authentication, Rate Limiting  │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │   Routes (URL Mapping)             
 │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │   Controllers (HTTP Logic)         │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │   Services (Business Logic)        │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │   Models (Data Schemas)            │ │
│  └────────────────────────────────────┘ │
└──────┬──────────────┬──────────────────┘
       │              │
       ↓              ↓
   MongoDB         Redis
   (Primary)       (Cache)
```

### 2.2 זרימת בקשה (Request Flow)

```
1. Client → POST /api/auth/login
2. Express receives request
3. Middleware pipeline:
   ├─ requestIdMiddleware (הוספת X-Request-ID)
   ├─ requestLoggerMiddleware (לוג התחלתי)
   ├─ authRateLimiter (בדיקת rate limit)
   └─ asyncHandler wraps controller
4. Route matches → calls AuthController.login
5. Controller:
   ├─ Validates input (Zod schema)
   ├─ Calls AuthService.login(credentials)
   └─ Returns response
6. Service:
   ├─ Queries UserModel
   ├─ Checks account lockout
   ├─ Compares password (bcrypt)
   ├─ Generates JWT
   └─ Returns user + token
7. Response sent to client
8. Logging middleware logs completion
```

### 2.3 Middleware Pipeline (סדר חשוב!)

```javascript
// app.ts
app.use(helmet());                    // Security headers
app.use(corsConfig);                  // CORS
app.use('/webhook', express.raw()); // Raw body לwebhook
app.use(express.json());              // Parse JSON
app.use(requestIdMiddleware);         // Request ID
app.use(requestLoggerMiddleware);     // Logging
app.use(metricsMiddleware);           // Metrics
// Routes...
app.use(errorHandler);                // Error handling (אחרון!)
```

**למה הסדר חשוב?**
- `express.raw()` **לפני** `express.json()` - webhook צריך raw body
- `requestIdMiddleware` **לפני** logging - כדי שיהיה ID ללוגים
- `errorHandler` **אחרון** - כדי לתפוס שגיאות מכל המסלול

---

## 3. זרימות עסקיות מרכזיות

### 3.1 זרימת Authentication (Login)

```
┌────────────────────────────────────────────────────────────┐
│ Client: POST /api/auth/login                               │
│ Body: { email, password }                                  │
└─────────────────┬──────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────────┐
│ authRateLimiter: בדיקה אם IP לא עבר 5 נסיונות ב-15 דקות  │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────────┐
│ AuthController.login()                                      │
│ - מאמת קלט עם loginSchema (Zod)                            │
│ - קורא ל-AuthService.login()                               │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────────┐
│ AuthService.login()                                         │
│ 1. מחפש משתמש לפי email ב-UserModel                        │
│ 2. בודק אם החשבון נעול (lockedUntil)                      │
│ 3. משווה סיסמה עם bcrypt (user.comparePassword)            │
│ 4. אם נכשל:                                                │
│    - מעלה failedLoginAttempts                              │
│    - אם הגיע ל-5 → נועל חשבון ל-15 דקות                   │
│ 5. אם הצליח:                                               │
│    - מאפס failedLoginAttempts                              │
│    - יוצר JWT token (generateToken)                        │
│    - מעדכן lastLogin                                       │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────────┐
│ Response: { success: true, data: { user, token } }         │
└─────────────────────────────────────────────────────────────┘
```

**קבצים מעורבים:**
- Routes: `src/routes/auth.routes.ts`
- Controller: `src/controllers/auth.controller.ts`
- Service: `src/services/auth.service.ts`
- Model: `src/models/user.model.ts`
- Middleware: `src/middlewares/rate-limiter.middleware.ts`

**פונקציות עיקריות:**
```typescript
// AuthService.login() - מה קורה פנימה
static async login(credentials: LoginInput) {
  // 1. מצא משתמש
  const user = await UserModel.findOne({ email })
    .select('+password +failedLoginAttempts +lockedUntil');
  
  // 2. בדוק נעילה
  if (user.lockedUntil && new Date() < user.lockedUntil) {
    throw new ApiError(423, "Account locked");
  }
  
  // 3. אמת סיסמה
  const isValid = await user.comparePassword(credentials.password);
  if (!isValid) {
    user.failedLoginAttempts++;
    if (user.failedLoginAttempts >= 5) {
      user.lockedUntil = new Date(Date.now() + 15*60*1000);
    }
    await user.save();
    throw new UnauthorizedError("Invalid credentials");
  }
  
  // 4. איפוס + JWT
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  const token = jwt.sign({ userId: user._id }, JWT_SECRET);
  return { user, token };
}
```

---

### 3.2 זרימת Cart (עגלת קניות)

```
┌────────────────────────────────────────────────────────────┐
│ Client: POST /api/cart/add                                 │
│ Headers: { Authorization: "Bearer <token>" }               │
│ Body: { productId, quantity }                              │
└─────────────────┬──────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────────┐
│ requireAuth middleware                                      │
│ - בודק JWT token                                           │
│ - מוסיף req.userId = "user_123"                            │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────────┐
│ CartController.addToCart()                                  │
│ - מאמת productId, quantity                                 │
│ - קורא ל-CartService.addToCart()                           │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────────┐
│ CartService.addToCart()                                     │
│ 1. בודק מלאי מוצר ב-ProductModel                           │
│ 2. מנסה לקרוא cart מ-Redis (cache-first)                   │
│ 3. אם אין ב-Redis → קורא מ-MongoDB (fallback)              │
│ 4. מוסיף/מעדכן פריט בעגלה                                  │
│ 5. מחשב מחדש total                                         │
│ 6. שומר מיידית ב-Redis (fast write)                        │
│ 7. מתזמן שמירה ל-MongoDB בעוד 5 שניות (debounce)          │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────────┐
│ Response: { success: true, data: cart }                    │
└─────────────────────────────────────────────────────────────┘
```

**למה Redis + MongoDB?**

| מקרה | Redis | MongoDB | הסבר |
|------|-------|---------|------|
| **קריאה** | ✅ מחזיר | ❌ לא נגיש | 95% מהזמן Redis מהיר (5ms) |
| **קריאה אם Redis נפל** | ❌ timeout | ✅ מחזיר | Fallback - עדיין עובד אבל יותר איטי (50ms) |
| **כתיבה** | ✅ מיידי | ⏰ דחוי | Redis מהיר, Mongo נשמר אחרי 5 שניות |
| **שרת קרס** | ❌ נמחק | ✅ נשמר | Mongo persistent, Redis in-memory |

**Debounce Pattern:**
```typescript
// למה לא שומרים מיד ב-Mongo?
// אם משתמש משנה כמות 10 פעמים ב-10 שניות,
// לא רוצים 10 writes ל-MongoDB (יקר)
// במקום זאת: נחכה 5 שניות אחרי שינוי אחרון

private static scheduleMongoSave(cartId, cart) {
  // בטל timer קודם
  clearTimeout(this.pendingSaves.get(cartId));
  
  // צור timer חדש
  const timer = setTimeout(async () => {
    await CartModel.updateOne({ userId }, cart);
  }, 5000); // 5 שניות
  
  this.pendingSaves.set(cartId, timer);
}
```

---

### 3.3 זרימת Payment (התשלום - הזרימה הכי חשובה!)

```
┌────────────────────────────────────────────────────────────┐
│ PHASE 1: יצירת הזמנה                                       │
└────────────────────────────────────────────────────────────┘

Client: POST /api/orders
        ↓
OrderController.createOrder()
        ↓
OrderService.createOrder()
  1. קורא cart מ-CartModel
  2. בודק מלאי לכל פריט (אבל לא מפחית!)
  3. יוצר order עם status: "pending_payment"
  4. שומר ב-OrderModel
        ↓
PaymentService.createPaymentIntent()
  1. יוצר Stripe Checkout Session
  2. שומר payment record ב-PaymentModel
  3. מקשר order.paymentIntentId
        ↓
Response: { 
  order, 
  payment: { checkoutUrl: "https://checkout.stripe.com/..." }
}

┌────────────────────────────────────────────────────────────┐
│ PHASE 2: משתמש משלם                                        │
└────────────────────────────────────────────────────────────┘

1. Client redirects לurl של Stripe
2. משתמש מזין כרטיס אשראי בעמוד של Stripe (לא שלנו!)
3. Stripe מעבד תשלום
4. Stripe redirects ל-success/cancel URL
5. Stripe שולח webhook ל-/api/payments/webhook

┌────────────────────────────────────────────────────────────┐
│ PHASE 3: Webhook Processing (המרכזי!)                     │
└────────────────────────────────────────────────────────────┘

Stripe → POST /api/payments/webhook
         Body: event (raw JSON)
         Headers: { "Stripe-Signature": "..." }
        ↓
express.raw() middleware
  - שומר body כ-Buffer (לא JSON!)
  - חשוב לאימות חתימה
        ↓
PaymentController.webhook()
        ↓
PaymentService.handleWebhook()
  
  ┌─────────────────────────────────────────┐
  │ שכבה 1: אימות חתימה (Signature)        │
  └─────────────────────────────────────────┘
  StripeProvider.handleWebhook()
    - מחלץ חתימה מheader
    - מחשב HMAC-SHA256 של body
    - משווה עם החתימה של Stripe
    - אם לא תואם → זורק שגיאה (webhook מזויף!)
        ↓
  ┌─────────────────────────────────────────┐
  │ שכבה 2: Idempotency (מניעת כפילויות)   │
  └─────────────────────────────────────────┘
  בודק ב-WebhookEventModel אם eventId כבר עובד
    - אם כן → מחזיר success (כבר עיבדנו)
    - אם לא → ממשיך
        ↓
  ┌─────────────────────────────────────────┐
  │ שכבה 3: אימות סכום                     │
  └─────────────────────────────────────────┘
  מוצא order לפי metadata.orderId
  משווה: webhook.amount === order.totalAmount
    - אם לא תואם → שגיאת אבטחה!
    - אם תואם → ממשיך
        ↓
  ┌─────────────────────────────────────────┐
  │ שכבה 4: הפחתת מלאי (Atomic)             │
  └─────────────────────────────────────────┘
  PaymentService.fulfillOrder()
    - פותח MongoDB Transaction
    - לכל פריט: ProductModel.findByIdAndUpdate(
        { _id, stock: { $gte: quantity } }, // בדיקה אטומית
        { $inc: { stock: -quantity } }      // הפחתה אטומית
      )
    - אם אחד נכשל → rollback הכל
    - אם הכל הצליח → commit
    - מסמן order.fulfilled = true
    - מנקה cart
        ↓
  רושם ב-WebhookEventModel (למניעת עיבוד חוזר)
        ↓
Response: { received: true }
```

**למה 4 שכבות אבטחה?**

| שכבה | מגן מפני | איך |
|------|----------|-----|
| **Signature** | Webhook מזויף | תוקף יכול לשלוח POST אבל לא יודע את הsecret |
| **Idempotency** | Duplicate charges | אותו webhook מגיע 3 פעמים = נעבד פעם אחת |
| **Amount verification** | Price manipulation | Stripe נפרץ ושולח $1 להזמנה של $100 = נדחה |
| **Atomic transaction** | Race condition | 2 אנשים קונים פריט אחרון = רק 1 מצליח |

**קוד מרכזי:**
```typescript
// PaymentService.fulfillOrder() - הפחתת מלאי אטומית
static async fulfillOrder(orderId: string) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const order = await OrderModel.findById(orderId).session(session);
    
    // הפחת מלאי לכל פריט
    for (const item of order.items) {
      const result = await ProductModel.findByIdAndUpdate(
        item.product,
        { 
          $inc: { stock: -item.quantity },
          // ✅ בדיקה אטומית: רק אם יש מספיק מלאי
        },
        { 
          session,
          runValidators: true // וודא stock >= 0
        }
      );
      
      if (!result) {
        throw new Error("Insufficient stock");
      }
    }
    
    // סמן הזמנה כמולאה
    order.status = "confirmed";
    order.fulfilled = true;
    await order.save({ session });
    
    // נקה עגלה
    await CartModel.deleteOne({ userId: order.user }, { session });
    
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

---

## 4. מודולים ושכבות

### 4.1 Routes (נתיבים)

**תפקיד:** מיפוי URL לפונקציות + הוספת middleware

```typescript
// src/routes/auth.routes.ts
import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authRateLimiter } from "../middlewares/rate-limiter.middleware";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// Public routes
router.post("/register", authRateLimiter, AuthController.register);
router.post("/login", authRateLimiter, AuthController.login);

// Protected routes (צריך JWT)
router.get("/profile", authenticate, AuthController.getProfile);
router.post("/logout", authenticate, AuthController.logout);

export default router;
```

**למה לא שמים לוגיקה כאן?**
- Routes = רק routing
- Business logic שייך ל-Services
- HTTP logic שייך ל-Controllers
- **Separation of concerns!**

---

### 4.2 Controllers (בקרים)

**תפקיד:** קריאת request, קריאה ל-service, החזרת response

```typescript
// src/controllers/auth.controller.ts
export class AuthController {
  static async login(req: Request, res: Response) {
    // 1. אמת קלט
    const validated = loginSchema.parse(req.body);
    
    // 2. קרא לservice
    const result = await AuthService.login(validated);
    
    // 3. החזר response
    res.status(200).json({
      success: true,
      data: result,
      message: "Login successful"
    });
  }
}
```

**מה לא עושים כאן:**
- ❌ לא שואלים query לDB (זה ב-Service)
- ❌ לא מחשבים דברים (זה ב-Service)
- ✅ רק HTTP logic: קריאה, אימות, קריאה לservice, response

---

### 4.3 Services (שירותים)

**תפקיד:** Business logic, חישובים, אינטגרציות

```typescript
// src/services/auth.service.ts
export class AuthService {
  static async login(credentials: LoginInput) {
    // 1. שאילתת DB
    const user = await UserModel.findOne({ email: credentials.email })
      .select('+password');
    
    // 2. בדיקות עסקיות
    if (!user) throw new UnauthorizedError();
    if (user.lockedUntil > new Date()) {
      throw new ApiError(423, "Account locked");
    }
    
    // 3. חישובים
    const isValid = await user.comparePassword(credentials.password);
    if (!isValid) {
      user.failedLoginAttempts++;
      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15*60*1000);
      }
      await user.save();
      throw new UnauthorizedError();
    }
    
    // 4. יצירת token
    const token = this.generateToken(user._id);
    
    // 5. עדכון
    user.failedLoginAttempts = 0;
    user.lastLogin = new Date();
    await user.save();
    
    return { user: this.sanitizeUser(user), token };
  }
  
  private static generateToken(userId: string): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
  }
  
  private static sanitizeUser(user: any) {
    const { password, ...safe } = user.toObject();
    return safe;
  }
}
```

**למה Service נפרד?**
- ✅ Business logic במקום אחד
- ✅ ניתן לבדיקה (tests)
- ✅ ניתן לשימוש חוזר
- ✅ Controller פשוט וקריא

---

### 4.4 Models (מודלים)

**תפקיד:** הגדרת schema, validations, indexes, methods

```typescript
// src/models/user.model.ts
import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false // לא מחזירים בquery רגיל
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockedUntil: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // createdAt, updatedAt אוטומטי
});

// Hash password לפני שמירה
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method להשוואת סיסמה
UserSchema.methods.comparePassword = async function(candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

// Indexes לביצועים
UserSchema.index({ email: 1 }); // unique כבר יוצר index
UserSchema.index({ createdAt: -1 });

export const UserModel = model('User', UserSchema);
```

**למה Mongoose Schema?**
- ✅ Validation בשכבת DB
- ✅ Middleware hooks (pre/post)
- ✅ Methods ו-virtuals
- ✅ Type safety עם TypeScript

---

### 4.5 Middlewares (תוכנות ביניים)

#### 4.5.1 Authentication Middleware

```typescript
// src/middlewares/auth.middleware.ts
export class AuthMiddleware {
  static async requireAuth(req: Request, res: Response, next: NextFunction) {
    // 1. חלץ token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: "No token" });
    }
    const token = authHeader.split(' ')[1];
    
    // 2. אמת token
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await UserModel.findById(decoded.userId);
      if (!user) throw new Error();
      
      // 3. צרף לrequest
      req.userId = user._id;
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ error: "Invalid token" });
    }
  }
}
```

#### 4.5.2 Rate Limiting Middleware

```typescript
// src/middlewares/rate-limiter.middleware.ts
import rateLimit from "express-rate-limit";

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 דקות
  max: 5, // 5 נסיונות
  message: "Too many attempts, try again later",
  standardHeaders: true,
  keyGenerator: (req) => {
    // אם משתמש מחובר → rate limit לפי userId
    // אם לא → לפי IP
    return req.userId || req.ip;
  }
});
```

**למה Rate Limiting?**
- 🛡️ מניעת brute force (ניסיונות כניסה)
- 🛡️ מניעת DDoS (הצפת שרת)
- 🛡️ הגנת משאבים

#### 4.5.3 Idempotency Middleware

```typescript
// src/middlewares/idempotency.middleware.ts
export const idempotencyMiddleware = (resourceType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = req.headers['idempotency-key'];
    if (!key) return next(); // לא חובה
    
    // בדוק אם כבר עיבדנו
    const existing = await IdempotencyKeyModel.findOne({ key });
    if (existing) {
      // החזר את אותה תשובה
      return res.status(existing.responseStatus)
        .json(existing.responseBody);
    }
    
    // עבד ושמור תשובה
    const originalJson = res.json.bind(res);
    res.json = function(body: any) {
      IdempotencyKeyModel.create({
        key,
        responseStatus: res.statusCode,
        responseBody: body,
        expiresAt: new Date(Date.now() + 24*60*60*1000)
      });
      return originalJson(body);
    };
    
    next();
  };
};
```

**למה Idempotency?**
- משתמש לוחץ "שלח הזמנה" פעמיים בטעות
- Network timeout אז client שולח שוב
- בלי idempotency: 2 הזמנות, 2 חיובים
- עם idempotency: 1 הזמנה, תשובה זהה לשניהם

---

### 4.6 Error Handling (מערכת שגיאות)

#### 4.6.1 היררכיית שגיאות

```
                    AppError (בסיס)
                         │
     ┌──────────┬────────┼────────┬──────────┐
     │          │        │        │          │
ValidationError AuthError NotFound ConflictError PaymentError
   (400)        (401)    (404)     (409)       (400/402)
```

**קבצים מעורבים:**
- `src/utils/errors.ts` - הגדרת השגיאות
- `src/middlewares/error.middleware.ts` - טיפול בשגיאות
- `src/utils/asyncHandler.ts` - עטיפת async functions

#### 4.6.2 סוגי שגיאות

```typescript
// src/utils/errors.ts

// 1. שגיאה בסיסית - כל השאר יורשים ממנה
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
  ) {
    super(message);
    this.name = "AppError";
  }

  toJSON() {
    return {
      success: false,
      error: this.code || this.name,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}

// 2. שגיאת Validation (400)
export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 400, "VALIDATION_ERROR");
  }
}

// 3. שגיאת Authentication (401)
export class AuthError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

// 4. שגיאת Authorization (403)
export class AuthorizationError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

// 5. שגיאת Not Found (404)
export class NotFoundError extends AppError {
  constructor(public resource: string, public id?: string) {
    const message = id 
      ? `${resource} with id "${id}" not found`
      : `${resource} not found`;
    super(message, 404, "NOT_FOUND");
  }
}

// 6. שגיאת Conflict (409) - למשל email כפול
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
  }
}

// 7. שגיאת תשלום
export class PaymentError extends AppError {
  constructor(message: string, public paymentCode?: string) {
    super(message, 400, "PAYMENT_ERROR");
  }
}
```

#### 4.6.3 asyncHandler - עטיפת פונקציות Async

```typescript
// src/utils/asyncHandler.ts

// למה צריך את זה?
// בלי asyncHandler: שגיאות async לא נתפסות!
// עם asyncHandler: כל שגיאה עוברת ל-error middleware

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      logger.error({
        path: req.path,
        method: req.method,
        error: error.message,
        stack: error.stack,
      }, `Async handler error`);
      next(error); // מעביר ל-error middleware
    });
  };
};

// שימוש:
router.post("/login", asyncHandler(AuthController.login));
```

#### 4.6.4 Error Middleware - טיפול מרוכז בשגיאות

```typescript
// src/middlewares/error.middleware.ts

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  // 1. לוג מפורט
  logger.error({
    method: req.method,
    path: req.path,
    statusCode: err.statusCode || 500,
    message: err.message,
    stack: err.stack,
  }, "Request error");

  // 2. טיפול בסוגי שגיאות שונים
  
  // ApiError/AppError - שגיאות שלנו
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }

  // ZodError - שגיאות validation
  if (err.name === "ZodError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.errors,
      code: "VALIDATION_ERROR",
    });
  }

  // Default - שגיאה לא צפויה
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    code: "INTERNAL_ERROR",
  });
}
```

**למה מערכת שגיאות מסודרת?**
- ✅ תשובות API עקביות
- ✅ קל לדבג (לוגים מפורטים)
- ✅ קל לטפל ב-client (קודים ידועים)
- ✅ אבטחה (לא חושפים stack בproduction)

---

### 4.7 Validators (Zod) - אימות קלט

#### 4.7.1 מבנה מערכת Validation

```
┌────────────────────────────────────────────┐
│ Request Body                                │
│ { email: "test@...", password: "123" }     │
└──────────────────┬─────────────────────────┘
                   ↓
┌────────────────────────────────────────────┐
│ Zod Schema Validation                       │
│ loginSchema.parse(req.body)                │
└──────────────────┬─────────────────────────┘
                   │
           ┌───────┴───────┐
           │               │
        Valid           Invalid
           ↓               ↓
     Continue        ZodError thrown
     processing      → errorHandler
                     → 400 response
```

**קבצים מעורבים:**
- `src/validators/auth.validator.ts` - schemas לauth
- `src/validators/address.validator.ts` - schemas לכתובות
- `src/validators/order.validator.ts` - schemas להזמנות
- `src/validators/index.ts` - re-export מרכזי

#### 4.7.2 דוגמאות Schemas

```typescript
// src/validators/auth.validator.ts
import { z } from "zod";

// ===== REGISTER =====
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

// ===== LOGIN =====
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

// ===== CHANGE PASSWORD =====
// עם refine לvalidation מורכב
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
})
.refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], // איפה להציג את השגיאה
})
.refine((data) => data.currentPassword !== data.newPassword, {
  message: "New password must be different",
  path: ["newPassword"],
});
```

#### 4.7.3 פונקציות עזר ל-Validation

```typescript
// src/validators/index.ts

// פונקציה שזורקת שגיאה אם validation נכשל
export function validate<T>(schema: ZodSchema, data: unknown): T {
  try {
    return schema.parse(data) as T;
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0];
      const message = `${firstError.path.join(".")}: ${firstError.message}`;
      throw new ValidationError(message, firstError.path[0]?.toString());
    }
    throw error;
  }
}

// פונקציה שמחזירה tuple [data, error] במקום לזרוק
export function validateSafe<T>(
  schema: ZodSchema, 
  data: unknown
): [T | null, ValidationError | null] {
  try {
    return [schema.parse(data) as T, null];
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0];
      return [null, new ValidationError(firstError.message)];
    }
    return [null, new ValidationError("Validation failed")];
  }
}

// שימוש:
const [data, error] = validateSafe(loginSchema, req.body);
if (error) return res.status(400).json({ error: error.message });
```

**למה Zod ולא Joi/Yup?**

| Feature | Zod | Joi | Yup |
|---------|-----|-----|-----|
| TypeScript native | ✅ | ❌ | ⚠️ |
| Bundle size | קטן | גדול | בינוני |
| Type inference | ✅ מעולה | ❌ | ⚠️ |
| Runtime validation | ✅ | ✅ | ✅ |

---

### 4.8 Admin Panel (פאנל ניהול)

#### 4.8.1 יכולות Admin

```
┌─────────────────────────────────────────────────────┐
│ Admin Panel - AdminService                           │
├─────────────────────────────────────────────────────┤
│ 📦 Products                                          │
│   - listProducts(includeInactive)                   │
│   - createProduct(data)                             │
│   - updateProduct(id, data)                         │
│   - deleteProduct(id) → Soft delete!               │
├─────────────────────────────────────────────────────┤
│ 👥 Users                                             │
│   - listUsers(page, limit) → Paginated             │
│   - updateUserRole(userId, role)                   │
│   - ⚠️ Admin can't change own role                  │
├─────────────────────────────────────────────────────┤
│ 📋 Orders                                            │
│   - listOrders(status?, userId?)                   │
│   - updateOrderStatus(orderId, status, message?)   │
├─────────────────────────────────────────────────────┤
│ 📊 Statistics                                        │
│   - getStatsSummary() → Dashboard data             │
└─────────────────────────────────────────────────────┘
```

#### 4.8.2 קוד מרכזי

```typescript
// src/services/admin.service.ts

export class AdminService {
  // ===== PRODUCTS =====
  
  // רשימת מוצרים (כולל לא פעילים)
  static async listProducts(includeInactive = true) {
    const query = includeInactive ? {} : { isActive: true };
    return ProductModel.find(query).sort({ createdAt: -1 }).lean();
  }

  // Soft delete - לא מוחקים באמת!
  static async deleteProduct(id: string) {
    // למה soft delete?
    // 1. שמירת היסטוריה להזמנות ישנות
    // 2. אפשרות לשחזר
    // 3. דוחות לא נשברים
    const product = await ProductModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    if (!product) throw new Error("Product not found");
    return product;
  }

  // ===== USERS =====
  
  // שינוי role עם הגנות
  static async updateUserRole(
    targetUserId: string,
    role: "user" | "admin",
    actingUserId?: string
  ) {
    // אבטחה: Admin לא יכול להוריד את עצמו
    if (actingUserId && targetUserId === actingUserId) {
      throw new Error("Admins cannot change their own role");
    }

    const user = await UserModel.findById(targetUserId);
    if (!user) throw new Error("User not found");

    user.role = role;
    await user.save();
    return user;
  }

  // ===== STATISTICS =====
  
  static async getStatsSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      deliveredAgg,  // סך הכנסות
      openOrders,    // הזמנות פתוחות
      ordersToday,   // הזמנות היום
      lowStock,      // מוצרים במלאי נמוך
      usersCount,    // סך משתמשים
      productsCount, // סך מוצרים
    ] = await Promise.all([
      OrderModel.aggregate([
        { $match: { status: "delivered" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
      ]),
      OrderModel.countDocuments({ status: { $in: ["pending", "confirmed", "processing", "shipped"] } }),
      OrderModel.countDocuments({ createdAt: { $gte: today } }),
      ProductModel.countDocuments({ isActive: true, stock: { $lt: 5 } }),
      UserModel.countDocuments({}),
      ProductModel.countDocuments({ isActive: true }),
    ]);

    return {
      revenue: deliveredAgg[0]?.total || 0,
      deliveredOrders: deliveredAgg[0]?.count || 0,
      openOrders,
      ordersToday,
      lowStockProducts: lowStock,
      totalUsers: usersCount,
      totalProducts: productsCount,
    };
  }
}
```

**נקודות חשובות למראיין:**
- 🛡️ **Soft delete** - לעולם לא מוחקים data באמת
- 🛡️ **Self-protection** - Admin לא יכול להוריד את עצמו
- ⚡ **Parallel queries** - Promise.all לסטטיסטיקות
- 📊 **Aggregation** - שימוש ב-MongoDB aggregation לחישובים

---

### 4.9 Address Management (ניהול כתובות)

#### 4.9.1 מבנה

```
┌─────────────────────────────────────────────────────┐
│ User                                                 │
│ _id: "user_123"                                     │
│                                                      │
│ ┌─────────────────┐  ┌─────────────────┐            │
│ │ Address 1       │  │ Address 2       │            │
│ │ ⭐ isDefault    │  │                 │            │
│ │ street: "..."   │  │ street: "..."   │            │
│ │ city: "..."     │  │ city: "..."     │            │
│ └─────────────────┘  └─────────────────┘            │
└─────────────────────────────────────────────────────┘
```

#### 4.9.2 AddressService

```typescript
// src/services/addresses.service.ts

export class AddressService {
  // קבלת כל הכתובות (default ראשונה)
  static async getAddresses(userId: string) {
    return AddressModel.find({ user: userId })
      .sort({ isDefault: -1, createdAt: -1 }); // default ראשון
  }

  // הגדרת כתובת כברירת מחדל
  static async setDefaultAddress(userId: string, addressId: string) {
    // 1. הסר default מהקודם
    await AddressModel.updateMany(
      { user: userId, isDefault: true },
      { $set: { isDefault: false } }
    );
    
    // 2. הגדר את החדש כ-default
    const address = await AddressModel.findOneAndUpdate(
      { _id: addressId, user: userId },
      { $set: { isDefault: true } },
      { new: true }
    );
    
    if (!address) throw new Error("Address not found");
    return address;
  }

  // יצירת כתובת (ראשונה = default אוטומטי)
  static async createAddress(userId: string, data: CreateAddressDTO) {
    const existingCount = await AddressModel.countDocuments({ user: userId });
    
    const addressData = {
      user: userId,
      street: data.street,
      city: data.city,
      postalCode: data.postalCode,
      country: data.country,
      // אם זו הכתובת הראשונה → default אוטומטי
      isDefault: existingCount === 0 ? true : data.isDefault || false,
    };
    
    return AddressModel.create(addressData);
  }
}
```

---

### 4.10 Sequence Model (מספרי הזמנה)

#### 4.10.1 הבעיה: Race Condition במספרים

```
❌ בלי Sequence:
Thread A: lastOrder = 100, newOrder = 101
Thread B: lastOrder = 100, newOrder = 101  ← כפילות!

✅ עם Sequence (Atomic):
Thread A: $inc → returns 101
Thread B: $inc → returns 102  ← מובטח ייחודי
```

#### 4.10.2 Implementation

```typescript
// src/models/sequence.model.ts

const SequenceSchema = new Schema({
  _id: { type: String, required: true },  // "order_20260125"
  value: { type: Number, default: 0 },
});

export const SequenceModel = model("Sequence", SequenceSchema);

/**
 * Get next sequence atomically
 * Uses MongoDB $inc - guaranteed unique even under load
 */
export async function getNextSequence(key: string): Promise<number> {
  const result = await SequenceModel.findByIdAndUpdate(
    key,
    { $inc: { value: 1 } },  // Atomic increment
    { new: true, upsert: true }  // Create if doesn't exist
  );
  return result!.value;
}

// שימוש ב-OrderService:
const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
const seq = await getNextSequence(`order_${today}`);
const orderNumber = `ORD-${today}-${seq.toString().padStart(4, "0")}`;
// Result: "ORD-20260203-0001"
```

**למה לא UUID?**
- 🔢 מספר רציף = קל למעקב
- 📞 קל לתקשורת בטלפון
- 📊 קל לזהות סדר כרונולוגי
- ✅ Atomic = אין כפילויות

---

### 4.11 Audit Logging (רישום פעולות אבטחה)

#### 4.11.1 מה זה Audit Log?

```
כל פעולה רגישה נרשמת לנצח:
- מי עשה? (userId)
- מה עשה? (action)
- על מה? (resourceType, resourceId)
- מתי? (timestamp)
- מאיפה? (ipAddress, userAgent)
- הצליח? (status: success/failure)
```

#### 4.11.2 Actions נרשמים

```typescript
// src/models/audit-log.model.ts

action: {
  type: String,
  enum: [
    // Authentication
    "LOGIN",
    "LOGIN_FAILED",
    "LOGOUT",
    "PASSWORD_CHANGED",
    "PASSWORD_RESET_REQUESTED",

    // Administrative
    "ROLE_GRANTED",
    "ROLE_REVOKED",
    "USER_CREATED",

    // Payment
    "PAYMENT_INITIATED",
    "PAYMENT_SUCCEEDED",
    "PAYMENT_FAILED",
    "REFUND_PROCESSED",

    // Orders
    "ORDER_CREATED",
    "ORDER_CANCELLED",
    "ORDER_STATUS_CHANGED",
  ]
}
```

#### 4.11.3 AuditLogService

```typescript
// src/services/audit-log.service.ts

export class AuditLogService {
  /**
   * Record audit log - FIRE AND FORGET
   * - לא מעכב את הבקשה
   * - כשל לא מפיל את האפליקציה
   */
  static async log(entry: AuditLogEntry): Promise<void> {
    try {
      await AuditLogModel.create({
        ...entry,
        timestamp: entry.timestamp || new Date(),
      });
      
      log.debug("audit", "Audit log recorded", {
        action: entry.action,
        status: entry.status,
      });
    } catch (error) {
      // CRITICAL: כשל ב-audit לא מפיל את האפליקציה!
      log.error("AUDIT_LOG_FAILURE - Check MongoDB", { error });
    }
  }

  // Query: כל הפעולות של משתמש
  static async getUserActivity(userId: string, options?: QueryOptions) {
    return AuditLogModel.find({ userId })
      .sort({ timestamp: -1 })
      .limit(options?.limit || 100);
  }

  // Query: כשלונות login (לזיהוי brute force)
  static async getFailedLogins(since: Date) {
    return AuditLogModel.find({
      action: "LOGIN_FAILED",
      timestamp: { $gte: since },
    }).sort({ timestamp: -1 });
  }
}
```

#### 4.11.4 דוגמת שימוש

```typescript
// בתוך AuthService.login():
if (!isValidPassword) {
  await AuditLogService.log({
    userId: user._id.toString(),
    action: "LOGIN_FAILED",
    resourceType: "USER",
    resourceId: user._id.toString(),
    status: "failure",
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    context: { reason: "invalid_password" },
  });
}
```

**למה Audit Log?**
- 🔒 **Compliance** - SOC2, PCI-DSS, GDPR דורשים audit trail
- 🕵️ **Investigation** - מה קרה ומתי
- ⚠️ **Alerting** - 100 failed logins = התקפה
- 📊 **Analytics** - דפוסי שימוש

---

### 4.12 Swagger/OpenAPI (תיעוד API)

#### 4.12.1 מה זה?

```
┌─────────────────────────────────────────────────────┐
│ http://localhost:5000/api/docs                       │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ 🔐 Auth                                         │ │
│ │   POST /auth/register                           │ │
│ │   POST /auth/login                              │ │
│ │   GET /auth/profile                             │ │
│ ├─────────────────────────────────────────────────┤ │
│ │ 📦 Products                                     │ │
│ │   GET /products                                 │ │
│ │   GET /products/{id}                            │ │
│ ├─────────────────────────────────────────────────┤ │
│ │ 🛒 Cart                                         │ │
│ │   POST /cart/add                                │ │
│ │   GET /cart                                     │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ [Try it out] - בדיקה ישירה מהדפדפן!                │
└─────────────────────────────────────────────────────┘
```

#### 4.12.2 Configuration

```typescript
// src/swagger.ts
import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Simple Shop Backend API",
      description: "E-commerce backend with Stripe, MongoDB, Redis",
      version: "1.0.0",
    },
    servers: [
      { url: process.env.API_URL || "http://localhost:5000" },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: { type: "string" },
            email: { type: "string", format: "email" },
            name: { type: "string" },
            role: { type: "string", enum: ["customer", "admin"] },
          },
        },
        Product: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            price: { type: "number" },
            stock: { type: "integer" },
          },
        },
        // ... more schemas
      },
    },
  },
  apis: ["./src/routes/*.ts"], // קורא JSDoc מהroutes
};

export const swaggerSpec = swaggerJsdoc(options);
```

#### 4.12.3 JSDoc בRoutes

```typescript
// src/routes/auth.routes.ts

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", AuthController.login);
```

**למה Swagger?**
- 📖 **תיעוד חי** - תמיד מעודכן עם הקוד
- 🧪 **בדיקות** - Try it out ישירות מהדפדפן
- 🤝 **Frontend** - מפתחי frontend יודעים מה לצפות
- 📋 **Onboarding** - מפתח חדש מבין את ה-API תוך דקות

---

## 5. אבטחה

### 5.1 שכבות אבטחה

| שכבה | מה | איפה | איך |
|------|-----|------|-----|
| **Input Validation** | אימות קלט | Zod schemas | מונע injection, XSS |
| **Authentication** | זיהוי משתמש | JWT + tokenVersion | Stateless, secure |
| **Authorization** | הרשאות | Middleware | Role-based, resource-based |
| **Rate Limiting** | הגבלת קצב | express-rate-limit | מניעת brute force |
| **Account Lockout** | נעילת חשבון | UserModel | אחרי 5 כשלונות |
| **Token Revocation** | ביטול טוקנים | tokenVersion | Instant logout |
| **HTTPS** | הצפנת תקשורת | Production | TLS certificate |
| **CORS** | הגבלת domains | corsConfig | רק origins מורשים |
| **Helmet** | Security headers | helmet() | XSS, clickjacking |
| **Password Hashing** | הצפנת סיסמאות | bcrypt | Salt + rounds=12 |
| **Webhook Signature** | אימות webhooks | HMAC-SHA256 | מניעת spoofing |

### 5.2 מנגנון tokenVersion (ביטול טוקנים מיידי) 🆕

**הבעיה:** JWT הוא stateless - אחרי שנוצר, השרת לא יכול לבטל אותו. 
אם משתמש עושה logout, הטוקן עדיין תקף עד שפג תוקפו.

**הפתרון:** שדה `tokenVersion` במודל User

```typescript
// User Model - src/models/user.model.ts
const userSchema = new Schema({
  email: String,
  password: String,
  tokenVersion: { type: Number, default: 0 }, // 🆕
  // ...
});
```

**איך עובד:**

```
┌─────────────────────────────────────────────────────────────┐
│ Login: יוצר JWT עם tokenVersion הנוכחי                      │
│                                                             │
│ JWT Payload: { userId: "123", tokenVersion: 0 }            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ כל Request: בודק tokenVersion בטוקן מול ה-DB               │
│                                                             │
│ if (token.tokenVersion !== user.tokenVersion) {            │
│   throw new Error("Token revoked");                        │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Logout: מעלה tokenVersion ב-1                               │
│                                                             │
│ user.tokenVersion++;  // 0 → 1                             │
│ await user.save();                                          │
│                                                             │
│ 💥 כל הטוקנים הישנים (עם tokenVersion=0) נפסלים מיידית!  │
└─────────────────────────────────────────────────────────────┘
```

**קוד מפתח:**

```typescript
// AuthService - src/services/auth.service.ts

// יצירת טוקן עם tokenVersion
static generateToken(userId: string, tokenVersion: number): string {
  return jwt.sign(
    { userId, tokenVersion },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// אימות טוקן + בדיקת tokenVersion
static async verifyToken(token: string) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await UserModel.findById(decoded.userId);
  
  // 🔐 בדיקה קריטית: האם הטוקן עדיין תקף?
  if (decoded.tokenVersion !== user.tokenVersion) {
    throw new Error("Token has been revoked");
  }
  
  return user;
}

// התנתקות - מבטלת כל הטוקנים
static async logout(userId: string) {
  await UserModel.findByIdAndUpdate(userId, {
    $inc: { tokenVersion: 1 }  // מעלה ב-1
  });
}
```

**מתי tokenVersion עולה?**
- ✅ Logout (התנתקות)
- ✅ שינוי סיסמה
- ✅ Admin מבטל גישה למשתמש

**למה זה מאובטח?**
| מקרה | ללא tokenVersion | עם tokenVersion |
|------|-----------------|-----------------|
| משתמש עושה logout | טוקן עדיין תקף 7 ימים ❌ | טוקן נפסל מיידית ✅ |
| תוקף גונב טוקן | יכול להשתמש עד expiry ❌ | logout מבטל גישה ✅ |
| שינוי סיסמה | טוקנים ישנים תקפים ❌ | כל הטוקנים נפסלים ✅ |

### 5.2 דוגמאות לאבטחה

#### 5.2.1 Input Validation (Zod)

```typescript
// src/validators/auth.validator.ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string()
    .email("Invalid email")
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(6, "Password too short")
    .max(100, "Password too long")
});

// שימוש ב-controller
const validated = loginSchema.parse(req.body);
// אם הvalidation נכשל → זורק שגיאה עם פירוט
```

**למה Zod?**
- ✅ Type-safe (TypeScript משלב)
- ✅ הודעות שגיאה ברורות
- ✅ מונע NoSQL injection
- ✅ מונע XSS

#### 5.2.2 CORS Configuration

```typescript
// src/config/cors.ts
import cors from "cors";

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:5173'
];

export default cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // אפשר cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
});
```

#### 5.2.3 SQL/NoSQL Injection Prevention

```typescript
// ❌ לא בטוח
const user = await UserModel.findOne({ 
  email: req.body.email // אם email = { $gt: "" } → מחזיר כל משתמש!
});

// ✅ בטוח
const validated = loginSchema.parse(req.body); // Zod מאמת שזה string
const user = await UserModel.findOne({ 
  email: validated.email // עכשיו בטוח
});

// ✅ גם בטוח - whitelist
const VALID_STATUSES = ['pending', 'confirmed', 'shipped'];
if (VALID_STATUSES.includes(req.query.status)) {
  query.status = req.query.status;
}
```

---

## 6. ביצועים וסקלביליות

### 6.1 אסטרטגיות Caching

#### 6.1.1 Two-Tier Caching (Redis + MongoDB)

```
┌─────────────────────────────────────────────┐
│ Read Request                                 │
└───────────────┬─────────────────────────────┘
                ↓
        ┌───────────────┐
        │ Redis Cache   │ ← Hot data (5ms)
        │ TTL: 1 hour   │
        └───────┬───────┘
                │
        Cache Hit? ────────┐
                │          │
                No         Yes
                ↓          ↓
        ┌───────────┐  Return
        │ MongoDB   │  to client
        │ (50ms)    │
        └───────┬───┘
                ↓
        Update Redis
                ↓
        Return to client
```

**Trade-offs:**

| Scenario | Latency | Durability |
|----------|---------|------------|
| Redis hit | 5ms | ❌ Volatile |
| Redis miss → Mongo | 50ms | ✅ Persistent |
| Redis down → Mongo | 50ms | ✅ Still works |
| Both down | ❌ Fail | ❌ Fail |

**Implementation:**
```typescript
// CartService.getCart()
static async getCart(userId: string) {
  // 1. Try Redis first
  const cached = await redis.get(`cart:${userId}`);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // 2. Fallback to MongoDB
  const cart = await CartModel.findOne({ userId }).populate('items.product');
  if (cart) {
    // 3. Update Redis for next time
    await redis.setex(`cart:${userId}`, 3600, JSON.stringify(cart));
  }
  
  return cart;
}
```

#### 6.1.2 Debounce Pattern (עגלה)

```typescript
// במקום לשמור ב-MongoDB בכל שינוי:
// User changes quantity: 1 → 2 → 3 → 5 → 4
// ❌ 5 writes to MongoDB (slow, expensive)

// עם debounce:
// User changes quantity: 1 → 2 → 3 → 5 → 4
// ✅ 1 write to MongoDB (5 seconds after last change)

private static scheduleMongoSave(cartId: string, cart: any) {
  // Cancel previous timer
  if (this.pendingSaves.has(cartId)) {
    clearTimeout(this.pendingSaves.get(cartId));
  }
  
  // Schedule new save
  const timer = setTimeout(async () => {
    await CartModel.updateOne({ userId: cart.userId }, cart);
    this.pendingSaves.delete(cartId);
  }, 5000); // 5 seconds
  
  this.pendingSaves.set(cartId, timer);
}
```

### 6.2 Database Optimization

#### 6.2.1 Indexes

```typescript
// UserSchema indexes
UserSchema.index({ email: 1 }); // Login queries
UserSchema.index({ createdAt: -1 }); // Admin list

// OrderSchema indexes
OrderSchema.index({ user: 1, createdAt: -1 }); // User's orders
OrderSchema.index({ status: 1 }); // Filter by status
OrderSchema.index({ orderNumber: 1 }); // Track order

// PaymentSchema indexes
PaymentSchema.index({ order: 1 }); // Find by order
PaymentSchema.index({ providerPaymentId: 1 }); // Webhook lookup
```

**למה Indexes?**
- ללא index: O(n) - סריקה מלאה
- עם index: O(log n) - חיפוש בינארי
- עלות: מקום על דיסק, עדכון לאט יותר
- תועלת: queries מהירים פי 100-1000

#### 6.2.2 Lean Queries

```typescript
// ❌ רגיל - מחזיר Mongoose document (heavy)
const user = await UserModel.findById(id); // ~5ms

// ✅ Lean - מחזיר plain JavaScript object (light)
const user = await UserModel.findById(id).lean(); // ~2ms

// מתי להשתמש?
// - Read-only queries
// - API responses
// - כשלא צריך Mongoose methods
```

#### 6.2.3 Select Fields

```typescript
// ❌ מביא הכל (גדול, איטי)
const user = await UserModel.findById(id);

// ✅ רק מה שצריך
const user = await UserModel.findById(id)
  .select('name email role')
  .lean();
```

### 6.3 Connection Pooling

```typescript
// src/config/db.ts
mongoose.connect(MONGO_URI, {
  maxPoolSize: 10, // 10 connections in pool
  minPoolSize: 2,  // Keep 2 always open
  socketTimeoutMS: 45000,
});
```

**למה Pool?**
- חיבור חדש = 50-100ms
- שימוש חוזר מpool = 0ms
- עלות: זיכרון
- תועלת: latency נמוך

---

## 7. Observability

### 7.1 Logging (Pino)

```typescript
// src/utils/logger.ts
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' 
    ? { target: 'pino-pretty' } // צבעוני, קריא
    : undefined // JSON בproduction
});

// שימוש
logger.info({ userId, orderId }, 'Order created');
logger.error({ error, requestId }, 'Payment failed');
```

**Structured Logging:**
```json
{
  "level": "info",
  "time": 1640000000000,
  "msg": "Order created",
  "userId": "user_123",
  "orderId": "order_456",
  "requestId": "req-uuid-789"
}
```

**למה JSON?**
- ✅ ניתן לחיפוש (ELK, CloudWatch)
- ✅ ניתן לפילטור
- ✅ ניתן למדידות (error rate, latency)

### 7.2 Metrics (Prometheus)

```typescript
// src/utils/metrics.ts
import { Counter, Histogram } from 'prom-client';

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status']
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'route'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

// Middleware
export function metricsMiddleware(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestTotal.inc({ 
      method: req.method, 
      route: req.route.path, 
      status: res.statusCode 
    });
    httpRequestDuration.observe({ 
      method: req.method, 
      route: req.route.path 
    }, duration);
  });
  
  next();
}
```

**Endpoint לPrometheus:**
```typescript
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### 7.3 Health Checks

```typescript
// src/controllers/health.controller.ts
export async function getHealth(req, res) {
  const mongoOk = mongoose.connection.readyState === 1;
  const redisOk = redis.status === 'ready';
  
  // בדוק webhooks
  const failedWebhooks = await FailedWebhookModel.countDocuments({
    status: 'pending'
  });
  
  const healthy = mongoOk && redisOk && failedWebhooks < 10;
  
  res.json({
    status: healthy ? 'healthy' : 'degraded',
    mongodb: mongoOk ? 'connected' : 'disconnected',
    redis: redisOk ? 'connected' : 'disconnected',
    webhooks: {
      failedPending: failedWebhooks,
      warning: failedWebhooks > 5 ? 'High failure rate' : null
    },
    uptime: process.uptime()
  });
}
```

---

## 8. Testing (בדיקות)

### 8.1 מבנה Testing בפרויקט

```
src/__tests__/
├── auth.test.ts         # Unit tests לauthentication
├── health.test.ts       # Health endpoint tests
├── products.test.ts     # Product CRUD tests
├── order.test.ts        # Order flow tests
├── payment-webhook.test.ts  # Webhook processing tests
├── integration.test.ts  # Full flow tests (cart→order→payment)
└── performance.test.ts  # Load/stress tests
```

### 8.2 Jest Configuration

```javascript
// jest.config.js
module.exports = {
  testMatch: ["**/dist/__tests__/**/*.js"],  // רץ על compiled JS
  testTimeout: 30000,  // 30 שניות timeout (לDB operations)
  maxWorkers: 1,       // רץ בסדרה (לא parallel - מונע race conditions)
  forceExit: true,     // סוגר connections אחרי tests
  setupFilesAfterEnv: ["<rootDir>/dist/test-setup.js"],  // Setup לפני tests
  testEnvironment: "node",
  verbose: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/__tests__/**",
    "!src/**/*.d.ts"
  ]
};
```

**למה maxWorkers: 1?**
- Tests משתמשים באותו DB
- Parallel tests יכולים לדרוס אחד את השני
- מונע race conditions בבדיקות

### 8.3 סוגי בדיקות

#### 8.3.1 Unit Tests - Authentication

```typescript
// src/__tests__/auth.test.ts
import request from "supertest";
import app from "../app";
import { UserModel } from "../models/user.model";
import { connectMongo } from "../config/db";

describe("Auth Routes - Authentication", () => {
  /**
   * מה בודקים כאן:
   * 1. Registration - הרשמה תקינה ושגיאות
   * 2. Login - כניסה תקינה ושגיאות
   * 3. Protected endpoints - גישה עם/בלי token
   */

  beforeAll(async () => {
    await connectMongo();  // חיבור לDB לפני tests
  });

  afterEach(async () => {
    await UserModel.deleteMany({});  // ניקוי אחרי כל test
  });

  // ===== REGISTRATION TESTS =====
  describe("POST /api/auth/register", () => {
    
    it("should register user with valid credentials", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "New User",
          email: "newuser@example.com",
          password: "SecurePass123!",
          confirmPassword: "SecurePass123!",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe("newuser@example.com");
    });

    it("should reject registration with missing email", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Missing Email",
          password: "SecurePass123!",
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe("VALIDATION_ERROR");
    });

    it("should reject duplicate email registration", async () => {
      // Register first user
      await request(app).post("/api/auth/register").send({
        name: "First User",
        email: "duplicate@example.com",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
      });

      // Try same email
      const response = await request(app).post("/api/auth/register").send({
        name: "Second User",
        email: "duplicate@example.com",
        password: "AnotherPass123!",
        confirmPassword: "AnotherPass123!",
      });

      expect(response.status).toBe(409);
      expect(response.body.code).toBe("CONFLICT");
    });
  });

  // ===== LOGIN TESTS =====
  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      // Create test user before each login test
      await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "test@example.com",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
      });
    });

    it("should login with correct credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "SecurePass123!",
        });

      expect(response.status).toBe(200);
      expect(response.body.data.token).toBeDefined();
    });

    it("should reject incorrect password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "WrongPassword!",
        });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe("UNAUTHORIZED");
    });
  });

  // ===== PROTECTED ENDPOINT TESTS =====
  describe("Protected Endpoints", () => {
    let accessToken: string;

    beforeEach(async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Protected User",
        email: "protected@example.com",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
      });
      accessToken = res.body.data.token;
    });

    it("should reject access without token", async () => {
      const response = await request(app).get("/api/auth/profile");
      expect(response.status).toBe(401);
    });

    it("should allow access with valid token", async () => {
      const response = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(response.status).toBe(200);
    });
  });
});
```

#### 8.3.2 Integration Tests - Full Payment Flow

```typescript
// src/__tests__/integration.test.ts

describe("Integration Tests - Complete Payment Flow", () => {
  /**
   * מה בודקים כאן:
   * 1. User registration → authentication
   * 2. Add product to cart
   * 3. Create order from cart
   * 4. Simulate payment webhook
   * 5. Verify stock reduction
   * 6. Verify cart cleared
   */

  let accessToken: string;
  let productId: string;

  beforeEach(async () => {
    // Setup: Create user + product
    const userRes = await request(app)
      .post("/api/auth/register")
      .send({ /* ... */ });
    accessToken = userRes.body.data.token;

    const product = await ProductModel.create({
      sku: "INT-SKU-001",
      name: "Test Product",
      price: 49.99,
      stock: 100,
      category: "electronics",
    });
    productId = product._id.toString();
  });

  afterEach(async () => {
    // Cleanup
    await Promise.all([
      UserModel.deleteMany({}),
      OrderModel.deleteMany({}),
      ProductModel.deleteMany({}),
      CartModel.deleteMany({}),
    ]);
  });

  it("should complete full cart → order → checkout flow", async () => {
    // STEP 1: Add to cart
    const cartRes = await request(app)
      .post("/api/cart/add")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ productId, quantity: 2 });
    
    expect(cartRes.status).toBe(200);

    // STEP 2: Verify cart has item
    const getCartRes = await request(app)
      .get("/api/cart")
      .set("Authorization", `Bearer ${accessToken}`);
    
    expect(getCartRes.body.data.items).toHaveLength(1);

    // STEP 3: Create order
    const orderRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        shippingAddress: {
          street: "123 Test St",
          city: "Test City",
          postalCode: "12345",
          country: "Israel",
        },
      });

    expect(orderRes.status).toBe(201);
    expect(orderRes.body.data.order.status).toBe("pending_payment");
    expect(orderRes.body.data.payment.checkoutUrl).toBeDefined();
  });
});
```

### 8.4 Testing Patterns

#### 8.4.1 AAA Pattern (Arrange-Act-Assert)

```typescript
it("should reject login after account lockout", async () => {
  // ARRANGE - הכנה
  const email = "locked@example.com";
  await createUser({ email, password: "correct" });

  // ACT - פעולה (5 ניסיונות כושלים)
  for (let i = 0; i < 5; i++) {
    await request(app)
      .post("/api/auth/login")
      .send({ email, password: "wrong" });
  }

  // Try with correct password
  const response = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "correct" });

  // ASSERT - בדיקה
  expect(response.status).toBe(423);  // Locked
  expect(response.body.message).toContain("locked");
});
```

#### 8.4.2 Mocking External Services

```typescript
// Mock Stripe for webhook tests
jest.mock("stripe", () => ({
  default: jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: jest.fn().mockReturnValue({
        type: "checkout.session.completed",
        data: {
          object: {
            metadata: { orderId: "test-order-id" },
            amount_total: 9999,  // $99.99 in cents
          },
        },
      }),
    },
  })),
}));

it("should process webhook and reduce stock", async () => {
  // Webhook test with mocked Stripe
  const response = await request(app)
    .post("/api/payments/webhook")
    .set("Stripe-Signature", "mock-signature")
    .send(mockWebhookPayload);

  expect(response.status).toBe(200);
  
  // Verify stock was reduced
  const product = await ProductModel.findById(productId);
  expect(product.stock).toBe(98);  // 100 - 2
});
```

### 8.5 הרצת Tests

```bash
# Build TypeScript first
npm run build

# Run all tests
npm test

# Run specific test file
npm test -- --testPathPattern=auth

# Run with coverage
npm test -- --coverage

# Watch mode (לפיתוח)
npm test -- --watch
```

### 8.6 שאלות מראיין על Testing

#### ❓ "איזה סוגי בדיקות יש בפרויקט?"

**תשובה:**
"3 סוגי בדיקות:

1. **Unit Tests** - בודקים פונקציה בודדת בבידוד
   - דוגמה: בדיקה ש-login מחזיר token

2. **Integration Tests** - בודקים מספר מערכות ביחד
   - דוגמה: cart → order → payment flow

3. **Performance Tests** - בודקים עומס
   - דוגמה: 100 בקשות במקביל

כל test משתמש ב-AAA pattern: Arrange, Act, Assert"

---

#### ❓ "איך בודקים webhooks?"

**תשובה:**
"**Mocking Stripe:**
```typescript
jest.mock('stripe', () => ({
  webhooks: {
    constructEvent: jest.fn().mockReturnValue(mockEvent)
  }
}));
```

ככה אני יכול לבדוק:
1. **Happy path** - webhook מגיע → מלאי יורד
2. **Idempotency** - אותו webhook פעמיים → עיבוד פעם אחת
3. **Error handling** - סכום לא תואם → נדחה

בלי mock הייתי צריך Stripe account אמיתי לtests."

---

## 9. שאלות מראיין נפוצות

### 9.1 ארכיטקטורה

#### ❓ "תסביר את הארכיטקטורה של הפרויקט"

**תשובה:**
"הפרויקט בנוי בארכיטקטורת MVC + Layers:
- **Routes** - מיפוי URLs לcontrollers
- **Controllers** - HTTP logic, אימות קלט, קריאה לservices
- **Services** - business logic, חישובים, אינטגרציות
- **Models** - MongoDB schemas, validations

המערכת משתמשת ב-**Express middleware pipeline** שעובר דרך:
1. Security (helmet, CORS)
2. Parsing (json, urlencoded)
3. Logging (request ID, structured logs)
4. Authentication (JWT verification)
5. Rate limiting (brute force prevention)

**Data flow:**
Client → Middleware → Controller → Service → Model → Database"

---

#### ❓ "איך בחרת את הטכנולוגיות?"

**תשובה:**
- **Node.js + Express**: ביצועים טובים, ecosystem עשיר, non-blocking I/O
- **TypeScript**: type safety מפחית bugs, refactoring בטוח יותר
- **MongoDB**: schema גמיש למוצרים, ACID transactions למלאי
- **Redis**: caching מהיר (5ms vs 50ms MongoDB)
- **Stripe**: PCI compliant, אנחנו לא נוגעים בכרטיסי אשראי
- **JWT**: stateless auth, scalable, לא צריך session store

---

### 9.2 אבטחה

#### ❓ "איך מונעים brute force attacks?"

**תשובה מלאה:**
"3 שכבות הגנה:

**1. Rate Limiting**
```typescript
authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 דקות
  max: 5 // 5 נסיונות
});
```
מגביל 5 נסיונות ל-15 דקות לפי IP או userId.

**2. Account Lockout**
```typescript
if (user.failedLoginAttempts >= 5) {
  user.lockedUntil = new Date(Date.now() + 15*60*1000);
}
```
נועל חשבון ל-15 דקות אחרי 5 כשלונות.

**3. Audit Logging**
מתעדים כל ניסיון כושל ל-`AuditLogModel` כדי לזהות דפוסי התקפה."

---

#### ❓ "איך מאמתים webhooks מStripe?"

**תשובה:**
"4 שכבות אבטחה:

**1. Signature Verification (HMAC-SHA256)**
```typescript
const event = stripe.webhooks.constructEvent(
  req.body, // raw buffer
  req.headers['stripe-signature'],
  WEBHOOK_SECRET
);
```
Stripe חותם כל webhook עם HMAC. אנחנו מאמתים שהחתימה תואמת.

**2. Idempotency**
```typescript
const existing = await WebhookEventModel.findOne({ eventId });
if (existing) return; // כבר עיבדנו
```
אותו webhook יכול להגיע מספר פעמים. אנחנו עוברים רק פעם אחת.

**3. Amount Verification**
```typescript
if (webhook.amount !== order.totalAmount) {
  throw new Error('Amount mismatch - security alert');
}
```
משווים את הסכום ב-webhook לסכום ב-database שלנו.

**4. Atomic Stock Reduction**
```typescript
await ProductModel.findByIdAndUpdate(
  productId,
  { $inc: { stock: -quantity } },
  { session } // MongoDB transaction
);
```
מונע overselling גם אם 2 webhooks מגיעים בו-זמנית."

---

### 9.3 ביצועים

#### ❓ "איך מטפלים בעומס גבוה?"

**תשובה:**
"מספר אסטרטגיות:

**1. Two-Tier Caching**
- Redis לעגלות (5ms latency)
- MongoDB fallback (50ms)
- 95% cache hit rate

**2. Connection Pooling**
```typescript
mongoose.connect(uri, {
  maxPoolSize: 10,
  minPoolSize: 2
});
```
שימוש חוזר בconnections במקום ליצור חדשים.

**3. Database Indexes**
```typescript
UserSchema.index({ email: 1 });
OrderSchema.index({ user: 1, createdAt: -1 });
```
Queries מהירים פי 100-1000.

**4. Debounce Writes**
```typescript
// עגלה: שמירה ל-MongoDB רק אחרי 5 שניות ללא שינוי
scheduleMongoSave(cartId, cart, 5000);
```

**5. Horizontal Scaling**
- Stateless design (JWT, לא sessions)
- יכול לרוץ על מספר instances מאחורי load balancer"

---

#### ❓ "למה Redis וגם MongoDB לעגלה?"

**תשובה:**
"**Redis = Speed, MongoDB = Durability**

| Scenario | Redis | MongoDB |
|----------|-------|---------|
| Read (normal) | ✅ 5ms | ❌ |
| Read (Redis down) | ❌ | ✅ 50ms |
| Write | ✅ Instant | ⏰ +5s (debounced) |
| Server crash | ❌ Lost | ✅ Persistent |

**Trade-off:**
- 95% מהבקשות מהירות (Redis)
- 5% יותר איטיות (Redis miss)
- אבל עגלה לא אובדת אם Redis קורס

**Best of both worlds:**
- Performance של in-memory cache
- Reliability של persistent database"

---

### 9.4 תשלומים

#### ❓ "מה קורה אם 2 אנשים קונים את אותו פריט אחרון?"

**תשובה:**
"**MongoDB Transaction + Atomic Operation**

```typescript
const session = await mongoose.startSession();
session.startTransaction();

try {
  const result = await ProductModel.findByIdAndUpdate(
    productId,
    { $inc: { stock: -1 } }, // Atomic decrement
    { 
      session,
      runValidators: true // וודא stock >= 0
    }
  );
  
  if (!result) {
    throw new Error('Out of stock');
  }
  
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
}
```

**מה קורה:**
1. משתמש A קונה → MongoDB נועל את המסמך
2. משתמש B מנסה לקנות → מחכה לlock
3. משתמש A מצליח → stock: 1 → 0, commit
4. משתמש B מנסה → stock: 0 → -1 ❌ validator נכשל
5. משתמש B מקבל 'Out of stock'

**למה Transaction?**
- אם יש 5 פריטים בהזמנה ואחד אזל → rollback הכל
- All or nothing - לא נשאר במצב חלקי"

---

#### ❓ "מה אם webhook מStripe לא מגיע?"

**תשובה:**
"**3 שכבות reliability:**

**1. Stripe Retries**
- Stripe מנסה שוב אוטומטית
- Exponential backoff
- עד 3 ימים

**2. Manual Retry Service**
```typescript
WebhookRetryService.start(60000); // כל דקה

// בודק failed webhooks
const failed = await FailedWebhookModel.find({
  status: 'pending',
  nextRetryAt: { $lte: new Date() }
});

// מנסה שוב
for (const webhook of failed) {
  await retryWebhook(webhook);
}
```

**3. Idempotency**
```typescript
const existing = await WebhookEventModel.findOne({ eventId });
if (existing) return; // כבר עיבדנו
```
אם webhook מגיע מספר פעמים, אנחנו עוברים פעם אחת.

**Monitoring:**
- Alert אם יותר מ-10 webhooks failed
- Dashboard מראה pending webhooks
- Admin יכול לעבד ידנית אם צריך"

---

### 9.5 בדיקות (Testing)

#### ❓ "איך בודקים webhook flow?"

**תשובה:**
```typescript
describe('Webhook Processing', () => {
  it('should verify signature', async () => {
    const event = stripe.webhooks.constructEvent(
      rawBody,
      'invalid-signature',
      WEBHOOK_SECRET
    );
    // אמור לזרוק שגיאה
  });
  
  it('should reject duplicate webhooks', async () => {
    await WebhookEventModel.create({ eventId: 'evt_123' });
    
    const res = await request(app)
      .post('/api/payments/webhook')
      .send(mockEvent);
    
    expect(res.status).toBe(200);
    // אבל order לא השתנה
  });
  
  it('should reduce stock atomically', async () => {
    const product = await Product.create({ stock: 1 });
    
    // 2 webhooks בו-זמנית
    await Promise.all([
      processWebhook(order1),
      processWebhook(order2)
    ]);
    
    const updated = await Product.findById(product._id);
    expect(updated.stock).toBe(0); // רק 1 הצליח
  });
});
```

---

### 9.6 Deployment

#### ❓ "איך deploying ל production?"

**תשובה:**
"**סביבות:**
- Development: local (localhost:4001)
- Staging: Render.com preview
- Production: Render.com + MongoDB Atlas + Redis Cloud

**CI/CD Pipeline:**
```bash
1. git push → GitHub
2. GitHub Actions:
   - npm install
   - npm run build (TypeScript → JavaScript)
   - npm test
   - אם הצליח → deploy לRender
3. Render:
   - docker build
   - docker run
   - health check
   - אם OK → route traffic
```

**Environment Variables:**
```env
NODE_ENV=production
MONGO_URI=mongodb+srv://...atlas...
REDIS_URL=redis://...cloud...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...
JWT_SECRET=<secure-random-string>
```

**Monitoring:**
- Health endpoint: /health
- Metrics: /metrics (Prometheus)
- Logs: structured JSON → CloudWatch
- Alerts: Slack/Email אם errors > 1%"

---

## 10. טיפים למראיין

### 10.1 איך להסביר קוד

**❌ גרוע:**
"הפונקציה הזאת עושה query לDB ואז מחזירה את הנתונים"

**✅ מעולה:**
"הפונקציה `AuthService.login()` מבצעת:
1. **Query** - מחפשת משתמש לפי email עם `.select('+password')` כי password לא מוחזר בdefault
2. **Security check** - בודקת אם החשבון נעול (`lockedUntil`)
3. **Validation** - משווה סיסמה עם bcrypt (timing-safe)
4. **Failure handling** - אם נכשל, מעלה counter ואולי נועלת חשבון
5. **Success path** - מאפסת failures, יוצרת JWT, מעדכנת lastLogin
6. **Return** - user sanitized (בלי סיסמה) + token"

---

### 10.2 מונחים לדעת

| מונח | הסבר | דוגמה |
|------|-------|--------|
| **Idempotency** | אותה פעולה פעמיים = אותה תוצאה | webhook מגיע 2 פעמים, עובר פעם אחת |
| **Race condition** | 2 threads משנים אותו data | 2 קונים פריט אחרון |
| **Atomic operation** | פעולה שלא ניתנת לחלוקה | `$inc: { stock: -1 }` |
| **Transaction** | קבוצת פעולות - הכל או כלום | עדכון מלאי + הזמנה |
| **Debounce** | דחיית פעולה עד שקט | עגלה נשמרת אחרי 5 שניות |
| **Throttle** | הגבלת קצב פעולות | max 5 requests per minute |
| **Circuit breaker** | הפסקת ניסיונות אחרי כשלונות | אחרי 5 timeouts, הפסק לנסות |

---

### 10.3 תרגול

#### תרגיל 1: צייר זרימה
"צייר על הלוח את זרימת התשלום מרגע שמשתמש לוחץ 'קנה' עד שהמלאי יורד"

<אתה צריך לצייר את ה-3 phases: create order → user pays → webhook>

#### תרגיל 2: בעיה אבטחתית
"תוקף שולח webhook מזויף עם amount: $1 להזמנה של $100. מה קורה?"

<תשובה: signature verification נכשל → webhook נדחה>

#### תרגיל 3: bug fixing
"משתמש מתלונן שהוא רואה עגלה ריקה אחרי שהוסיף פריטים. מה בודקים?"

<תשובה: Redis נפל? MongoDB populated? JWT valid?>

---

## 11. מילות מפתח לחיפוש מהיר

| נושא | קבצים | מילות מפתח |
|------|-------|------------|
| **Authentication** | auth.service.ts, auth.middleware.ts | JWT, bcrypt, login, register |
| **Payments** | payment.service.ts, stripe.provider.ts | webhook, signature, idempotency |
| **Cart** | cart.service.ts | Redis, debounce, cache |
| **Orders** | order.service.ts | transaction, atomic, stock |
| **Security** | rate-limiter, validators | Zod, CORS, rate limit |
| **Logging** | logger.ts, logging.middleware.ts | Pino, structured, requestId |
| **Database** | db.ts, models/ | MongoDB, schema, index |

---

## 📚 סיכום: מה חשוב לדעת

### Top 10 דברים שמראיין ישאל:

1. ✅ **זרימת תשלום** - 4 שכבות אבטחה, webhook verification
2. ✅ **Race conditions** - MongoDB transactions, atomic operations
3. ✅ **Caching strategy** - Redis + MongoDB, debounce
4. ✅ **Authentication** - JWT, account lockout, rate limiting
5. ✅ **Security** - Input validation, CORS, injection prevention
6. ✅ **Error handling** - asyncHandler, structured errors
7. ✅ **Logging** - Pino, structured JSON, request IDs
8. ✅ **Database optimization** - Indexes, lean queries, pooling
9. ✅ **Scalability** - Stateless, horizontal scaling
10. ✅ **Testing** - Unit tests, integration tests, mocking

---

## 🎯 הצעד הבא

עכשיו שיש לך את המדריך:
1. **קרא** את כל הזרימות (3, 5, 10 דקות לכל אחת)
2. **פתח קוד** ועבור עם המדריך line-by-line
3. **תרגל הסבר** - הקלט את עצמך מסביר כל זרימה
4. **שאל שאלות** - אני כאן לכל דבר שלא ברור

**בהצלחה! 🚀**
