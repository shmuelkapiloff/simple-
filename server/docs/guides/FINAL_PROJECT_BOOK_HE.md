# ספר פרויקט גמר - Simple Shop

---

## עמוד שער

**שם המכללה:** [שם המכללה]  
**סמליל (לוגו):** [לוגו המכללה] | [לוגו מה"ט]  
**שם מגמה:** הנדסת תוכנה  
**מסלול הכשרה:** הנדסאי  

**נושא הפרויקט:**  
# מערכת E-Commerce מלאה לניהול חנות אונליין  
### עם תשלומים מאובטחים, ניהול מלאי בזמן אמת, ולוח ניהול מתקדם

**שמות הסטודנטים:**
- **[שם סטודנט 1]** – צד שרת (Backend API)
- **[שם סטודנט 2]** – צד לקוח (Frontend Application)

**שם המנחה האישי:** [שם המנחה]  
**תאריך מסירה:** 01/03/2026

---

## תוכן עניינים

### חלק א' - מבוא והצגת הפרויקט
1. [תיאור ורקע כללי](#131-תיאור-ורקע-כללי)
2. [מטרות המערכת](#132-מטרות-המערכת)
3. [סקירת מצב קיים בשוק](#133-סקירת-מצב-קיים-בשוק)
4. [מה הפרויקט מחדש ומשפר](#134-מה-הפרויקט-מחדש-ומשפר)

### חלק ב' - ליבה טכנית (Server)
5. [דרישות מערכת ופונקציונאליות](#135-דרישות-מערכת-ופונקציונאליות)
6. [בעיות צפויות ופתרונות](#136-בעיות-צפויות-ופתרונות)
7. [פתרון טכנולוגי נבחר](#137-פתרון-טכנולוגי-נבחר)
8. [מבני נתונים וארגון קבצים](#138-מבני-נתונים-וארגון-קבצים)
9. [תרשימי מערכת](#139-תרשימי-מערכת)
10. [מרכיב אלגוריתמי](#1310-מרכיב-אלגוריתמי)
11. [אבטחת מידע](#1311-אבטחת-מידע)

### חלק ג' - ליבה טכנית (Client)
12. [צד לקוח - סקירה](#2-צד-לקוח-frontend)

### חלק ד' - ניהול פרויקט
13. [משאבים נדרשים](#1312-משאבים-נדרשים)
14. [תכנית עבודה](#1313-תכנית-עבודה)
15. [תכנון בדיקות](#1314-תכנון-בדיקות)
16. [בקרת גרסאות](#1315-בקרת-גרסאות)

### חלק ה' - סיכום
17. [מה למדנו](#סיכום---מה-למדנו)

---

# חלק א' - מבוא והצגת הפרויקט

<!-- סגנון כתיבה: יזמי - להתלהב, לשכנע, למכור את הרעיון -->

## 1.3.1 תיאור ורקע כללי

### הסיפור שלנו

בעולם שבו קניות אונליין הפכו לחלק בלתי נפרד מהחיים, עסקים קטנים ובינוניים מתקשים להתחרות בענקיות כמו Amazon ו-AliExpress. הם צריכים פתרון שיהיה **פשוט להפעלה**, **מאובטח ברמה הגבוהה ביותר**, ו**משתלם כלכלית**.

**Simple Shop** נולד מתוך הצורך הזה.

### מה זה Simple Shop?

Simple Shop היא **מערכת e-commerce מלאה** שמאפשרת לכל עסק להקים חנות אונליין מקצועית תוך דקות. המערכת כוללת:

🛒 **חנות אונליין מלאה** – קטלוג מוצרים, עגלת קניות, וחיפוש מתקדם  
💳 **תשלומים מאובטחים** – אינטגרציה מלאה עם Stripe  
📦 **ניהול מלאי חכם** – מניעת מכירת יתר אוטומטית  
👤 **ניהול משתמשים** – הרשמה, התחברות, ואיפוס סיסמה  
📊 **לוח ניהול** – סטטיסטיקות, ניהול מוצרים והזמנות  
🔒 **אבטחה ברמה הגבוהה ביותר** – הגנה מפני כל ההתקפות הנפוצות

### למה זה חשוב?

> "בשנת 2025, 21% מכלל הרכישות בעולם בוצעו אונליין. עד 2027, המספר צפוי לעלות ל-25%."  
> — Statista, E-commerce Worldwide Report

עסקים שלא יהיו אונליין – פשוט יישארו מאחור. **Simple Shop נותן להם את הכלים להצליח.**

---

## 1.3.2 מטרות המערכת

### החזון

ליצור את **הפתרון הטוב ביותר** לחנות אונליין קטנה-בינונית:
- פשוט מספיק שכל אחד יכול להפעיל
- מאובטח מספיק שהלקוחות יסמכו
- גמיש מספיק שיתאים לכל עסק

### מטרות מדידות

| מטרה | יעד | מדד הצלחה |
|------|-----|-----------|
| **מהירות תגובה** | < 100ms | 95% מהבקשות |
| **זמינות** | 99.9% | uptime שנתי |
| **אבטחה** | 0 פרצות | penetration testing |
| **קלות שימוש** | < 5 דקות | זמן ללמוד את המערכת |
| **כיסוי בדיקות** | > 85% | test coverage |

### מטרות למידה (כסטודנטים)

מעבר לבניית מוצר, רצינו **ללמוד לבנות מערכות production-ready**:

- ✅ ארכיטקטורה נכונה ל-scale
- ✅ אבטחה מרובת שכבות
- ✅ עבודה עם שירותים חיצוניים (Stripe, MongoDB Atlas)
- ✅ כתיבת בדיקות אוטומטיות
- ✅ תיעוד מקצועי

---

## 1.3.3 סקירת מצב קיים בשוק

### הבעיה

עסקים קטנים שרוצים למכור אונליין עומדים בפני דילמה:

| אפשרות | יתרון | חיסרון |
|--------|-------|--------|
| **Shopify / Wix** | מוכן מהקופסה | עלות חודשית גבוהה (₪100-500) + עמלות |
| **WooCommerce** | חינמי, גמיש | דורש ידע טכני, איטי, פגיע לפריצות |
| **Magento** | עוצמתי, מלא תכונות | מורכב מאוד, דורש שרת חזק |
| **בנייה מאפס** | שליטה מלאה | זמן פיתוח עצום, סיכון לשגיאות |

### הפער בשוק

**אין פתרון ביניים** – משהו שהוא:
- ✅ חינמי / זול
- ✅ מאובטח ומקצועי
- ✅ קל להתאמה אישית
- ✅ עם קוד פתוח ללמידה

**Simple Shop ממלא את הפער הזה.**

---

## 1.3.4 מה הפרויקט מחדש ומשפר

### החידושים שלנו

| תכונה | מה קיים בשוק | מה עשינו |
|-------|-------------|----------|
| **מניעת Overselling** | רוב המערכות לא מטפלות | MongoDB Transactions אטומיות |
| **אבטחת Login** | רק סיסמה | Account Lockout + Rate Limiting + tokenVersion |
| **Webhook Reliability** | "fire and forget" | Idempotency + DB Tracking + Retry Logic |
| **Instant Logout** | Token נשאר תקף | tokenVersion - ביטול מיידי של כל הטוקנים |
| **תיעוד** | לרוב חסר | OpenAPI Spec + Postman Collection מלאה |

### הערך המוסף

🎯 **למפתחים:** קוד נקי, מתועד, עם בדיקות - אפשר ללמוד ממנו  
🎯 **לעסקים:** מערכת מוכנה להפעלה עם אבטחה ברמה הגבוהה  
🎯 **לסטודנטים:** דוגמה מלאה לפרויקט production-ready

---

<!-- ========== SERVER-SECTION-START ========== -->
<!-- להסרת חלק השרת, בקש: "הסר את כל סעיפי השרת מהספר" -->

# חלק ב' - ליבה טכנית: צד שרת (Backend)

<!-- סגנון כתיבה: טכני - כמו CTO שמסביר למתכנתים -->

## 1.3.5 דרישות מערכת ופונקציונאליות

### 1.3.5.1 דרישות מערכת (Non-Functional)

| קטגוריה | דרישה | פירוט |
|---------|-------|-------|
| **סביבה** | Node.js 22.x | Runtime environment |
| | MongoDB 8.x | Primary database |
| | Redis 5.x | Caching & sessions |
| **ביצועים** | Latency < 100ms | 95th percentile |
| | Throughput 100+ RPS | Requests per second |
| | Concurrent users 500+ | Simultaneous connections |
| **שרידות** | Graceful shutdown | No lost requests on restart |
| | Auto-reconnect | DB/Redis connection recovery |
| | Health checks | Liveness & readiness probes |
| **עומסים** | Rate limiting | Per-user & per-IP |
| | Connection pooling | DB connection reuse |
| | Response caching | Redis-based caching |

### 1.3.5.2 דרישות פונקציונאליות

#### מודול Authentication
| פעולה | Endpoint | תיאור |
|-------|----------|-------|
| הרשמה | `POST /auth/register` | יצירת חשבון חדש |
| התחברות | `POST /auth/login` | אימות + JWT token |
| התנתקות | `POST /auth/logout` | ביטול כל הטוקנים (tokenVersion) |
| רענון טוקן | `POST /auth/refresh` | קבלת access token חדש |
| אימות | `GET /auth/verify` | בדיקת תקינות הטוקן |
| איפוס סיסמה | `POST /auth/forgot-password` | שליחת קוד לאימייל |

#### מודול Products
| פעולה | Endpoint | תיאור |
|-------|----------|-------|
| רשימת מוצרים | `GET /products` | עם סינון וחיפוש |
| מוצר בודד | `GET /products/:id` | פרטי מוצר מלאים |
| יצירה | `POST /products` | Admin only |
| עדכון | `PUT /products/:id` | Admin only |
| מחיקה | `DELETE /products/:id` | Soft delete, Admin only |

#### מודול Cart
| פעולה | Endpoint | תיאור |
|-------|----------|-------|
| צפייה בעגלה | `GET /cart` | פריטים + סכום |
| הוספת פריט | `POST /cart/add` | עם בדיקת מלאי |
| עדכון כמות | `PUT /cart/update` | עם בדיקת מלאי |
| הסרת פריט | `DELETE /cart/remove` | הסרה מהעגלה |
| ריקון עגלה | `DELETE /cart/clear` | הסרת כל הפריטים |

#### מודול Orders
| פעולה | Endpoint | תיאור |
|-------|----------|-------|
| יצירת הזמנה | `POST /orders` | מהעגלה + כתובת |
| רשימת הזמנות | `GET /orders` | הזמנות המשתמש |
| הזמנה בודדת | `GET /orders/:id` | פרטים מלאים |
| ביטול | `POST /orders/:id/cancel` | לפני שילוח בלבד |

#### מודול Payments
| פעולה | Endpoint | תיאור |
|-------|----------|-------|
| יצירת Checkout | `POST /payments/create-intent` | Stripe session |
| Webhook | `POST /payments/webhook` | קבלת אירועים מ-Stripe |

#### מודול Admin
| פעולה | Endpoint | תיאור |
|-------|----------|-------|
| סטטיסטיקות | `GET /admin/stats/summary` | מכירות, הזמנות, מלאי |
| משתמשים | `GET /admin/users` | רשימת כל המשתמשים |
| שינוי role | `PUT /admin/users/:id/role` | user ↔ admin |
| כל ההזמנות | `GET /admin/orders` | עם פילטרים |
| עדכון סטטוס | `PUT /admin/orders/:id/status` | שינוי סטטוס הזמנה |

---

## 1.3.6 בעיות צפויות ופתרונות

### 1.3.6.1 תיאור הבעיות

| בעיה | תיאור | חומרה | השלכות |
|------|-------|-------|--------|
| **Race Conditions** | שני לקוחות קונים את המוצר האחרון בו-זמנית | 🔴 קריטי | Overselling, הפסד כספי |
| **Brute Force** | ניסיונות login חוזרים לפריצת סיסמה | 🔴 קריטי | גניבת חשבונות |
| **Webhook Replay** | Stripe שולח webhook פעמיים | 🟠 גבוה | חיוב כפול |
| **Token Theft** | גניבת JWT token | 🟠 גבוה | התחזות למשתמש |
| **DDoS** | הצפת השרת בבקשות | 🟡 בינוני | השבתת השירות |

### 1.3.6.2 פתרונות שנבחרו

| בעיה | פתרונות אפשריים | הפתרון שבחרנו | סיבה |
|------|-----------------|---------------|------|
| **Race Conditions** | 1. Optimistic locking<br>2. Pessimistic locking<br>3. **MongoDB Transactions** | MongoDB Transactions | אטומיות מלאה, rollback אוטומטי |
| **Brute Force** | 1. CAPTCHA<br>2. **Account Lockout + Rate Limit**<br>3. 2FA | Account Lockout + Rate Limiting | UX טוב יותר מ-CAPTCHA, פשוט יותר מ-2FA |
| **Webhook Replay** | 1. **Idempotency Keys**<br>2. Event sourcing | Idempotency + DB Tracking | פשוט, אמין, מאפשר auditing |
| **Token Theft** | 1. Short expiry<br>2. **tokenVersion**<br>3. Token blacklist | tokenVersion | ביטול מיידי, ללא DB lookup בכל בקשה |
| **DDoS** | 1. **Rate Limiting**<br>2. WAF<br>3. CDN | Rate Limiting per IP/User | פשוט, יעיל, לא דורש שירות חיצוני |

---

## 1.3.7 פתרון טכנולוגי נבחר

### 1.3.7.1 טופולוגיית הפתרון

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Web Browser  │  │ Mobile App   │  │ Admin Panel  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼─────────────────┼─────────────────┼───────────────────┘
          │                 │                 │
          └────────────────┬┴─────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     RENDER.COM (PaaS)                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Node.js Server                         │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │                   Express.js                        │  │  │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐            │  │  │
│  │  │  │ Routes  │→ │ Middle- │→ │  Cont-  │            │  │  │
│  │  │  │         │  │  wares  │  │ rollers │            │  │  │
│  │  │  └─────────┘  └─────────┘  └────┬────┘            │  │  │
│  │  │                                  │                 │  │  │
│  │  │                           ┌──────▼──────┐          │  │  │
│  │  │                           │  Services   │          │  │  │
│  │  │                           │ (Business   │          │  │  │
│  │  │                           │   Logic)    │          │  │  │
│  │  │                           └──────┬──────┘          │  │  │
│  │  └──────────────────────────────────┼────────────────┘  │  │
│  └─────────────────────────────────────┼────────────────────┘  │
└────────────────────────────────────────┼────────────────────────┘
                                         │
          ┌──────────────────────────────┼───────────────────┐
          │                              │                   │
          ▼                              ▼                   ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  MongoDB Atlas   │  │   Redis Cloud    │  │     Stripe       │
│  (Database)      │  │   (Cache)        │  │   (Payments)     │
│                  │  │                  │  │                  │
│ • Users          │  │ • Rate limits    │  │ • Checkout       │
│ • Products       │  │ • Session cache  │  │ • Webhooks       │
│ • Orders         │  │ • Cart cache     │  │ • Refunds        │
│ • Payments       │  │                  │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

### 1.3.7.2 טכנולוגיות בשימוש

| שכבה | טכנולוגיה | גרסה | תפקיד |
|------|-----------|------|-------|
| **Runtime** | Node.js | 18+ | JavaScript execution engine |
| **Framework** | Express.js | 4.19+ | HTTP server & routing |
| **Language** | TypeScript | 5.x | Type-safe JavaScript |
| **Database** | MongoDB | 8.x | NoSQL document database |
| **ODM** | Mongoose | 8.x | MongoDB object modeling |
| **Cache** | Redis | 5.x | In-memory data store |
| **Auth** | JWT | - | Stateless authentication |
| **Payments** | Stripe | 20.x | Payment processing |
| **Validation** | Zod | 3.x | Runtime type validation |
| **Logging** | Pino | 8.x | Structured JSON logging |
| **Testing** | Jest | 29.x | Unit & integration tests |
| **Metrics** | prom-client | 15.x | Prometheus metrics |

### 1.3.7.3 שפות הפיתוח

| שפה | שימוש | סיבה |
|-----|-------|------|
| **TypeScript** | קוד השרת כולו | Type safety, autocomplete, תחזוקתיות |
| **JavaScript ES2023** | Runtime (compiled) | Node.js native support |
| **JSON** | Configuration, API | Standard data format |
| **YAML** | Docker, CI/CD | Human-readable config |

### 1.3.7.4 תיאור הארכיטקטורה

**Pattern: Layered Architecture + MVC**

```
┌─────────────────────────────────────────────────┐
│                   Routes Layer                   │
│  • מגדיר URL patterns                           │
│  • מקשר endpoints ל-controllers                 │
├─────────────────────────────────────────────────┤
│                Middleware Layer                  │
│  • Authentication (JWT verification)            │
│  • Rate Limiting (brute force protection)       │
│  • Logging (request/response tracking)          │
│  • Error Handling (centralized errors)          │
├─────────────────────────────────────────────────┤
│               Controller Layer                   │
│  • מקבל HTTP request                            │
│  • מפעיל validation                             │
│  • קורא ל-Service                               │
│  • מחזיר HTTP response                          │
├─────────────────────────────────────────────────┤
│                Service Layer                     │
│  • Business logic מרוכז                         │
│  • לא תלוי ב-HTTP                               │
│  • ניתן לבדיקה בנפרד                            │
├─────────────────────────────────────────────────┤
│                 Model Layer                      │
│  • Mongoose schemas                             │
│  • Database queries                             │
│  • Data validation                              │
└─────────────────────────────────────────────────┘
```

**למה בחרנו בארכיטקטורה זו?**

| יתרון | הסבר |
|-------|------|
| **Separation of Concerns** | כל שכבה אחראית לדבר אחד |
| **Testability** | אפשר לבדוק כל שכבה בנפרד |
| **Maintainability** | קל למצוא ולתקן באגים |
| **Scalability** | אפשר להחליף שכבות בלי לשנות אחרות |

### 1.3.7.5 חלוקה לתכניות ומודולים

```
server/
├── src/
│   ├── app.ts                    # Express app configuration
│   ├── server.ts                 # Server entry point
│   │
│   ├── routes/                   # URL routing
│   │   ├── auth.routes.ts
│   │   ├── product.routes.ts
│   │   ├── cart.routes.ts
│   │   ├── order.routes.ts
│   │   ├── payment.routes.ts
│   │   └── admin.routes.ts
│   │
│   ├── controllers/              # HTTP handlers
│   │   ├── auth.controller.ts
│   │   ├── product.controller.ts
│   │   ├── cart.controller.ts
│   │   ├── order.controller.ts
│   │   ├── payment.controller.ts
│   │   └── admin.controller.ts
│   │
│   ├── services/                 # Business logic
│   │   ├── auth.service.ts           # Login, register, tokenVersion
│   │   ├── product.service.ts        # CRUD, filtering
│   │   ├── cart.service.ts           # Cart management
│   │   ├── order.service.ts          # Order creation
│   │   ├── payment.service.ts        # Stripe integration
│   │   └── admin.service.ts          # Stats, management
│   │
│   ├── models/                   # Database schemas
│   │   ├── user.model.ts
│   │   ├── product.model.ts
│   │   ├── cart.model.ts
│   │   ├── order.model.ts
│   │   ├── payment.model.ts
│   │   └── webhook-event.model.ts
│   │
│   ├── middlewares/              # Request processors
│   │   ├── auth.middleware.ts        # JWT verification
│   │   ├── rate-limiter.middleware.ts # Brute force protection
│   │   ├── error.middleware.ts       # Error handling
│   │   ├── logging.middleware.ts     # Request logging
│   │   └── idempotency.middleware.ts # Duplicate prevention
│   │
│   ├── validators/               # Input validation (Zod)
│   │   ├── auth.validator.ts
│   │   ├── product.validator.ts
│   │   └── order.validator.ts
│   │
│   ├── config/                   # Configuration
│   │   ├── env.ts                    # Environment variables
│   │   ├── db.ts                     # MongoDB connection
│   │   ├── redisClient.ts            # Redis connection
│   │   └── cors.ts                   # CORS settings
│   │
│   ├── utils/                    # Utilities
│   │   ├── logger.ts                 # Pino logger
│   │   ├── errors.ts                 # Custom error classes
│   │   └── response.ts               # Standardized responses
│   │
│   └── __tests__/                # Test files
│       ├── auth.test.ts
│       ├── order.test.ts
│       └── payment-webhook.test.ts
│
├── docs/                         # Documentation
├── postman/                      # API collection
├── package.json
└── tsconfig.json
```

### 1.3.7.6 סביבת השרת

| סביבה | שירות | תיאור |
|-------|-------|-------|
| **Production** | Render.com | PaaS, auto-deploy from GitHub |
| **Database** | MongoDB Atlas | Managed MongoDB cluster |
| **Cache** | Redis Cloud | Managed Redis instance |
| **Development** | Local | Node.js + local DB/Redis |
| **Testing** | In-memory | Mocked services |

**Production URL:** `https://simple-4-anp6.onrender.com/api`

### 1.3.7.7 ממשק משתמש (GUI)

**הממשק מפותח בנפרד על ידי צד הלקוח** - ראה [חלק ג'](#2-צד-לקוח-frontend).

### 1.3.7.8 ממשקים למערכות אחרות (API)

#### External APIs

**1. Stripe API** - תשלומים
```
POST https://api.stripe.com/v1/checkout/sessions
  → יצירת session לתשלום
  
Webhook: POST /api/payments/webhook
  → קבלת אירועים (payment.succeeded, payment.failed)
```

#### Internal API - Full Endpoints

```yaml
# Authentication
POST   /api/auth/register          # יצירת חשבון
POST   /api/auth/login             # התחברות
POST   /api/auth/logout            # התנתקות (tokenVersion++)
POST   /api/auth/refresh           # רענון token
GET    /api/auth/verify            # בדיקת token
POST   /api/auth/forgot-password   # איפוס סיסמה

# Products
GET    /api/products               # רשימה (עם filters)
GET    /api/products/:id           # מוצר בודד

# Cart (Authenticated)
GET    /api/cart                   # צפייה בעגלה
POST   /api/cart/add               # הוספת פריט
PUT    /api/cart/update            # עדכון כמות
DELETE /api/cart/remove            # הסרת פריט
DELETE /api/cart/clear             # ריקון עגלה

# Orders (Authenticated)
POST   /api/orders                 # יצירת הזמנה
GET    /api/orders                 # רשימת הזמנות
GET    /api/orders/:id             # הזמנה בודדת
POST   /api/orders/:id/cancel      # ביטול

# Payments (Authenticated)
POST   /api/payments/create-intent    # יצירת Stripe session
GET    /api/payments/:orderId/status  # סטטוס תשלום להזמנה
POST   /api/payments/webhook          # Stripe webhook (no auth)

# Admin (Admin only)
GET    /api/admin/stats/summary    # סטטיסטיקות
GET    /api/admin/products         # כל המוצרים
POST   /api/admin/products         # יצירת מוצר
PUT    /api/admin/products/:id     # עדכון מוצר
DELETE /api/admin/products/:id     # מחיקת מוצר
GET    /api/admin/users            # רשימת משתמשים
PUT    /api/admin/users/:id/role   # שינוי role
GET    /api/admin/orders           # כל ההזמנות
PUT    /api/admin/orders/:id/status # עדכון סטטוס

# Health
GET    /api/health                 # בריאות המערכת
```

#### Response Format

כל ה-responses במבנה אחיד:

```typescript
// Success
{
  success: true,
  data: { ... }  // התוצאה
}

// Error
{
  success: false,
  message: "Error description",
  code: "ERROR_CODE"
}
```

### 1.3.7.9 שימוש בחבילות תוכנה

#### Production Dependencies

| חבילה | גרסה | תפקיד |
|-------|------|-------|
| `express` | ^4.19 | HTTP server framework |
| `mongoose` | ^8.0 | MongoDB ODM |
| `ioredis` | ^5.4 | Redis client |
| `stripe` | ^20.1 | Payment processing |
| `jsonwebtoken` | ^9.0 | JWT creation & verification |
| `bcryptjs` | ^2.4 | Password hashing |
| `helmet` | ^7.0 | Security headers |
| `cors` | ^2.8 | Cross-origin support |
| `zod` | ^3.22 | Schema validation |
| `pino` | ^8.0 | Structured logging |
| `prom-client` | ^15.0 | Prometheus metrics |

#### Dev Dependencies

| חבילה | גרסה | תפקיד |
|-------|------|-------|
| `typescript` | ^5.3 | Type checking |
| `jest` | ^29.0 | Testing framework |
| `supertest` | ^6.3 | HTTP testing |
| `ts-node` | ^10.0 | TypeScript execution |
| `nodemon` | ^3.0 | Development auto-restart |
| `@types/*` | various | TypeScript definitions |

### 1.3.7.10 פונקציות מרכזיות

| פונקציה | קובץ | תיאור |
|---------|------|-------|
| `AuthService.login()` | auth.service.ts | אימות משתמש, בדיקת נעילה, יצירת JWT |
| `AuthService.logout()` | auth.service.ts | הגדלת tokenVersion לביטול כל הטוקנים |
| `AuthService.register()` | auth.service.ts | יצירת משתמש, hash סיסמה |
| `OrderService.createOrder()` | order.service.ts | יצירת הזמנה מעגלה |
| `PaymentService.createPaymentIntent()` | payment.service.ts | יצירת Stripe session |
| `PaymentService.handleWebhook()` | payment.service.ts | עיבוד webhook, idempotency |
| `PaymentService.fulfillOrder()` | payment.service.ts | הפחתת מלאי אטומית |
| `CartService.addToCart()` | cart.service.ts | הוספה לעגלה עם בדיקת מלאי |
| `ProductService.getProducts()` | product.service.ts | שליפה עם סינון |
| `AdminService.getStats()` | admin.service.ts | סטטיסטיקות מכירות ומלאי |
| `AuthMiddleware.requireAuth()` | auth.middleware.ts | אימות JWT + tokenVersion |
| `rateLimiter.authRateLimiter()` | rate-limiter.middleware.ts | הגנה מ-brute force |

---

## 1.3.8 מבני נתונים וארגון קבצים

### 1.3.8.1 פירוט מבני הנתונים

#### User Schema
```typescript
{
  _id: ObjectId,
  email: string,              // unique, indexed
  password: string,           // bcrypt hashed, select: false
  name: string,
  phone?: string,
  role: "user" | "admin",
  tokenVersion: number,       // ++ on logout, invalidates all tokens
  failedLoginAttempts: number,
  lockedUntil?: Date,
  lastLogin?: Date,
  addresses: Address[],
  createdAt: Date,
  updatedAt: Date
}
```

#### Product Schema
```typescript
{
  _id: ObjectId,
  sku: string,                // unique
  name: string,
  description: string,
  price: number,
  stock: number,
  category: string,           // indexed
  // Valid categories: accessories, audio, displays, laptops,
  //   smart-home, smartphones, streaming, tablets, wearables
  image: string,
  featured: boolean,
  rating: number,
  isActive: boolean,          // soft delete flag
  createdAt: Date,
  updatedAt: Date
}
```

#### Cart Schema
```typescript
{
  _id: ObjectId,
  user: ObjectId,             // ref: User, unique
  items: [{
    product: ObjectId,        // ref: Product
    quantity: number
  }],
  updatedAt: Date
}
```

#### Order Schema
```typescript
{
  _id: ObjectId,
  orderNumber: string,        // unique, format: ORD-YYYYMMDD-XXX
  user: ObjectId,             // ref: User
  items: [{
    product: ObjectId,
    name: string,             // snapshot at order time
    price: number,            // snapshot at order time
    quantity: number,
    image: string
  }],
  totalAmount: number,
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled",
  paymentStatus: "pending" | "paid" | "failed" | "refunded",
  shippingAddress: {
    fullName: string,
    phone: string,
    street: string,
    city: string,
    zipCode: string
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### Payment Schema
```typescript
{
  _id: ObjectId,
  order: ObjectId,            // ref: Order
  user: ObjectId,             // ref: User
  providerPaymentId: string,  // Stripe session ID
  amount: number,
  currency: string,
  status: "pending" | "succeeded" | "failed",
  checkoutUrl: string,
  createdAt: Date
}
```

#### WebhookEvent Schema (Idempotency)
```typescript
{
  _id: ObjectId,
  eventId: string,            // unique, from Stripe
  provider: "stripe",
  eventType: string,
  processedAt: Date,
  ttlExpiry: Date             // auto-delete after 30 days
}
```

### 1.3.8.2 שיטת האחסון

| סוג מידע | טכנולוגיה | סיבה |
|----------|----------|------|
| **Primary Data** | MongoDB Atlas | Document-based, scalable, transactions |
| **Sessions/Cache** | Redis Cloud | Fast, in-memory, TTL support |
| **Files/Images** | External URLs | לא מאחסנים קבצים, רק URLs |
| **Logs** | Pino → stdout | Render.com collects automatically |

### 1.3.8.3 מנגנוני התאוששות

#### Database Recovery
```typescript
// Auto-reconnect with exponential backoff
mongoose.connection.on('disconnected', () => {
  setTimeout(() => mongoose.connect(uri), retryDelay);
});
```

#### Transaction Rollback
```typescript
// Atomic stock reduction - all or nothing
const session = await mongoose.startSession();
session.startTransaction();
try {
  await Product.updateOne(
    { _id: productId, stock: { $gte: quantity } },
    { $inc: { stock: -quantity } },
    { session }
  );
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
}
```

#### Webhook Retry Logic
```typescript
// Idempotency - prevent duplicate processing
const existing = await WebhookEvent.findOne({ eventId });
if (existing) {
  return { status: 'already_processed' };
}
// Process and save eventId
await WebhookEvent.create({ eventId, processedAt: new Date() });
```

---

## 1.3.9 תרשימי מערכת

### 1.3.9.1 Use Case Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Simple Shop                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    ┌──────────┐                              ┌──────────┐       │
│    │  Guest   │                              │  Admin   │       │
│    │ (אורח)   │                              │ (מנהל)   │       │
│    └────┬─────┘                              └────┬─────┘       │
│         │                                         │              │
│         │ ┌────────────────────┐                 │              │
│         ├─► צפייה במוצרים      ◄─────────────────┤              │
│         │ └────────────────────┘                 │              │
│         │                                         │              │
│         │ ┌────────────────────┐                 │              │
│         ├─► הרשמה / התחברות   │                 │              │
│         │ └────────────────────┘                 │              │
│         │                                         │              │
│    ┌────▼─────┐                                  │              │
│    │   User   │                                  │              │
│    │ (משתמש)  │                                  │              │
│    └────┬─────┘                                  │              │
│         │                                         │              │
│         │ ┌────────────────────┐                 │              │
│         ├─► ניהול עגלה        │                 │              │
│         │ └────────────────────┘                 │              │
│         │                                         │              │
│         │ ┌────────────────────┐                 │              │
│         ├─► ביצוע הזמנה       │                 │              │
│         │ └────────────────────┘                 │              │
│         │                                         │              │
│         │ ┌────────────────────┐                 │              │
│         ├─► תשלום ב-Stripe    │                 │              │
│         │ └────────────────────┘                 │              │
│         │                                         │              │
│         │ ┌────────────────────┐                 │              │
│         ├─► צפייה בהזמנות     │                 │              │
│         │ └────────────────────┘                 │              │
│         │                                         │              │
│         │ ┌────────────────────┐                 │              │
│         └─► ניהול פרופיל      │                 │              │
│           └────────────────────┘                 │              │
│                                                   │              │
│                         ┌────────────────────┐   │              │
│                         │ ניהול מוצרים       ◄───┤              │
│                         └────────────────────┘   │              │
│                                                   │              │
│                         ┌────────────────────┐   │              │
│                         │ ניהול הזמנות       ◄───┤              │
│                         └────────────────────┘   │              │
│                                                   │              │
│                         ┌────────────────────┐   │              │
│                         │ ניהול משתמשים      ◄───┤              │
│                         └────────────────────┘   │              │
│                                                   │              │
│                         ┌────────────────────┐   │              │
│                         │ צפייה בסטטיסטיקות  ◄───┘              │
│                         └────────────────────┘                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3.9.2 Sequence Diagram - Checkout Flow

```
┌────────┐     ┌────────┐     ┌────────┐     ┌────────┐     ┌────────┐
│ Client │     │ Server │     │ MongoDB│     │ Stripe │     │  User  │
└───┬────┘     └───┬────┘     └───┬────┘     └───┬────┘     └───┬────┘
    │              │              │              │              │
    │ POST /orders │              │              │              │
    │─────────────►│              │              │              │
    │              │ Get cart     │              │              │
    │              │─────────────►│              │              │
    │              │◄─────────────│              │              │
    │              │              │              │              │
    │              │ Verify stock │              │              │
    │              │─────────────►│              │              │
    │              │◄─────────────│              │              │
    │              │              │              │              │
    │              │ Create order │              │              │
    │              │─────────────►│              │              │
    │              │◄─────────────│              │              │
    │              │              │              │              │
    │ POST /payments/create-intent               │              │
    │─────────────►│              │              │              │
    │              │ Create session              │              │
    │              │─────────────────────────────►│              │
    │              │◄─────────────────────────────│              │
    │              │              │              │              │
    │◄─────────────│              │              │              │
    │ { checkoutUrl }             │              │              │
    │              │              │              │              │
    │ Redirect to Stripe          │              │              │
    │─────────────────────────────────────────────►│              │
    │              │              │              │              │
    │              │              │              │ Enter card   │
    │              │              │              │◄─────────────│
    │              │              │              │              │
    │              │ Webhook: payment.succeeded  │              │
    │              │◄─────────────────────────────│              │
    │              │              │              │              │
    │              │ Check idempotency           │              │
    │              │─────────────►│              │              │
    │              │◄─────────────│              │              │
    │              │              │              │              │
    │              │ BEGIN TRANSACTION           │              │
    │              │─────────────►│              │              │
    │              │              │              │              │
    │              │ Reduce stock (atomic)       │              │
    │              │─────────────►│              │              │
    │              │◄─────────────│              │              │
    │              │              │              │              │
    │              │ Update order status         │              │
    │              │─────────────►│              │              │
    │              │◄─────────────│              │              │
    │              │              │              │              │
    │              │ COMMIT TRANSACTION          │              │
    │              │─────────────►│              │              │
    │              │              │              │              │
    │              │ Return 200   │              │              │
    │              │─────────────────────────────►│              │
    │              │              │              │              │
    │ Redirect to success page    │              │              │
    │◄─────────────────────────────────────────────              │
    │              │              │              │              │
```

### 1.3.9.3 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    LEVEL 0 - CONTEXT                             │
│                                                                  │
│  ┌──────────┐         ┌──────────────┐         ┌──────────┐    │
│  │          │ Request │              │ Payment │          │    │
│  │  Client  │────────►│  Simple Shop │────────►│  Stripe  │    │
│  │          │◄────────│    System    │◄────────│          │    │
│  └──────────┘ Response└──────────────┘ Webhook └──────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    LEVEL 1 - PROCESSES                          │
│                                                                  │
│  ┌─────────┐                                                    │
│  │ Client  │                                                    │
│  └────┬────┘                                                    │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Authentication                        │   │
│  │  Input: email, password                                  │   │
│  │  Process: validate → check lockout → verify → issue JWT  │   │
│  │  Output: { token, user }                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Cart Management                       │   │
│  │  Input: productId, quantity                              │   │
│  │  Process: check stock → update cart → calculate total    │   │
│  │  Output: { items, total }                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Order Processing                      │   │
│  │  Input: cart, shippingAddress                            │   │
│  │  Process: validate → create order → init payment         │   │
│  │  Output: { order, checkoutUrl }                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Payment & Fulfillment                 │   │
│  │  Input: webhook event                                    │   │
│  │  Process: verify → idempotency → reduce stock → update   │   │
│  │  Output: order.status = 'confirmed'                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3.9.4 תרשים Login עם tokenVersion

```
┌────────────────────────────────────────────────────────────────┐
│                     LOGIN FLOW                                  │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│   User: POST /api/auth/login                                   │
│         { email, password }                                    │
│              │                                                  │
│              ▼                                                  │
│   ┌─────────────────────┐                                      │
│   │ Check Rate Limit    │                                      │
│   │ (5 attempts/15min)  │                                      │
│   └──────────┬──────────┘                                      │
│              │                                                  │
│       ┌──────▼──────┐                                          │
│       │ Rate limit  │                                          │
│       │  exceeded?  │───Yes───► 429 Too Many Requests          │
│       └──────┬──────┘                                          │
│              │ No                                               │
│              ▼                                                  │
│   ┌─────────────────────┐                                      │
│   │ Find user by email  │                                      │
│   └──────────┬──────────┘                                      │
│              │                                                  │
│       ┌──────▼──────┐                                          │
│       │    Found?   │───No────► 401 Invalid credentials        │
│       └──────┬──────┘                                          │
│              │ Yes                                              │
│              ▼                                                  │
│   ┌─────────────────────┐                                      │
│   │ Check lockedUntil   │                                      │
│   └──────────┬──────────┘                                      │
│              │                                                  │
│       ┌──────▼──────┐                                          │
│       │   Locked?   │───Yes───► 423 Account Locked             │
│       └──────┬──────┘           (return remaining time)        │
│              │ No                                               │
│              ▼                                                  │
│   ┌─────────────────────┐                                      │
│   │ Verify password     │                                      │
│   │ (bcrypt.compare)    │                                      │
│   └──────────┬──────────┘                                      │
│              │                                                  │
│       ┌──────▼──────┐                                          │
│       │   Valid?    │───No────┐                                │
│       └──────┬──────┘         │                                │
│              │ Yes            ▼                                 │
│              │      ┌───────────────────┐                      │
│              │      │ failedAttempts++  │                      │
│              │      └─────────┬─────────┘                      │
│              │                │                                 │
│              │         ┌──────▼──────┐                         │
│              │         │  >= 5 ?     │───Yes─► Lock 15 min     │
│              │         └──────┬──────┘                         │
│              │                │ No                              │
│              │                ▼                                 │
│              │         401 Invalid credentials                 │
│              │         (X attempts remaining)                  │
│              │                                                  │
│              ▼                                                  │
│   ┌─────────────────────┐                                      │
│   │ Reset failedAttempts│                                      │
│   │ Update lastLogin    │                                      │
│   └──────────┬──────────┘                                      │
│              │                                                  │
│              ▼                                                  │
│   ┌─────────────────────┐                                      │
│   │ Generate JWT        │                                      │
│   │ payload: {          │                                      │
│   │   userId,           │                                      │
│   │   tokenVersion ◄────┼──── מוגבל לגרסה הנוכחית              │
│   │ }                   │                                      │
│   └──────────┬──────────┘                                      │
│              │                                                  │
│              ▼                                                  │
│   200 OK { token, user }                                       │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### 1.3.9.5 תרשים Logout עם tokenVersion

```
┌────────────────────────────────────────────────────────────────┐
│                     LOGOUT FLOW                                 │
│                  (Instant Token Revocation)                     │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│   User: POST /api/auth/logout                                  │
│         Headers: { Authorization: "Bearer <token>" }           │
│              │                                                  │
│              ▼                                                  │
│   ┌─────────────────────┐                                      │
│   │ Verify JWT          │                                      │
│   │ Extract userId &    │                                      │
│   │ tokenVersion        │                                      │
│   └──────────┬──────────┘                                      │
│              │                                                  │
│              ▼                                                  │
│   ┌─────────────────────┐                                      │
│   │ user.tokenVersion++ │  ◄──── הגדלה ב-1                     │
│   │ await user.save()   │                                      │
│   └──────────┬──────────┘                                      │
│              │                                                  │
│              ▼                                                  │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │              ALL EXISTING TOKENS INVALIDATED!            │  │
│   │                                                          │  │
│   │  Token in JWT: tokenVersion = 5                          │  │
│   │  Token in DB:  tokenVersion = 6  ◄── לא תואם!            │  │
│   │                                                          │  │
│   │  Any request with old token → 401 Unauthorized           │  │
│   └─────────────────────────────────────────────────────────┘  │
│              │                                                  │
│              ▼                                                  │
│   200 OK { message: "Logged out successfully" }                │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 1.3.10 מרכיב אלגוריתמי

### 1.3.10.1 בעיות ופתרונות אלגוריתמיים

#### בעיה 1: Race Condition במכירת מוצרים

**הבעיה:**
```
Time    User A              User B              Stock
─────────────────────────────────────────────────────
T1      Read stock (1)                          1
T2                          Read stock (1)      1
T3      Buy (stock--)                           0
T4                          Buy (stock--)       -1 ❌
```

**הפתרון: MongoDB Atomic Update**
```typescript
// במקום:
const product = await Product.findById(id);
if (product.stock >= quantity) {
  product.stock -= quantity;  // ❌ Not atomic!
  await product.save();
}

// עשינו:
const result = await Product.findOneAndUpdate(
  { 
    _id: id, 
    stock: { $gte: quantity }  // Condition in query
  },
  { 
    $inc: { stock: -quantity }  // Atomic decrement
  },
  { new: true }
);

if (!result) {
  throw new Error('Insufficient stock');
}
```

**סיבוכיות:** O(1) - single atomic operation

---

#### בעיה 2: ביטול מיידי של כל הטוקנים (Logout)

**הבעיה:**  
משתמש מתנתק, אבל JWT tokens שכבר הופקו עדיין תקפים עד שיפוגו.

**פתרונות אפשריים:**

| פתרון | יתרון | חיסרון |
|-------|-------|--------|
| Token Blacklist | פשוט | DB lookup בכל בקשה |
| Short Expiry | פשוט | UX רע (login תכוף) |
| **tokenVersion** | מהיר, ללא DB lookup נוסף | צריך לשמור version |

**הפתרון שבחרנו: tokenVersion**

```typescript
// ב-User Schema:
tokenVersion: { type: Number, default: 0 }

// ב-Login - JWT payload כולל את הגרסה:
const token = jwt.sign({
  userId: user._id,
  tokenVersion: user.tokenVersion  // e.g., 5
}, secret);

// ב-Logout - מגדילים את הגרסה:
user.tokenVersion += 1;  // Now 6
await user.save();

// ב-Auth Middleware - בודקים התאמה:
const decoded = jwt.verify(token, secret);
const user = await User.findById(decoded.userId);

if (decoded.tokenVersion !== user.tokenVersion) {
  throw new Error('Token revoked');  // 5 !== 6
}
```

**סיבוכיות:** O(1) - comparison operation

---

#### בעיה 3: Webhook Replay Attack

**הבעיה:**  
Stripe שולח webhook פעמיים (network issue, retry) → חיוב כפול / stock כפול

**הפתרון: Idempotency Key**

```typescript
async function handleWebhook(event: StripeEvent) {
  // 1. Check if already processed
  const existing = await WebhookEvent.findOne({ 
    eventId: event.id 
  });
  
  if (existing) {
    return { status: 'already_processed' };  // Skip
  }
  
  // 2. Process the event
  await processPayment(event);
  
  // 3. Mark as processed
  await WebhookEvent.create({
    eventId: event.id,
    provider: 'stripe',
    eventType: event.type,
    processedAt: new Date()
  });
  
  return { status: 'success' };
}
```

**סיבוכיות:** O(1) - single DB lookup with unique index

---

### 1.3.10.2 איסוף מידע וסטטיסטיקות

#### Metrics נאספים

| Metric | מקור | שימוש |
|--------|------|-------|
| Response Time | prom-client | זיהוי צווארי בקבוק |
| Error Rate | Error middleware | התראות |
| Failed Logins | Auth service | זיהוי התקפות |
| Stock Levels | Product model | התראת מלאי נמוך |
| Payment Success Rate | Payment service | בריאות עסקית |

#### Admin Stats Endpoint

```typescript
// GET /api/admin/stats/summary
{
  sales: {
    total: 12345.67,        // סה"כ מכירות (delivered)
    deliveredCount: 45
  },
  orders: {
    open: 8,                // הזמנות פתוחות
    today: 3
  },
  inventory: {
    lowStockCount: 5,
    lowStockProducts: [     // מוצרים עם stock < 5
      { _id, name, stock }
    ],
    activeProducts: 50
  },
  users: {
    total: 150
  }
}
```

#### Logging Format (Structured)

```json
{
  "level": "info",
  "time": 1709308800000,
  "service": "PaymentService",
  "method": "handleWebhook",
  "eventId": "evt_1abc123",
  "eventType": "checkout.session.completed",
  "orderId": "ORD-20260301-001",
  "amount": 199.99,
  "duration_ms": 45,
  "status": "success"
}
```

---

## 1.3.11 אבטחת מידע

### אזורים הדורשים הגנה

| אזור | איומים | הגנות |
|------|--------|-------|
| **Authentication** | Brute force, Credential stuffing | Rate limit, Account lockout, bcrypt |
| **Sessions** | Token theft, Session fixation | JWT, tokenVersion, HTTPS only |
| **API** | Injection, XSS, CSRF | Zod validation, Helmet, CORS |
| **Database** | SQL injection, Data leak | Mongoose ODM, select: false |
| **Payments** | Webhook spoofing, Replay | HMAC verification, Idempotency |

### מנגנוני ההגנה המיושמים

#### 1. Password Security
```typescript
// Hash with bcrypt (12 rounds = ~250ms)
const hash = await bcrypt.hash(password, 12);

// Verify
const isValid = await bcrypt.compare(password, hash);
```

#### 2. JWT with tokenVersion
```typescript
// Token payload
{
  userId: "507f1f77bcf86cd799439011",
  tokenVersion: 5,  // Must match DB
  iat: 1709308800,
  exp: 1709312400   // 1 hour
}

// Verification includes version check
if (decoded.tokenVersion !== user.tokenVersion) {
  throw new UnauthorizedError('Token revoked');
}
```

#### 3. Rate Limiting
```typescript
// Auth endpoints: 5 requests per 15 minutes per user
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.body.email || req.ip
});

// General API: 100 requests per minute
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100
});
```

#### 4. Account Lockout
```typescript
if (user.failedLoginAttempts >= 5) {
  user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
  throw new Error('Account locked for 15 minutes');
}
```

#### 5. Webhook Signature Verification
```typescript
const signature = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  req.body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);
// Throws if signature invalid
```

### 5 תרחישי התקפה ותגובה

| # | התקפה | תגובה | קוד שגיאה |
|---|-------|-------|-----------|
| 1 | Brute force login (100 ניסיונות) | Account locked, logged, IP rate limited | 429/423 |
| 2 | SQL Injection in email field | Zod validation rejects, query parameterized | 400 |
| 3 | Stolen JWT token used | tokenVersion mismatch after logout | 401 |
| 4 | Fake Stripe webhook | HMAC signature verification fails | 400 |
| 5 | Same webhook sent twice | Idempotency check blocks duplicate | 200 (skip) |

---

<!-- ========== SERVER-SECTION-END ========== -->

---

<!-- ========== CLIENT-SECTION-START ========== -->
<!-- להסרת חלק הלקוח, בקש: "הסר את כל סעיפי הלקוח מהספר" -->

# חלק ג' - ליבה טכנית: צד לקוח (Frontend)

<!-- סגנון כתיבה: טכני - כמו CTO שמסביר למתכנתים -->

## 2. צד לקוח (Frontend)

### 2.1 סקירה כללית

צד הלקוח הוא אפליקציית **React** מודרנית שמתקשרת עם ה-API של השרת.

| היבט | מימוש |
|------|-------|
| **ביצועים** | Vite build, code splitting, lazy loading |
| **עיצוב** | Tailwind CSS, responsive design |
| **State** | RTK Query (server state) + useState (UI) |
| **Routing** | React Router v6 |
| **RTL** | תמיכה מלאה בעברית |

### 2.2 טכנולוגיות

| טכנולוגיה | גרסה | תפקיד |
|-----------|------|-------|
| **React** | 18.x | UI Library |
| **Vite** | 5.x | Build tool (10x faster than CRA) |
| **TypeScript** | 5.x | Type safety |
| **RTK Query** | 2.x | API calls + automatic caching |
| **Tailwind CSS** | 3.x | Utility-first CSS |
| **React Router** | 6.x | Client-side routing |

### 2.3 מבנה קבצים

```
client/
├── src/
│   ├── api.ts              # RTK Query - כל ה-API endpoints
│   ├── store.ts            # Redux store
│   ├── hooks.ts            # useAuth, useCart
│   ├── types.ts            # TypeScript interfaces
│   ├── App.tsx             # Main app + routing
│   ├── main.tsx            # Entry point
│   ├── index.css           # Tailwind + globals
│   │
│   ├── components/
│   │   ├── Layout.tsx          # Header + navigation
│   │   ├── AuthModal.tsx       # Login/Register
│   │   ├── ProductCard.tsx     # Product card
│   │   ├── CartItem.tsx        # Cart item row
│   │   ├── AddressForm.tsx     # Address form
│   │   └── ProtectedRoute.tsx  # Auth guard
│   │
│   └── pages/
│       ├── Home.tsx            # Product listing
│       ├── Product.tsx         # Single product
│       ├── Cart.tsx            # Shopping cart
│       ├── Checkout.tsx        # Checkout flow
│       ├── Orders.tsx          # Order history
│       ├── Order.tsx           # Single order
│       ├── Profile.tsx         # User profile
│       └── Admin.tsx           # Admin dashboard
│
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

### 2.4 קומפוננטות מרכזיות

| קומפוננטה | תפקיד | Props |
|-----------|-------|-------|
| `Layout` | עטיפה לכל הדפים | `children` |
| `AuthModal` | Login/Register modal | `isOpen`, `view`, `onClose` |
| `ProductCard` | כרטיס מוצר | `product` |
| `CartItem` | שורת פריט בעגלה | `item`, `compact?` |
| `ProtectedRoute` | הגנה על routes | `children` |

### 2.5 Custom Hooks

```typescript
// useAuth - מצב התחברות
const { user, isAuthenticated, isAdmin, isLoading } = useAuth();

// useCart - נתוני עגלה
const { items, total, itemCount, isEmpty, isLoading } = useCart();
```

### 2.6 Data Flow

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  Component  │──────►│  RTK Query  │──────►│   Server    │
│             │◄──────│   (cache)   │◄──────│             │
└─────────────┘       └─────────────┘       └─────────────┘
    useState              automatic            MongoDB
   (UI state)           invalidation
```

### 2.7 דפי האפליקציה

| דף | נתיב | תיאור | Auth |
|----|------|-------|------|
| Home | `/` | רשימת מוצרים + סינון | ❌ |
| Product | `/product/:id` | דף מוצר | ❌ |
| Cart | `/cart` | עגלת קניות | ✅ |
| Checkout | `/checkout` | תשלום | ✅ |
| Orders | `/orders` | היסטוריה | ✅ |
| Order | `/orders/:id` | פרטי הזמנה | ✅ |
| Profile | `/profile` | פרופיל | ✅ |
| Admin | `/admin` | לוח ניהול | ✅ Admin |

### 2.8 תרשים זרימת משתמש

```
┌──────────────────────────────────────────────────────────────┐
│                         HOME                                  │
│  [סינון] [מוצר 1] [מוצר 2] [מוצר 3] ...                      │
└────────────────────────┬─────────────────────────────────────┘
                         │ Click
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                       PRODUCT                                 │
│  תמונה | שם | ₪199 | תיאור | כמות | [הוסף לעגלה]             │
└────────────────────────┬─────────────────────────────────────┘
                         │ Add to cart
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                         CART                                  │
│  פריט 1: מוצר X | 2 | ₪398                                   │
│  פריט 2: מוצר Y | 1 | ₪99                                    │
│  ─────────────────────────                                    │
│  סה"כ: ₪497              [המשך לתשלום]                        │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                      CHECKOUT                                 │
│  1. בחר/הזן כתובת                                             │
│  2. סיכום הזמנה                                               │
│  3. [לתשלום]                                                  │
└────────────────────────┬─────────────────────────────────────┘
                         │ Redirect
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                   STRIPE CHECKOUT                             │
│              (דף תשלום מאובטח)                                 │
└────────────────────────┬─────────────────────────────────────┘
                         │ Success/Cancel
                         ▼
                   ORDER CONFIRMED
```

### 2.9 אבטחה בצד לקוח

| נושא | מימוש |
|------|-------|
| Token Storage | localStorage |
| Protected Routes | ProtectedRoute component |
| Auto Refresh | Token refresh on 401 |
| XSS Prevention | React escapes by default |
| Input Validation | Client-side + server-side |

### 2.10 Environment Variables

```env
VITE_API_BASE_URL=https://simple-4-anp6.onrender.com/api
```

### 2.11 Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview build
npm run lint     # ESLint
```

<!-- ========== CLIENT-SECTION-END ========== -->

---

# חלק ד' - ניהול פרויקט

## 1.3.12 משאבים נדרשים

### 1.3.12.1 חלוקת שעות

| משימה | שעות | סטודנט 1 (Server) | סטודנט 2 (Client) |
|-------|------|-------------------|-------------------|
| תכנון וארכיטקטורה | 30 | 20 | 10 |
| Backend API | 120 | 120 | - |
| Frontend | 100 | - | 100 |
| בדיקות | 30 | 20 | 10 |
| Deployment | 10 | 7 | 3 |
| תיעוד | 10 | 6 | 4 |
| **סה"כ** | **300** | **173** | **127** |

### 1.3.12.2 ציוד נדרש

- מחשב עם 8GB+ RAM
- חיבור אינטרנט (ל-APIs חיצוניים)
- חשבון GitHub
- חשבון MongoDB Atlas (חינם)
- חשבון Stripe (test mode)
- חשבון Render.com (חינם)

### 1.3.12.3 תוכנות נדרשות

| תוכנה | שימוש |
|-------|-------|
| VS Code | IDE |
| Node.js 22+ | Runtime |
| Git | Version control |
| Postman | API testing |
| Chrome DevTools | Debugging |

### 1.3.12.4 ידע חדש שנלמד

| נושא | מקור למידה |
|------|------------|
| Express.js | expressjs.com |
| MongoDB + Mongoose | mongodb.com/docs |
| JWT Authentication | jwt.io |
| Stripe Payments | stripe.com/docs |
| TypeScript | typescriptlang.org |
| React + RTK Query | redux-toolkit.js.org |
| Tailwind CSS | tailwindcss.com |

### 1.3.12.5 ספרות ומקורות

- Express.js Documentation
- MongoDB University (free courses)
- Stripe Documentation
- OWASP Top 10 (security)
- "Clean Code" - Robert C. Martin
- Node.js Best Practices - goldbergyoni/nodebestpractices

---

## 1.3.13 תכנית עבודה

### Sprint Plan

| Sprint | שבועות | משימות |
|--------|--------|--------|
| **1** | 1-2 | Setup, DB design, User model, Auth |
| **2** | 3-4 | Products CRUD, Rate limiting, Tests |
| **3** | 5-6 | Cart, Orders, Transactions |
| **4** | 7-8 | Stripe integration, Webhooks |
| **5** | 9-10 | Admin, Metrics, Performance |
| **6** | 11-12 | Deployment, Docs, Final testing |

---

## 1.3.14 תכנון בדיקות

### 1.3.14.1 בדיקות תהליכיות (Full Flow)

| # | תרחיש | צעדים | תוצאה צפויה |
|---|-------|-------|-------------|
| 1 | הרשמה | POST /register → Login | User created, token issued |
| 2 | התחברות | POST /login → GET /verify | JWT valid, user data |
| 3 | קנייה מלאה | Add to cart → Checkout → Pay | Order confirmed, stock reduced |
| 4 | Brute force | 5 wrong passwords | Account locked 15 min |
| 5 | Logout | POST /logout → Use old token | 401 Unauthorized |
| 6 | Webhook | Stripe event → Order update | Payment processed once |

### 1.3.14.2 בדיקות יחידה (Unit Tests)

| מודול | בדיקות | Coverage |
|-------|--------|----------|
| **Auth Service** | Login, Register, Lockout, tokenVersion | 95% |
| **Order Service** | Create, Cancel, Stock validation | 90% |
| **Payment Service** | Webhook verify, Idempotency | 92% |
| **Product Service** | CRUD, Search, Filter | 88% |
| **Cart Service** | Add, Remove, Update quantity | 85% |

### Test Results

```
PASS  src/__tests__/auth.test.ts
PASS  src/__tests__/order.test.ts
PASS  src/__tests__/payment-webhook.test.ts
PASS  src/__tests__/products.test.ts
PASS  src/__tests__/health.test.ts

Test Suites: 6 passed, 6 total
Tests:       38 passed, 38 total
Coverage:    89%
```

---

## 1.3.15 בקרת גרסאות

### Git Workflow

```
main ─────────────────────────────────► Production
  │
  └─── develop ───────────────────────► Development
         │
         ├─── feature/auth ────────────► New features
         ├─── feature/payments
         ├─── bugfix/cart-total
         └─── ...
```

### Commit Convention

```
feat: Add account lockout after 5 failed logins
fix: Correct race condition in order creation
docs: Update API documentation
test: Add tests for payment webhook
refactor: Extract validation to separate module
```

### Version Numbering

**Semantic Versioning (SemVer)**
- Major (X.0.0) – Breaking changes
- Minor (0.X.0) – New features
- Patch (0.0.X) – Bug fixes

**Current Version:** 1.0.0

---

# חלק ה' - סיכום

<!-- סגנון כתיבה: סטודנטים - מה למדנו, איך זה עזר -->

## סיכום - מה למדנו

### הלמידה הטכנית

בפרויקט הזה למדנו לבנות מערכת מורכבת מאפס ועד production:

**צד שרת:**
- 🔧 ארכיטקטורת Layered Architecture עם הפרדה ברורה בין שכבות
- 🔒 אבטחה מרובת שכבות: JWT, bcrypt, rate limiting, tokenVersion
- 💳 אינטגרציה עם Stripe כולל webhooks ו-idempotency
- 🗄️ MongoDB transactions למניעת race conditions
- ✅ כתיבת בדיקות אוטומטיות עם Jest

**צד לקוח:**
- ⚛️ React 18 עם TypeScript
- 🔄 RTK Query לניהול state של שרת
- 🎨 Tailwind CSS לעיצוב מהיר ו-responsive
- 🔐 Protected routes והגנה על ממשק המשתמש

### הלמידה האישית

מעבר לטכנולוגיות, למדנו:

| נושא | מה למדנו |
|------|----------|
| **עבודת צוות** | חלוקת עבודה, Git workflow, code review |
| **תכנון** | לחשוב קדימה, לצפות בעיות, לתכנן פתרונות |
| **תיעוד** | הקוד הוא רק חצי מהעבודה - תיעוד חשוב לא פחות |
| **אבטחה** | לחשוב כמו תוקף, לא לסמוך על קלט מהמשתמש |
| **Production** | ההבדל בין "עובד על המחשב שלי" ל-production |

### אתגרים והתמודדות

| אתגר | איך התמודדנו |
|------|-------------|
| Race conditions | למדנו על MongoDB transactions |
| Token security | חקרנו ומצאנו את שיטת tokenVersion |
| Webhook reliability | הבנו idempotency patterns |
| TypeScript errors | למדנו להקפיד על types מההתחלה |

### המלצות לפרויקטים עתידיים

1. **תכננו את הארכיטקטורה לפני שמתחילים לקודד** - זה חוסך שעות של refactoring
2. **כתבו בדיקות מההתחלה** - לא בסוף כשכבר אין זמן
3. **תעדו תוך כדי** - לא לזכור בסוף מה עשיתם לפני 3 חודשים
4. **אל תזלזלו באבטחה** - זה לא "נוסיף אחר כך"
5. **Deploy מוקדם** - תגלו בעיות production לפני שמאוחר מדי

### סיכום

הפרויקט הזה היה הרבה יותר מ"עוד פרויקט לימודים". זו הייתה הזדמנות לבנות משהו אמיתי, להתמודד עם בעיות אמיתיות, וללמוד איך נראה פיתוח תוכנה מקצועי.

אנחנו גאים במה שבנינו, ומרגישים מוכנים להיכנס לעולם העבודה עם ידע מעשי וניסיון אמיתי.

---

**תאריך עדכון אחרון:** 01/03/2026  
**מצב:** Final  
**גרסה:** 1.0.0
