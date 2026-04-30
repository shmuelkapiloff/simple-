# Server Walkthrough Notes

מסמך לימוד מלא של צד השרת בפרויקט.

**מטרה:**
- להבין איך השרת בנוי
- להבין את זרימת הבקשה מקצה לקצה
- לבנות שליטה אמיתית על הקוד לפני הגנה

**תרשים זרימת מידע מלא של כל הפרויקט:**
- ראה [PROJECT_INFORMATION_FLOW_DIAGRAM.md](./PROJECT_INFORMATION_FLOW_DIAGRAM.md)

**מדריך עזר לקריאת קוד השרת:**
- ראה [SERVER_CODE_READING_GUIDE_HE.md](./SERVER_CODE_READING_GUIDE_HE.md)

---

## חלק א׳ — מבוא מהיר: מה כדאי לדעת לפני שמתחילים

### מילון מושגים מהיר

**Route**
הכתובת ב-API שאליה הלקוח פונה.
דוגמה: `POST /api/auth/login`

**Middleware**
קוד שרץ לפני ה-controller.
הוא יכול: לבדוק אם המשתמש מחובר, לעשות rate limit, לבדוק שה-ID חוקי, לרשום לוגים, לאסוף metrics.

**Controller**
השכבה שמקבלת את `req` ו-`res` ומנהלת את הבקשה.
בדרך כלל היא: קוראת validator, מפעילה service, מחזירה response.

**Service**
הלוגיקה העסקית האמיתית.
כאן יש: בדיקות מורכבות, עבודה עם טוקנים, שילוב בין כמה מודלים, חיבור לשירותים חיצוניים.

**Model**
השכבה שעובדת מול MongoDB דרך Mongoose.
היא מגדירה איך הנתונים נשמרים ואיך שואלים אותם.

**Validator**
שכבה שבודקת אם הקלט מהלקוח תקין.
בפרויקט הזה משתמשים בעיקר ב-Zod.

---

### מפת התיקיות של השרת

| תיקייה/קובץ | אחריות |
|-------------|---------|
| `src/server.ts` | נקודת ההפעלה הראשית — startup, DB connections, port |
| `src/app.ts` | בניית Express app — middleware, routes, error handlers |
| `src/routes/` | מפת כל ה-endpoints; לאן כל בקשה הולכת |
| `src/controllers/` | לוגיקת HTTP — קורא validators, מפעיל services, מחזיר response |
| `src/services/` | הלב העסקי — הלוגיקה הראשית, DB, external APIs |
| `src/models/` | schemas של MongoDB/Mongoose |
| `src/validators/` | בדיקות קלט עם Zod לפני שממשיכים |
| `src/middlewares/` | אבטחה, אימות, rate limit, logging, שגיאות |
| `src/config/` | סביבה, CORS, חיבורים, קבועים |
| `src/utils/` | כלי עזר: logger, asyncHandler, response helpers |
| `src/__tests__/` | בדיקות — כיצד המערכת אמורה להתנהג |

---

### מפת ה-API לפי מודולים

**Auth** — `src/routes/auth.routes.ts`

| endpoint | גישה | תיאור |
|----------|------|--------|
| `POST /api/auth/register` | ציבורי | הרשמת משתמש חדש |
| `POST /api/auth/login` | ציבורי | התחברות |
| `POST /api/auth/google` | ציבורי | כניסה עם Google |
| `POST /api/auth/forgot-password` | ציבורי | שליחת מייל איפוס |
| `POST /api/auth/reset-password/:token` | ציבורי | איפוס סיסמה |
| `POST /api/auth/refresh` | ציבורי | חידוש access token |
| `GET /api/auth/verify` | מוגן | בדיקת תקפות סשן |
| `GET /api/auth/profile` | מוגן | שליפת פרופיל |
| `PUT /api/auth/profile` | מוגן | עדכון פרופיל |
| `POST /api/auth/change-password` | מוגן | החלפת סיסמה |
| `POST /api/auth/logout` | מוגן | ניתוק |

**Products** — `src/routes/product.routes.ts`

| endpoint | גישה | תיאור |
|----------|------|--------|
| `GET /api/products` | ציבורי | רשימת מוצרים + פילטרים |
| `GET /api/products/categories/list` | ציבורי | רשימת קטגוריות |
| `GET /api/products/:id` | ציבורי | מוצר בודד |

**Cart** — `src/routes/cart.routes.ts` — כולם מוגנים

| endpoint | תיאור |
|----------|--------|
| `GET /api/cart` | עגלת המשתמש |
| `GET /api/cart/count` | כמות פריטים |
| `POST /api/cart/add` | הוספת פריט |
| `PUT /api/cart/update` | עדכון כמות |
| `DELETE /api/cart/remove` | הסרת פריט |
| `DELETE /api/cart/clear` | ניקוי עגלה |

**Orders** — `src/routes/order.routes.ts`

| endpoint | גישה | תיאור |
|----------|------|--------|
| `GET /api/orders/track/:orderId` | ציבורי | מעקב הזמנה |
| `POST /api/orders` | מוגן | יצירת הזמנה |
| `GET /api/orders` | מוגן | הזמנות המשתמש |
| `GET /api/orders/:orderId` | מוגן | הזמנה בודדת |
| `POST /api/orders/:orderId/cancel` | מוגן | ביטול הזמנה |

**Payments** — `src/routes/payment.routes.ts`

| endpoint | גישה | תיאור |
|----------|------|--------|
| `POST /api/payments/webhook` | ציבורי (Stripe) | אירועי תשלום |
| `POST /api/payments/create-intent` | מוגן | יצירת payment intent |
| `POST /api/payments/checkout` | מוגן | alias ל-create-intent |
| `GET /api/payments/:orderId/status` | מוגן | סטטוס תשלום |

**Addresses** — `src/routes/address.routes.ts` — כולם מוגנים

| endpoint | תיאור |
|----------|--------|
| `GET /api/addresses` | כל הכתובות |
| `GET /api/addresses/default` | כתובת ברירת מחדל |
| `GET /api/addresses/:addressId` | כתובת בודדת |
| `POST /api/addresses` | יצירת כתובת |
| `PUT /api/addresses/:addressId` | עדכון כתובת |
| `DELETE /api/addresses/:addressId` | מחיקת כתובת |
| `POST /api/addresses/:addressId/set-default` | הגדרת ברירת מחדל |

**Admin** — `src/routes/admin.routes.ts` — דורש role=admin

| endpoint | תיאור |
|----------|--------|
| `GET /api/admin/products` | כל המוצרים |
| `POST /api/admin/products` | יצירת מוצר |
| `PUT /api/admin/products/:id` | עדכון מוצר |
| `DELETE /api/admin/products/:id` | מחיקת מוצר |
| `GET /api/admin/users` | כל המשתמשים |
| `PUT /api/admin/users/:id/role` | שינוי תפקיד |
| `GET /api/admin/orders` | כל ההזמנות |
| `PUT /api/admin/orders/:id/status` | עדכון סטטוס הזמנה |
| `GET /api/admin/stats/summary` | סטטיסטיקות |

**Health + Metrics**

| endpoint | תיאור |
|----------|--------|
| `GET /health` | בדיקת חיות |
| `GET /api/health` | health check מלא |
| `GET /metrics` | Prometheus metrics |

---

### הזרימה המרכזית של בקשה

```
server.ts → app.ts → middleware → route → controller → service/model → response
```

זאת השרשרת שצריך לזכור. כל request עובר אותה בסדר הזה.

---

### איך לקרוא קובץ בשרת בצורה חכמה

כשפותחים קובץ חדש, שואלים תמיד:

1. האם זה קובץ תשתית או קובץ לוגיקה עסקית?
2. האם הוא מקבל `req`/`res`?
3. האם הוא בודק קלט?
4. האם הוא ניגש למסד נתונים?
5. האם הוא מחזיר תשובה ללקוח?
6. האם הוא רק עוזר לשכבה אחרת?

אם עונים על השאלות האלה, כמעט כל קובץ הופך ברור.

---

## חלק ב׳ — עקרונות חשובים להבנה

### 1. לא לומדים רק לפי תיקיות
צריך להבין את הזרימה האמיתית של בקשה.

### 2. לכל קובץ יש אחריות אחת עיקרית
כשקוראים קובץ, שואלים:
- מה האחריות שלו?
- מתי הוא נכנס לפעולה?
- עם מי הוא מדבר?
- מה הוא מחזיר?

### 3. middleware לומדים בהקשר
לא צריך לשנן את כולם מראש.
מספיק להבין:
- middleware גלובליים דרך `app.ts`
- middleware מקומיים דרך ה-route הרלוונטי

---

## חלק ג׳ — נקודות הכניסה: server.ts ו-app.ts

### מפת השרת בקצרה

**`src/server.ts`** — startup בלבד:
- הפעלת השרת וחיבור ל-MongoDB
- חיבור ל-Redis
- הפעלת שירות webhook retry ברקע
- פתיחת הפורט + כיבוי מסודר

**`src/app.ts`** — request handling:
- יצירת אפליקציית Express
- רישום middleware כלליים
- רישום routes
- endpoints כלליים (health, docs)
- טיפול ב-404 וב-errorHandler גלובלי

---

### סדר הלמידה המומלץ

1. `src/server.ts` ו-`src/app.ts` — נקודת הכניסה
2. `src/routes/*` — מפת ה-API
3. זרימת בקשה מלאה: route → middleware → controller → validator → service/model → response
4. מודול Authentication (הכי מלא — מכסה את כל השכבות)
5. מודול Products (פשוט, טוב לתרגול)
6. מודול Cart (cache + concurrency)
7. מודול Orders (state machine + idempotency)
8. מודול Payments (security + webhooks)
9. מודול Addresses (CRUD נקי)
10. מודול Admin (authorization + audit)
11. תשתית השרת — Middleware / Config / Utils
12. Tests — אסטרטגיית בדיקות

---

### פירוק של `src/server.ts`

**האחריות של הקובץ:**
קובץ ההפעלה הראשי של השרת.
הוא לא מגדיר routes ולא business logic, אלא אחראי להעלות את המערכת בצורה תקינה.

**מה קורה בו בסדר ריצה:**
1. מייבאים את אפליקציית Express מתוך `app.ts`
2. מייבאים הגדרות סביבה מתוך `config/env`
3. מייבאים פונקציות חיבור ל-MongoDB ול-Redis
4. מייבאים שירות רקע של webhook retry
5. מגדירים פונקציית `main()` אסינכרונית שמריצה את כל ה-startup flow
6. מנסים להתחבר ל-MongoDB
7. אם החיבור מצליח, מפעילים גם את שירות הנסיון מחדש של webhook
8. מנסים להתחבר ל-Redis
9. פותחים את השרת על הפורט מתוך קובץ הסביבה
10. רושמים לוגים על מצב ההגדרות של Stripe ו-CLIENT_URL
11. מטפלים בשגיאת פורט תפוס
12. מטפלים בכיבוי מסודר של השרת

**הרעיון הכי חשוב:**
`server.ts` = startup and infrastructure
`app.ts` = request handling and routes

---

### פירוק של `src/app.ts`

**האחריות של הקובץ:**
בונה את אפליקציית Express עצמה.
כאן מגדירים את ה-middleware הגלובליים, את ה-routes הראשיים, ואת הטיפול בשגיאות.

**מה קורה בו בסדר ריצה:**
1. יוצרים את האפליקציה עם `express()`
2. מגדירים `trust proxy` כדי שהשרת יעבוד נכון מאחורי proxy
3. מפעילים middleware כלליים:
   - `helmet` לאבטחה
   - `corsConfig` להרשאות cross-origin
   - `express.raw` רק למסלול של webhook (חייב לפני express.json!)
   - `express.json` ו-`express.urlencoded` לפענוח body
   - `requestIdMiddleware` להוספת מזהה בקשה
   - `auditLoggingMiddleware` להעשרת הבקשה בהקשר audit (IP, user-agent, session)
   - `requestLoggerMiddleware` ללוגים
   - `metricsMiddleware` לאיסוף metrics
4. מגדירים endpoints כלליים: `/metrics`, `/health`, `/api/docs`, `/api/docs.json`
5. מחברים את כל ה-routes של המערכת תחת `/api/...`
6. מגדירים endpoint של root (`/`) עם מידע על ה-API
7. מוסיפים handler ל-404
8. בסוף מוסיפים `errorHandler` גלובלי

**הנקודה הכי חשובה:**
הסדר בתוך `app.ts` קריטי.
כל middleware שרשום לפני ה-routes ירוץ לפני ה-controller.
כל handler שרשום אחרי ה-routes יתפוס מקרים שלא טופלו קודם.

**דוגמה לזרימת בקשה אמיתית — `POST /api/auth/login`:**
1. הבקשה נכנסת ל-Express app
2. עוברת דרך middleware גלובליים (helmet, cors, parsing, requestId, audit, logging, metrics)
3. מגיעה ל-`authRoutes`
4. עוברת דרך `authRateLimiter`
5. מגיעה ל-`AuthController.login`
6. ה-controller עושה `loginSchema.parse(req.body)`
7. אם תקין, קורא ל-`AuthService.login`
8. מוחזרת תשובת JSON מסודרת ללקוח

---

## חלק ד׳ — מודול Authentication (פירוק מלא)

### למה מתחילים כאן
זה המודול הכי טוב להתחיל ממנו, כי הוא כולל כמעט את כל השכבות:
route → middleware → controller → validator → service → model

### `auth.routes.ts` — פירוק שורה-שורה

**מה הקובץ עושה:**
זה קובץ מיפוי. הוא כמעט לא מכיל לוגיקה עסקית, רק מחבר בין endpoint לבין middleware ו-controller.

**דפוס קבוע:**
- routes ציבוריים → `authRateLimiter`
- routes מוגנים → `authenticate`

**imports:**
- `Router` מ-Express: יוצר route module נפרד שאפשר לחבר ב-`app.ts`
- `AuthController`: כל פונקציה מטפלת ב-HTTP עבור endpoint אחד
- `authenticate`: middleware שבודק JWT ומחבר את המשתמש ל-`req`
- `authRateLimiter`: middleware להגבלת קצב במסלולי auth רגישים

**Public routes:**
- `POST /register`: `authRateLimiter` + `AuthController.register` — גם הרשמה מוגנת מ-spam
- `POST /login`: אותו דפוס
- `POST /forgot-password`: מגן על endpoint שיכול לייצר מיילים
- `POST /reset-password/:token`: token מגיע ב-URL param
- `POST /refresh`: חידוש טוקן מוגבל קצב
- `POST /google`: כניסה דרך Google

**Protected routes:**
- `GET /verify`: בדיקת תקפות סשן
- `GET /profile`: שליפת פרופיל
- `PUT /profile`: עדכון פרופיל
- `POST /change-password`: פעולה רגישה
- `POST /logout`: ניתוק דרך tokenVersion

**דפוס חשוב לזכור:**
סדר ההרצה בכל route הוא משמאל לימין.
route לא בודק business logic, לא מאמת שדות, רק מחווט: URL → middleware → controller.

---

### `auth.controller.ts` — פירוק שורה-שורה

**מה ה-controller עושה:**
שכבת התיווך בין HTTP לבין הלוגיקה העסקית.
1. קורא נתונים מ-`req`
2. בודק עם schema של Zod
3. קורא ל-`AuthService` ומחזיר תשובה

**מבנה הקובץ:**
- כל endpoint הוא `static` function במחלקה `AuthController`
- כל פונקציה עטופה ב-`asyncHandler` כדי ששגיאות async יגיעו ל-error middleware
- ה-controller לא מדבר ישירות עם MongoDB — רק דרך `AuthService`

**`googleLogin`:**
- קורא `idToken` מ-`req.body`, אם חסר → `400`
- קורא `findOrCreateGoogleUser(idToken)`
- אם Google דוחה את ה-token → service זורק `ValidationError` → לקוח מקבל `400`
- אם משתמש חסום → `403`
- מחזיר `200` עם משתמש מסונן

**`register`:** validation עם `registerSchema` → `AuthService.register` → `201 Created`

**`login`:** validation עם `loginSchema` → `AuthService.login` → `200` עם user + tokens

**`forgotPassword`:** validation → `AuthService.forgotPassword(email)` → הצלחה גנרית

**`verify`:** שולף access token מ-Authorization header → `AuthService.verifyToken`

**`getProfile`:** קורא `req.userId` (מה-authenticate middleware) → `AuthService.getProfile`

**`resetPassword`:** token מ-`req.params.token` → `resetPasswordSchema` → `AuthService.resetPassword`

**`refreshToken`:** קורא `refreshToken` מה-body → `AuthService.refreshAccessToken`

**`logout`:** דורש `req.userId` → `AuthService.logout`

**`changePassword`:** validation עם `changePasswordSchema` → `AuthService.changePassword`

**תובנה חשובה:**
ברגע שמזהים את הדפוס — קלט מ-req, validation, קריאת service, response אחיד — כל controller אחר במערכת ייראה מוכר.

---

### `auth.validator.ts` — פירוט Zod מלא

**מה הקובץ עושה:**
מגדיר מה מותר לשלוח בכל פעולה. לא מטפל ב-DB — רק מגן מקלט לא תקין.

**`registerSchema`:**
```ts
name: z.string().min(2, "Name must be at least 2 characters")
email: z.string().email("Invalid email format")
password: z.string().min(6, "Password must be at least 6 characters")
```
- `z.string()` — חייב להיות string
- `.min(2)` — לפחות 2 תווים, אחרת הודעת שגיאה
- `.email()` — Zod בודק פורמט מייל תקין
- `RegisterInput = z.infer<typeof registerSchema>` — TypeScript מסיק טיפוס אוטומטית

**`loginSchema`:**
- password דורש רק `min(1)`, לא `min(6)` — ב-login לא מוודאים כללי מורכבות, רק שמשהו נשלח

**`resetPasswordSchema` — `.refine()` בפעם הראשונה:**
```ts
z.object({ password, confirmPassword })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
```
- `.refine()` — כלל validation מותאם שבודק **קשר בין שדות**
- `path: ["confirmPassword"]` — מצמיד את השגיאה לשדה הנכון

**`updateProfileSchema`:**
```ts
z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
})
.refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided",
})
```
- `.optional()` — שדה יכול להיות חסר
- refine בודק שלא נשלח body ריק לחלוטין

**`changePasswordSchema` — שני refines:**
```ts
.refine(data => data.newPassword === data.confirmPassword, ...)
.refine(data => data.currentPassword !== data.newPassword, ...)
```
- שרשור של כמה `.refine()` — כל אחד בודק היבט אחר

**סיכום `.refine()` בשלוש שורות:**
- לבדיקת שדה בודד: `z.string().min(6)`
- לבדיקת קשר בין שדות: `.refine(data => ...)`
- שגיאת refine מצורפת לשדה ספציפי דרך `path`

---

### `auth.service.ts` — הלב של auth

**מבנה הקובץ:**
1. פונקציות עזר ל-Google OAuth — מחוץ למחלקה
2. מחלקה `AuthService` — כל הלוגיקה הראשית
3. Private helpers — `generateToken`, `sanitizeUser`, `sendResetEmail`

**משתנים חשובים:**
```ts
const JWT_SECRET = env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || env.JWT_SECRET + "-refresh";
```
- מפתח שונה ל-access ול-refresh — גם אם access token דלף, לא ניתן לזייף refresh

**`register`:**
1. מחפש משתמש קיים → אם קיים → `ApiError 409`
2. יוצר משתמש חדש (`email.toLowerCase()` — מניעת חשבונות כפולים)
3. מייצר access + refresh tokens, מעדכן `lastLogin`
4. מחזיר user מסונן + tokens

**`login` — הפונקציה הכי מורכבת:**
```
1. מחפש משתמש + .select("+password +failedLoginAttempts +lockedUntil")
   כי שדות אלה הוסתרו בברירת מחדל ב-user.model
2. בודק אם חשבון נעול (lockedUntil) → HTTP 423 עם כמה דקות נותרות
3. בודק סיסמה דרך user.comparePassword()
   - אם שגויה: failedLoginAttempts++
   - אחרי 5 כשלונות: נועל 15 דקות
4. אם הסיסמה נכונה: מאפס failedLoginAttempts + lockedUntil
5. מייצר tokens + מעדכן lastLogin
6. מחזיר user מסונן + tokens
```
- **למה `.select("+password")`?** ב-user.model הסיסמה מוסתרת בברירת מחדל (`select: false`)
- **HTTP 423** = "Locked" — מדויק לנעילת חשבון

**`forgotPassword` — אבטחה חכמה:**
```
1. מחפש משתמש לפי email
2. אם לא נמצא → הודעה גנרית! (לא מגלה שהמשתמש לא קיים)
3. מייצר resetToken אקראי (32 bytes)
4. שומר ב-DB רק את ה-HASH (לא הטוקן עצמו)
5. שולח email עם קישור עם הטוקן הגולמי
```
- **הודעה גנרית** — הגנה מ-"User Enumeration Attack"
- **שומרים hash** — אם מישהו גנב את ה-DB, הטוקן הגולמי לא שמור

**`changePassword`:**
- מגדיל `tokenVersion` ב-1 → כל הסשנים הפתוחים מתנתקים
- מי שגנב טוקן — הטוקן שלו בטל ברגע שינוי הסיסמה

**`logout`:**
- מגדיל `tokenVersion` ב-1 בלבד
- אין blacklist, אין Redis — רק מספר שמתעדכן

**`verifyToken`:**
1. מפענח JWT
2. שולף user מה-DB
3. בודק שה-`tokenVersion` בטוקן === ה-`tokenVersion` של המשתמש
4. אם logout היה → tokenVersion עלה → הטוקן הישן נדחה

**`refreshAccessToken`:**
- מפענח refresh token עם `JWT_REFRESH_SECRET` (שונה מ-access!)
- בודק tokenVersion
- מחזיר access token חדש בלבד (לא refresh חדש)

**`sanitizeUser` — private:**
```ts
delete userObject.password;
delete userObject.resetPasswordToken;
delete userObject.resetPasswordExpires;
return userObject;
```
לעולם לא שולחים password ב-response.

**סיכום דפוסים ב-auth.service.ts:**

| דפוס | מטרה |
|------|-------|
| `email.toLowerCase()` | עקביות — מונע חשבונות כפולים |
| `select("+password")` | שדות מוסתרים בברירת מחדל |
| `tokenVersion` | logout ו-changePassword מבטלים כל הסשנים |
| hash של reset token | אבטחה — לא שומרים טוקנים גולמיים |
| הודעה גנרית ב-forgotPassword | מניעת user enumeration |
| `sanitizeUser` לפני response | לא מגלים מידע רגיש |
| pre-save hook | הצפנת סיסמה אוטומטית |

---

### `user.model.ts` — פירוט מלא

**מבנה הקובץ:**
1. `interface IUser extends Document` — טיפוס TypeScript של document
2. `UserSchema` — שדות + חוקי validation + הגדרות select
3. Hooks + methods — `pre('save')` לhash + `comparePassword`
4. Export — `UserModel` + טיפוסים

**שדות מיוחדים:**

`password: { select: false }` — לא חוזר בשאילתות רגילות; דורש `.select("+password")`

`googleId: { sparse: true }` — index שמתעלם מ-null; חוסך מקום כי רוב המשתמשים לא Google

`lockedUntil: { index: true }` — index כי כל login בודק אם החשבון נעול

`tokenVersion: { default: 0 }` — נבדק בכל verifyToken

**`toJSON: { transform }` — ניקוי אוטומטי:**
```ts
toJSON: {
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    delete ret.failedLoginAttempts;
    delete ret.lockedUntil;
    delete ret.__v;
    return ret;
  }
}
```
גם אם מישהו שכח `sanitizeUser` ב-service — המידע לא ידלוף.

**שלוש שכבות הגנה על password:**
1. `select: false` — לא חוזר מ-DB בכלל
2. `sanitizeUser` ב-service — מוחק לפני response
3. `toJSON transform` — מוחק בכל המרה ל-JSON

**`pre('save')` — הצפנת סיסמה אוטומטית:**
```ts
UserSchema.pre("save", async function(next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
```
- רץ לפני כל `save()` — אוטומטי
- `isModified("password")` — לא מצפין שוב אם הסיסמה לא השתנתה
- 12 rounds — חזק יותר מברירת מחדל (10)

**`comparePassword` — instance method:**
```ts
return await bcrypt.compare(candidatePassword, this.password);
```
- לא ניתן לפענח bcrypt — רק להשוות

**סיכום user.model.ts בשורה אחת:**
המודל מגדיר: **צורת הנתונים + חוקי אבטחה + הגנות מובנות** — הכל במקום אחד.

---

## חלק ה׳ — מודול Products (פירוק מלא)

### למה Products הוא המודול הכי פשוט להבנה
- **אין אימות** — כל המסלולים ציבוריים
- **אין כתיבה** — רק קריאה מה-DB
- **אין validator של Zod** — פילטרים מטופלים ב-service
- הדפוס: `route → controller → service → model → response`

---

### `product.routes.ts` — פירוק שורה-שורה

```ts
productRouter.get("/", publicReadRateLimiter, getProducts);
productRouter.get("/categories/list", publicReadRateLimiter, getCategoriesList);
productRouter.get("/:id", publicReadRateLimiter, validateProductId, getProduct);
```

**מה חדש לעומת auth.routes:**
- `publicReadRateLimiter` — rate limit שונה לציבורי
- `validateProductId` — בודק שה-`:id` הוא ObjectId תקין לפני controller
- סדר routes: `/categories/list` **חייב** לבוא לפני `/:id`

**למה סדר routes חשוב?**
Express קורא routes מלמעלה למטה.
אם `/:id` היה קודם — הבקשה ל-`/categories/list` הייתה נתפסת עם `id = "categories"`.

---

### `product.controller.ts`

**`getProducts`:**
```ts
const filters: ProductFilters = {
  category: req.query.category as string,
  minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
  ...
};
```
- query params תמיד `string` — לכן `parseFloat` להמרה
- אין Zod כאן — הסינון הבטוח קורה ב-service

**`getProduct`:**
```ts
const product = await getProductById(id);
if (!product) throw new NotFoundError("Product");
```
- id כבר עבר `validateProductId` — מובטח שהוא ObjectId תקין
- `NotFoundError` → `errorHandler` מחזיר 404

---

### `product.service.ts` — הלוגיקה החשובה

**`listProducts` — בניית שאילתת MongoDB בטוחה:**

```ts
const query: any = { isActive: true }; // רק מוצרים פעילים
```

**Whitelist לקטגוריות — הגנה מ-NoSQL Injection:**
```ts
const VALID_CATEGORIES = ["accessories", "audio", ...] as const;
if (filters.category) {
  if (VALID_CATEGORIES.includes(categoryLower)) {
    query.category = categoryLower;
  }
  // אם לא בwhitelist — מתעלמים בשקט
}
```
בלי whitelist, תוקף יכול לשלוח `category: { $gt: "" }` ולבצע NoSQL Injection.

**Price range:**
```ts
query.price.$gte = filters.minPrice; // greater than or equal
query.price.$lte = filters.maxPrice; // less than or equal
```

**Search — הגנה מ-ReDoS:**
```ts
const sanitizedSearch = filters.search.trim().slice(0, 100); // הגבלת אורך
const escapedSearch = sanitizedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // בריחה מ-regex
query.$or = [
  { name: { $regex: escapedSearch, $options: "i" } },
  ...
];
```
- `slice(0, 100)` — מונע DoS ממחרוזת ארוכה
- `replace(...)` — מבריח תווים של regex (`.*.*.*` יכול לגרום ReDoS)

**`.lean()` — אופטימיזציה:**
```ts
ProductModel.find(query).sort(sort).lean()
```
מחזיר plain object במקום Mongoose document — קל וזריז יותר לקריאה בלבד.

**`getCategories`:**
```ts
ProductModel.distinct("category", { isActive: true });
```
`distinct` = ערכים ייחודיים של שדה, ללא כפילויות.

---

### `product.model.ts` — עיקרי

- `sku: { unique: true }` — מזהה עסקי ייחודי למוצר
- `isActive: { default: true }` — soft delete: מוצר לא נמחק, רק מסומן
- `featured` — מוצרים מומלצים לדף הבית
- `stock` — כמות במלאי
- Indexes מורכבים: `{ category, isActive }` ו-`{ featured, isActive }` — מהיר לשאילתות שמשתמשות בשניהם יחד

**`InferSchemaType` — שיטה חלופית לממשק:**
```ts
export type Product = InferSchemaType<typeof productSchema>;
```
Mongoose מסיק את הטיפוס אוטומטית מה-schema — קצר יותר מ-`interface IUser extends Document`.

---

### סיכום מודול Products

| דפוס | מה ללמוד |
|------|----------|
| `publicReadRateLimiter` | rate limit שונה לציבורי |
| סדר routes — ספציפי לפני כללי | `/categories/list` לפני `/:id` |
| `validateObjectId` middleware | בדיקה לפני controller |
| Whitelist לקטגוריות | הגנה מ-NoSQL Injection |
| escape בחיפוש regex | הגנה מ-ReDoS |
| `.lean()` | plain object במקום Mongoose document |
| `isActive` soft delete | מחיקה רכה |

---

## חלק ו׳ — מודול Cart (פירוק מלא)

### מה מייחד את מודול Cart
- כל המסלולים מוגנים — אין guest cart
- Redis cache — קריאות מהירות, כתיבה תמיד ל-MongoDB קודם
- לוגיקת מלאי — בדיקת stock לפני הוספה
- pre-save hook — חישוב total אוטומטי
- optimistic concurrency — מניעת race conditions

---

### `cart.routes.ts` — דפוס חדש: `router.use()`

```ts
router.use(requireAuth);
router.use(apiRateLimiter);
```

**זה שונה ממה שראינו ב-auth ו-products:**
`router.use()` מפעיל middleware על **כל** הroutes ב-router זה.
שורה אחת מגינה על כולם — נקי יותר, קל לתחזוקה.

---

### `cart.controller.ts` — דפוסים חדשים

**`sendSuccess` / `sendError`:**
```ts
sendSuccess(res, cart, "Item added to cart");
sendError(res, 400, "Missing required fields");
```
פונקציית עזר מ-`utils/response` שמבטיחה פורמט אחיד: `{ success, data?, message? }`.

**Validation ידנית ב-controller:**
```ts
if (!productId || !quantity) { sendError(res, 400, "Missing required fields"); return; }
if (!mongoose.isValidObjectId(productId)) { sendError(res, 400, "Invalid productId"); return; }
if (quantity <= 0) { sendError(res, 400, "Quantity must be greater than 0"); return; }
```
כאן בחרו **לא** להשתמש ב-Zod — הבדיקות פשוטות וספציפיות.

**`getCart` מחזיר עגלה ריקה ולא 404:**
```ts
if (!cart) {
  sendSuccess(res, { userId, items: [], total: 0 });
  return;
}
```
UX decision: משתמש חדש מקבל עגלה ריקה, לא שגיאה.

---

### `cart.model.ts` — מבנה מקונן

```ts
const cartItemSchema = new Schema({ product, quantity, lockedPrice }, { _id: false });
const cartSchema = new Schema({ userId, items: [cartItemSchema], total });
```

- `cartItemSchema` — schema מקונן בתוך `cartSchema`
- `{ _id: false }` — Mongoose לא מייצר `_id` לכל item (הם לא documents עצמאיים)
- `product: { type: ObjectId, ref: "Product" }` — reference; populate מחליף ID ב-document מלא
- `lockedPrice: null` — null = מחיר דינמי; ערך = מחיר נעול בזמן checkout

**`pre('save')` — חישוב total אוטומטי:**
```ts
cartSchema.pre("save", async function(next) {
  if (this.isModified("items")) {
    await this.populate("items.product");
    let total = 0;
    for (const item of this.items) {
      const price = item.lockedPrice ?? item.product?.price ?? 0;
      total += price * item.quantity;
    }
    this.total = total;
  }
  next();
});
```
- `??` — nullish coalescing: אם `lockedPrice` הוא null, משתמשים ב-`product.price`
- לא צריך לחשב total ידנית בשום מקום

---

### `cart.service.ts` — הדברים המתקדמים ביותר

**Write-Through Cache Strategy:**
```
קריאה: Redis קודם → אם אין: MongoDB → שמור ב-Redis
כתיבה: MongoDB קודם → אחר כך עדכן Redis
```
למה? MongoDB הוא מקור האמת. Redis הוא cache בלבד — אם נופל, שום דבר לא אובד.

**Redis best-effort — שגיאות נבלעות:**
```ts
private static async cacheSet(key, data): Promise<void> {
  if (!this.isRedisReady()) return; // Redis לא פעיל? מדלגים
  try {
    await redisClient.setex(key, this.CACHE_TTL, JSON.stringify(data));
  } catch (err) {
    logger.warn(..., "Redis SET failed (swallowed)"); // לא זורקים שגיאה!
  }
}
```
כשל ב-Redis לא מפיל בקשה — הוא cache בלבד.

**`addToCart` — Optimistic Concurrency:**
```ts
for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
  try {
    return await this._addToCartOnce(...);
  } catch (err) {
    if (err.name === "VersionError" && attempt < MAX_RETRIES) continue; // נסה שוב
    throw err;
  }
}
```
**מה זה VersionError?**
Mongoose מוסיף שדה `__v` לכל document.
אם שני requests שינו אותו document בו-זמנית — השני יזרוק `VersionError`.
הפתרון: retry עם המידע העדכני.

**בתוך `_addToCartOnce`:**
```ts
const [product, existingCart] = await Promise.all([
  ProductModel.findById(productId),
  CartModel.findOne({ userId }),
]);
```
`Promise.all` = שתי שאילתות במקביל — חצי זמן המתנה.

**`updateQuantity` — כמות 0 = מחיקה:**
```ts
if (quantity <= 0) return this.removeFromCart(productId, userId);
```
חכם: update עם 0 מוחק — לא צריך endpoint נפרד.

---

### סיכום מודול Cart

| דפוס | מה ללמוד |
|------|----------|
| `router.use(middleware)` | הגנה על כל ה-router בשורה אחת |
| Write-Through Cache | כתיבה ל-DB, קריאה מ-Redis |
| Redis best-effort | כשל ב-Redis לא מפיל בקשה |
| `Promise.all` | שאילתות במקביל = ביצועים |
| Optimistic concurrency + VersionError | retry לrace conditions |
| `lockedPrice` | נעילת מחיר בזמן checkout |
| `{ _id: false }` ב-sub-schema | פריטי עגלה אינם documents עצמאיים |

---

## חלק ז׳ — מודול Orders (פירוק מלא)

### מה מיוחד במודול הזה
- **סטטוסים מרובים** — הזמנה עוברת מחזור חיים שלם
- **שילוב עם Payment** — יצירת הזמנה מייצרת גם payment intent ב-Stripe
- **idempotency** — מניעת יצירה כפולה בלחיצה כפולה
- **tracking history** — כל שינוי סטטוס נשמר עם timestamp
- **stock מנוהל בזהירות** — מנוכה רק אחרי תשלום מאושר

---

### `order.routes.ts` — דפוסים חדשים

```ts
// ציבורי — מעקב הזמנה
router.get("/track/:orderId", publicReadRateLimiter, validateOrderId, OrderController.trackOrder);

// כל השאר דורש auth
router.use(requireAuth);

// יצירת הזמנה עם idempotency
router.post("/", idempotencyMiddleware("order"), OrderController.createOrder);
```

**למה `/track/:orderId` ציבורי?**
משתמש יכול לקבל SMS עם קישור מעקב ולפתוח אותו בלי להיות מחובר.
המידע מוגבל — רק סטטוס, היסטוריה, מוצרים. לא פרטים אישיים.

**`idempotencyMiddleware("order")`:**
לחיצה כפולה על "שלם" = שתי בקשות.
בלי idempotency — שתי הזמנות נוצרות.
עם idempotency — הבקשה השנייה מקבלת את התשובה הראשונה מה-cache.

---

### `idempotency.middleware.ts` — איך זה עובד

```ts
const idempotencyKey = req.headers["idempotency-key"] as string;
const existing = await IdempotencyKeyModel.findOne({ key: idempotencyKey, userId });

if (existing) {
  return res.status(existing.responseStatus).json(existing.responseBody);
}
// ... מיירט את התשובה ושומר אותה
```

1. לקוח שולח בקשה עם header `Idempotency-Key: <uuid>`
2. middleware בודק ב-DB אם ה-key כבר קיים לאותו userId
3. אם כן → מחזיר תשובה שמורה
4. אם לא → ממשיך ל-controller, ואחר כך שומר את התשובה
5. אם הלקוח לא שולח key → `next()` ללא idempotency (backwards compatible)

---

### `order.controller.ts` — `createOrder`

```ts
// 1. יצירת הזמנה
const order = await OrderService.createOrder(userId, validated);

// 2. יצירת payment intent ב-Stripe
const paymentIntentResult = await PaymentService.createPaymentIntent(userId, order._id);

// 3. שמירת paymentIntentId
order.paymentIntentId = paymentIntentResult.payment.providerPaymentId;
await order.save();

// 4. מחזיר clientSecret ללקוח
res.status(201).json({ order, payment: { clientSecret, ... } });
```

**מה זה `clientSecret`?**
Token חד-פעמי של Stripe שהלקוח משתמש בו להזנת פרטי כרטיס.
השרת **לא** מקבל פרטי כרטיס — Stripe מטפל ישירות.

**סטטוס ראשוני = `pending_payment`:**
הזמנה נוצרת אבל המלאי **לא** מנוכה — רק אחרי אישור תשלום דרך webhook.

---

### `order.model.ts` — מבנה ועיצוב

**מחזור חיים:**
```
pending_payment → confirmed → processing → shipped → delivered
                                                    ↘ cancelled
```

**`trackingHistory`:**
```ts
trackingHistory: [{ status, timestamp, message }]
```
כל מעבר סטטוס מוסיף רשומה — לקוח רואה את כל ההיסטוריה.

**`items` — snapshot:**
```ts
items: [{ product: ObjectId, name: "iPhone 15", price: 3999, quantity: 2, image }]
```
שם ומחיר נשמרים על ההזמנה — אם מוצר יימחק, ההזמנה ההיסטורית נשארת נכונה.
זה שונה מ-cart שהחזיק רק ObjectId ועשה populate.

---

### `order.service.ts` — לוגיקה עסקית חשובה

**מניעת N+1:**
```ts
// ❌ שאילתה לכל פריט בנפרד
for (const item of cart.items) { await ProductModel.findById(item.product); }

// ✅ שאילתה אחת לכל המוצרים
const products = await ProductModel.find({ _id: { $in: productIds } });
const productMap = new Map(products.map(p => [p._id.toString(), p]));
```

**המלאי לא מנוכה ביצירת הזמנה:**
```ts
// ⚠️ לא משנים את המלאי כאן - רק אחרי שתשלום אושר!
```
לקוח שנטש תשלום — לא חוסם מלאי לנצח.

**`cancelOrder` — לוגיקה עדינה:**
```ts
const paidStatuses = ["confirmed", "processing"];
if (paidStatuses.includes(order.status)) {
  // רק אם תשלום כבר אושר — מחזירים מלאי
  await ProductModel.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
}
// אם pending_payment — המלאי מעולם לא נוכה
```
`$inc` הוא **אוטומי** (atomic) — בטוח גם עם requests מקבילים.

**`generateOrderNumber` — אטומי עם sequence:**
```ts
const sequenceNumber = await getNextSequence(`order_${year}${month}${day}`);
return `ORD-20260428-001`;
```
counter אטומי ב-MongoDB — אין שתי הזמנות עם אותו מספר גם תחת עומס.

---

## חלק ח׳ — מודול Payments (פירוק מלא)

### למה Payments הוא המודול הכי מסובך
- שילוב עם Stripe — שירות חיצוני
- השרת לא רואה פרטי כרטיס אפילו לרגע
- webhook — Stripe קורא לשרת, לא הפוך
- 4 שכבות אבטחה על כל תשלום

---

### `payment.routes.ts` — דפוסים חדשים

```ts
router.post("/webhook", webhookRateLimiter, PaymentController.webhook); // ציבורי!

router.use(AuthMiddleware.requireAuth);

router.post("/create-intent",
  validateRequest({ body: createPaymentIntentSchema }),
  PaymentController.createIntent,
);
router.post("/checkout",
  validateRequest({ body: createPaymentIntentSchema }),
  PaymentController.createIntent,
);
router.get("/:orderId/status",
  validateRequest({ params: paymentStatusParamsSchema }),
  PaymentController.getStatus,
);
```

**`validateRequest({ body: schema })`** — middleware שמאמת עם Zod לפני controller.
שונה מ-`schema.parse()` בcontroller — validation קורה **לפני** שנכנסים לcontroller.

**`/checkout` הוא alias ל-`/create-intent`:** שני הנתיבים = אותו controller.

**למה `/webhook` ציבורי רק עם rate limiter?**
Stripe קורא לשרת — הוא לא מחובר ולא יוכל לשלוח JWT.
האימות נעשה דרך **חתימת webhook** (HMAC), לא JWT.

---

### זרימת תשלום מלאה

```
1. לקוח לוחץ "שלם"
2. POST /api/orders → יצירת הזמנה + PaymentService.createPaymentIntent
   ← מקבל checkoutUrl
3. לקוח מופנה לדף Stripe — מזין פרטי כרטיס
4. Stripe מעבד תשלום
5. Stripe → POST /api/payments/webhook
6. PaymentController.webhook → PaymentService.handleWebhook
   אימות חתימה + idempotency + אימות סכום + עדכון מלאי אטומי
7. סטטוס הזמנה מעודכן ל-confirmed
```

---

### 4 שכבות אבטחה ב-`handleWebhook`

**שכבה 1 — אימות חתימה (HMAC):**
```ts
stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
```
- Stripe חותם כל webhook עם HMAC-SHA256
- אם לא תואם — נדחה מיד
- **למה `express.raw()` ב-app.ts?**
  Stripe מחשב חתימה על bytes גולמיים. אם `express.json()` יפעל קודם — ה-body ישתנה והחתימה תשבר.

**שכבה 2 — Idempotency:**
```ts
const existingEvent = await WebhookEventModel.findOne({ eventId, provider });
if (existingEvent) throw new Error("already processed");
```
Stripe שולח אותו webhook מספר פעמים אם לא מקבל 200.
**למה MongoDB ולא Redis?** Redis נופל = נתונים אבודים. MongoDB שורד.

**שכבה 3 — אימות סכום:**
```ts
if (receivedAmountInCents !== expectedAmountInCents) {
  payment.status = "failed";
  throw new Error("Payment amount mismatch");
}
```
תרחיש: תוקף שפרץ חשבון Stripe שלח webhook עם $1 על הזמנה של $1000.
השרת ידחה — הסכום לא תואם.

**שכבה 4 — עדכון stock אטומי (MongoDB Transaction):**
```ts
await this.fulfillOrder(order, payment); // אטומי!
```
כל העדכונים קורים בבת אחת — אם stock כשל אחרי אישור תשלום, הכל מתבטל.

---

### Factory Pattern ב-PaymentService

```ts
const providerFactories: Record<string, () => PaymentProvider> = {
  stripe: () => new StripeProvider(),
  // paypal: () => new PayPalProvider(), // רק מוסיפים שורה
};
```
להוסיף PayPal — רק מוסיפים `PayPalProvider`. השאר לא משתנה.

---

### Retry mechanism לwebhook שנכשל

```ts
await FailedWebhookModel.create({
  eventId, payload: rawBody, retryCount: 0, maxRetries: 5,
  nextRetryAt: new Date(Date.now() + 5 * 60 * 1000),
});
```
שירות רקע ב-server.ts בודק ומנסה מחדש עם exponential backoff.

---

### סיכום מודול Payments

| דפוס | מה ללמוד |
|------|----------|
| webhook ציבורי בלי JWT | Stripe לא יכול להתחבר |
| `express.raw()` ל-webhook | חתימה מחשבת על bytes גולמיים |
| HMAC + timing-safe | מניעת זיוף webhook |
| Idempotency ב-MongoDB | עיבוד כפול ברצף webhook |
| אימות סכום | מניעת תשלום חלקי |
| MongoDB transaction ל-stock | עדכון אטומי |
| Factory Pattern | תמיכה במספר ספקים |
| Retry mechanism | webhook שנכשל נשמר לנסיון חוזר |

---

## חלק ט׳ — מודול Addresses (פירוק מלא)

### `address.routes.ts`

```ts
router.use(requireAuth);

router.get("/",                                 AddressController.getAddresses);
router.get("/default",                          AddressController.getDefaultAddress);
router.get("/:addressId",   validateAddressId,  AddressController.getAddressById);
router.post("/",                                AddressController.createAddress);
router.put("/:addressId",   validateAddressId,  AddressController.updateAddress);
router.delete("/:addressId",validateAddressId,  AddressController.deleteAddress);
router.post("/:addressId/set-default", validateAddressId, AddressController.setDefaultAddress);
```

**`validateAddressId` — middleware גנרי:**
```ts
export const validateAddressId = validateObjectId("addressId");

const validateObjectId = (paramName: string) => (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params[paramName])) {
    return sendError(res, 400, `Invalid ${paramName} format`);
  }
  next();
};
```
נכתב גנרי — אותה פונקציה מייצרת `validateAddressId` / `validateOrderId` / `validateProductId`.

---

### `address.validator.ts` — Zod + regex ישראלי

```ts
const israeliPhoneRegex = /^(\+972|0)([23489]|5[0-9])[0-9]{7}$/;

export const addressSchema = z.object({
  fullName: z.string().min(2).max(100),
  phone: z.string().regex(israeliPhoneRegex, "..."),
  street, city, postalCode, country,
  isDefault: z.boolean().optional(),
});

export const updateAddressSchema = addressSchema.partial();
```

**`addressSchema.partial()`** — יוצר schema חדש שבו **כל השדות אופציונליים**.
מאפשר PUT עם רק השדות שרוצים לשנות — בשורה אחת.

---

### `address.service.ts` — לוגיקה עסקית

**`getAddresses` — ברירת מחדל תמיד ראשונה:**
```ts
AddressModel.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 });
```

**`setDefaultAddress` — פעולה דו-שלבית:**
```ts
// שלב 1: בטל כל ברירות המחדל הקיימות
await AddressModel.updateMany({ user: userId, isDefault: true }, { $set: { isDefault: false } });
// שלב 2: הגדר את החדשה
await AddressModel.findOneAndUpdate({ _id: addressId, user: userId }, { $set: { isDefault: true } }, { new: true });
```
`{ _id: addressId, user: userId }` — מניעת גישה לכתובות של משתמשים אחרים!

**`createAddress` — ברירת מחדל אוטומטית:**
```ts
const existingAddresses = await AddressModel.countDocuments({ user: userId });
isDefault: existingAddresses === 0 ? true : data.isDefault || false
```
כתובת ראשונה → ברירת מחדל אוטומטית. חכם מבחינת UX.

**`deleteAddress`:**
```ts
const result = await AddressModel.deleteOne({ _id: addressId, user: userId });
if (result.deletedCount === 0) throw new NotFoundError("Address");
```
גם כאן `user: userId` — לא ניתן למחוק כתובת של אחר.

---

### סיכום מודול Addresses

| דפוס | מה ללמוד |
|------|----------|
| `validateObjectId` גנרי | middleware לשימוש חוזר |
| `addressSchema.partial()` | schema לעדכון חלקי בשורה אחת |
| `user: userId` בכל query | הגנה מפני גישה לנתונים של אחרים |
| ברירת מחדל אוטומטית | UX חכם לכתובת ראשונה |

---

## חלק י׳ — מודול Admin (פירוק מלא)

### `admin.routes.ts` — שכבת הגנה כפולה + audit

```ts
router.use(requireAdmin);    // auth + role === "admin"
router.use(apiRateLimiter);

// Products — כל write operation מחובר ל-audit
router.get("/products",        AdminController.listProducts);
router.post("/products",       autoLogAction("ADMIN_CREATE_PRODUCT", "product"), AdminController.createProduct);
router.put("/products/:id",    validateProductId, autoLogAction("ADMIN_UPDATE_PRODUCT", "product"), AdminController.updateProduct);
router.delete("/products/:id", validateProductId, autoLogAction("ADMIN_DELETE_PRODUCT", "product"), AdminController.deleteProduct);

// Users
router.put("/users/:id/role", validateObjectId("id"), autoLogAction("ADMIN_UPDATE_USER_ROLE", "user"), AdminController.updateUserRole);

// Orders
router.put("/orders/:id/status", validateObjectId("id"), autoLogAction("ADMIN_UPDATE_ORDER_STATUS", "order"), AdminController.updateOrderStatus);

// Stats
router.get("/stats/summary", AdminController.getStats);
```

כל write operation של admin — create/update/delete מוצר, שינוי role, עדכון סטטוס הזמנה — נרשם אוטומטית ל-audit log.

---

### `requireAdmin` middleware — עוטף `requireAuth`

```ts
static async requireAdmin(req, res, next) {
  await AuthMiddleware.requireAuth(req, res, () => {
    if (!req.user || req.user.role !== "admin") {
      return sendError(res, 403, "Access denied. Admin privileges required");
    }
    next();
  });
}
```

`requireAdmin` **עוטף** את `requireAuth` — לא כותב לוגיקה פעמיים.
JWT לא תקין → 401. JWT תקין אבל role !== admin → 403.

---

### `admin.service.ts` — דפוסים חשובים

**Soft delete — מחיקה רכה:**
```ts
static async deleteProduct(id: string) {
  await ProductModel.findByIdAndUpdate(id, { isActive: false });
}
```
מוצר עלול להיות מקושר להזמנות ישנות — מחיקה אמיתית תשבור היסטוריה.

**הגנה עצמית:**
```ts
if (actingUserId && targetUserId === actingUserId) {
  throw new Error("Admins cannot change their own role");
}
```
מונע "נעלתי את עצמי בחוץ".

**`getStatsSummary` — 6 שאילתות מקבילות:**
```ts
const [deliveredAgg, openOrders, ordersToday, lowStockProducts, usersCount, productsCount]
  = await Promise.all([...]);
```

Aggregation pipeline לסך מכירות:
```ts
OrderModel.aggregate([
  { $match: { status: "delivered" } },
  { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
])
```
- `$match` — מסנן הזמנות שסופקו
- `$group: { _id: null }` — מאחד הכל לתוצאה אחת
- `$sum: "$totalAmount"` — סוכם את כל הסכומים

---

### סיכום מודול Admin

| דפוס | מה ללמוד |
|------|----------|
| `requireAdmin` עוטף `requireAuth` | שכבת הגנה כפולה ללא כפילות |
| `autoLogAction` על write routes | audit trail אוטומטי |
| soft delete | שמירת היסטוריה |
| הגנה עצמית | מניעת נעילה עצמית |
| `Promise.all` ל-6 שאילתות | ביצועים — מקביל במקום סדרתי |
| `$group + $sum` aggregation | חישוב סך מכירות ב-MongoDB |

---

## חלק י״א — תשתית השרת: Middleware / Utils / Config

### `asyncHandler` — עוטף כל route async

```ts
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    next(error); // מעביר לerror middleware
  });
};
```

**הבעיה שהוא פותר:**
Express לא תופס שגיאות async שזורקות מחוץ ל-catch.
`asyncHandler` עוטף ומוודא שכל שגיאה מגיעה ל-`errorHandler`.

**מחלקות שגיאה:**
```ts
class ApiError extends Error { constructor(statusCode, message, errors, code) }
class ValidationError extends ApiError { /* 400 */ }
class NotFoundError extends ApiError  { /* 404 */ }
class UnauthorizedError extends ApiError { /* 401 */ }
class ForbiddenError extends ApiError   { /* 403 */ }
```

---

### `error.middleware.ts` — תפיסה מרכזית לכל שגיאה

```ts
export function errorHandler(err, req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ success: false, message: err.message, ... });
  }
  if (err.name === "ZodError") {
    return res.status(400).json({ success: false, message: "Validation failed", errors: err.errors });
  }
  const status = err.statusCode || err.status || 500;
  res.status(status).json({ success: false, message: err.message || "Internal Server Error", code: "INTERNAL_ERROR" });
}
```

- **4 signatures** ל-Express error middleware: `(err, req, res, next)` — לא 3!
- מטפל ב-`ApiError`, `ZodError`, ושגיאות לא-ידועות
- **תגובה אחידה** לכל השרת

---

### `rate-limiter.middleware.ts` — 4 limiters שונים

```ts
export const authRateLimiter;        // /auth — הגנה על brute force
export const webhookRateLimiter;     // /webhook — דילוג Stripe IPs בproduction
export const apiRateLimiter;         // /admin — הגנה כללית
export const publicReadRateLimiter;  // GET products/orders — קריאה ציבורית
```

**`keyGenerator` חכם:**
```ts
const getKeyForRateLimit = (req) => {
  if (req.user?.id) return `user:${req.user.id}`; // מחובר → לפי userId
  return req.ip || "unknown";                      // לא מחובר → לפי IP
};
```
משתמש מחובר — rate מחושב לפי userId, לא IP. לא ניתן לעקוף על ידי שינוי IP.

---

### `logging.middleware.ts` — requestId ו-HTTP logging

```ts
// requestIdMiddleware
const requestId = req.headers["x-request-id"] || randomUUID();
req.requestId = requestId;
res.setHeader("x-request-id", requestId);

// requestLoggerMiddleware
res.on("finish", () => {
  logger.info({ requestId, method, path, status, durationMs }, "HTTP Request");
});
```
לוגינג ב-`finish` event — לאחר שהתגובה נשלחה, כולל duration.

---

### `audit-logging.middleware.ts` — מעקב פעולות admin

```ts
// מוסיף לreq: ipAddress, userAgent, sessionId
export function auditLoggingMiddleware(req, res, next) { ... }

// פונקציה ידנית לרישום פעולה
export async function logAuditEvent(userId, action, resourceType, resourceId, status, req) { ... }

// middleware אוטומטי — עוטף res.json ורושם אחרי תגובה
export function autoLogAction(action, resourceType) { ... }
```

`autoLogAction` **עוטף את `res.json`**: מחכה לתגובה האמיתית, קובע success/failure לפי statusCode, ואז שומר ב-`AuditLogModel`.

---

### `response.ts` — פורמט תגובה אחיד

```ts
export function sendSuccess(res, data, message, status = 200) {
  res.status(status).json({ success: true, data, message });
}
export function sendError(res, status, message, errors) {
  res.status(status).json({ success: false, message, errors });
}
```
כל תגובה בשרת נראית אותו דבר — `{ success, data?, message?, errors? }`.

---

### `config/env.ts` — Fail Fast

```ts
function validateEnv() {
  if (paymentProvider === "stripe" && !process.env.STRIPE_SECRET_KEY) {
    throw new Error("❌ STRIPE_SECRET_KEY is required");
  }
  if (isProd && !process.env.JWT_SECRET) {
    throw new Error("❌ JWT_SECRET is required in production");
  }
}
validateEnv(); // רץ ברגע הimport
```
אם משתנה חסר — השרת לא מתחיל בכלל.
בdev: מזהיר; בproduction: קורס.

---

### `config/cors.ts` — Whitelist origins

```ts
cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error(`CORS error: Origin ${origin} not allowed`));
  },
  credentials: true,
  maxAge: 86400, // browser caches preflight 24 שעות
});
```
- `!origin` = curl / mobile app — מותר
- `credentials: true` = מאפשר cookies + Authorization header
- `maxAge: 86400` = browser לא שולח preflight OPTIONS על כל בקשה

---

### סיכום תשתית השרת

| קובץ | תפקיד |
|------|--------|
| `asyncHandler` | עוטף async routes, מעביר שגיאות ל-next() |
| `error.middleware` | נקודה אחת לטיפול בכל שגיאה |
| `rate-limiter` | הגנה שונה לendpoints שונים, keyGenerator חכם |
| `logging.middleware` | requestId + HTTP timing לכל בקשה |
| `audit-logging` | מעקב פעולות רגיש (מי, מה, מתי, מאיפה) |
| `response.ts` | פורמט תגובה אחיד לכל השרת |
| `env.ts` | fail fast — validation ב-startup |
| `cors.ts` | whitelist origins, credentials, preflight caching |

---

## חלק י״ב — קבצים תומכים

### `validate.middleware.ts` — `validateRequest` מפורט

```ts
export function validateRequest(options: ValidateOptions) {
  return async (req, res, next) => {
    const errors: Record<string, string> = {};

    if (options.body) {
      try {
        req.body = options.body.parse(req.body);
      } catch (error) {
        if (error instanceof ZodError) {
          error.errors.forEach(err => errors[err.path.join(".")] = err.message);
        }
      }
    }
    if (options.params) { /* אותו דבר */ }
    if (options.query)  { /* אותו דבר */ }

    if (Object.keys(errors).length > 0) {
      return sendError(res, 400, "Validation failed", errors);
    }
    next();
  };
}
```

| | `validateRequest` middleware | `schema.parse()` בcontroller |
|---|---|---|
| מתי רץ | לפני controller | בתוך controller |
| שגיאה | מחזיר 400 מיד | controller צריך לטפל |
| שימוש | payments | auth, orders, addresses |

שתי הגישות תקינות — עניין של סגנון.

---

### `types/express.ts` — Declaration Merging

```ts
declare module "express-serve-static-core" {
  interface Request {
    user?: AuthenticatedUser;    // נוסף על ידי requireAuth
    userId?: string;             // נוסף על ידי requireAuth
    requestId?: string;          // נוסף על ידי requestIdMiddleware
    ipAddress?: string;          // נוסף על ידי auditLoggingMiddleware
    userAgent?: string;          // נוסף על ידי auditLoggingMiddleware
  }
}
```

**מה זה declaration merging?**
TypeScript מאפשר להוסיף שדות לinterface קיים.
בלי זה: `(req as any).user` בכל מקום — מגעיל ולא בטוח.
עם זה: `req.user` עם type מלא בכל הפרויקט.

---

### `config/db.ts` — URI Masking

```ts
function maskUri(uri: string): string {
  return uri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");
  // mongodb://user:password@host → mongodb://***:***@host
}
```
username + password לא יופיעו בלוגים.

---

### `config/redisClient.ts` — `lazyConnect`

```ts
export const redis = new Redis(env.REDIS_URL, { lazyConnect: true });
```
**`lazyConnect: true`** — Redis **לא מתחבר** ברגע ה-import.
בלי זה: כל test שמייבא קוד שנוגע ב-Redis יפתח socket — יאט tests ויגרום לשגיאות.
החיבור קורה רק כשקוראים `connectRedis()` ב-`server.ts`.

---

### `services/payments/stripe.provider.ts` — Provider Interface + Timing-Safe

```ts
interface PaymentProvider {
  name: string;
  createPaymentIntent(params): Promise<CreateIntentResult>;
  handleWebhook(req): Promise<PaymentResult>;
}

class StripeProvider implements PaymentProvider {
  async handleWebhook(req: Request) {
    const rawBody = req.body as Buffer;
    const sig = req.headers["stripe-signature"];
    const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    return parseEvent(event);
  }
}
```

**למה `timing-safe` חשוב?**
תגובה רגילה: `if (a === b)` — מחשב מהיר על match, איטי על mismatch.
תוקף יכול למדוד זמן תגובה ולנחש את הסוד bit by bit.
`timing-safe`: תמיד לוקח אותו זמן — אי אפשר למדוד הפרש.

---

### `services/webhook-retry.service.ts` — Exponential Backoff

```ts
webhook.nextRetryAt = new Date(Date.now() + 2 ** webhook.retryCount * 1000);
```

- נסיון 1: עוד 2 שניות
- נסיון 2: עוד 4 שניות
- נסיון 3: עוד 8 שניות
- **למה?** אם DB עמוס — retry מיידי מחמיר. עדיף לתת לו להתאושש.

---

### `validators/order.validator.ts` — `z.enum` ו-`default`

```ts
export const PaymentMethodEnum = z.enum(["stripe"]);

export const createOrderSchema = z.object({
  shippingAddress: shippingAddressSchema,
  billingAddress: shippingAddressSchema.optional(),
  paymentMethod: PaymentMethodEnum.default("stripe"),
  notes: z.string().optional(),
});
```

- **`z.enum(["stripe"])`** — whitelist: רק ערכים מפורשים מותרים
- **`.default("stripe")`** — אם לא נשלח `paymentMethod` → Zod ממלא אוטומטית

---

## חלק י״ג — Tests: אסטרטגיית בדיקות

### סוגי הבדיקות בפרויקט

| קובץ | סוג | מה בודק |
|------|-----|---------|
| `auth.test.ts` | Unit/Integration | רישום, התחברות, refresh tokens, Google OAuth |
| `products.test.ts` | Integration | GET products, 404 על ID לא קיים |
| `order.test.ts` | Integration | יצירת הזמנה, עדכון סטטוס |
| `payment-webhook.test.ts` | Security | חתימת webhook, idempotency, אימות סכום |
| `integration.test.ts` | E2E | זרימה מלאה: register → cart → checkout → webhook |
| `performance.test.ts` | Load | 100 משתמשים במקביל, <2s response time |
| `health.test.ts` | Smoke | שרת עלה ומגיב |

---

### `test-setup.ts` — הבסיס של כל הבדיקות

```ts
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({ binary: { version: '4.4.10' } });
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await mongoServer.stop();
});

jest.mock("../config/redisClient", () => ({
  redis: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue("OK"),
  },
}));
```

**למה MongoMemoryServer?**
- MongoDB שלם בזיכרון — ללא חיבור אמיתי
- כל test run מתחיל עם DB נקי
- מהיר, לא תלוי בסביבה חיצונית

**למה Mock Redis?**
- Mock מחזיר `null` (cache miss) → הקוד נופל ל-MongoDB → הכל עובד
- בלי mock: test שמייבא Redis ייכשל על חיבור

---

### `auth.test.ts` — דפוס Test Suite מלא

```ts
describe("Auth Routes", () => {
  afterEach(async () => {
    await UserModel.deleteMany({});
  });

  describe("POST /api/auth/register", () => {
    it("should register user with valid credentials", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({ name, email, password, confirmPassword });
      expect(response.status).toBe(201);
      expect(response.body.data.token).toBeDefined();
    });

    it("should reject duplicate email", async () => {
      await request(app).post("/api/auth/register").send({ ...user });
      const response = await request(app).post("/api/auth/register").send({ ...user });
      expect(response.status).toBe(409);
      expect(response.body.code).toBe("CONFLICT");
    });
  });
});
```

- `supertest` — שולח HTTP requests ישירות ל-Express app בלי לפתוח port
- `afterEach` — ניקוי DB בין בדיקות, אין state משותף
- 3 רמות `describe`: Suite → Endpoint → Test case

---

### `payment-webhook.test.ts` — mock מורכב

```ts
jest.mock("stripe");
const MockStripe = Stripe as jest.MockedClass<typeof Stripe>;

MockStripe.mockImplementation(() => ({
  webhooks: {
    constructEvent: jest.fn().mockReturnValue(fakeEvent),
  },
}));
```

**למה mock Stripe?**
Stripe חתימה אמיתית דורשת מפתח סודי ותזמון מדויק.
ב-test אנחנו שולטים בתוצאה — בודקים **את הלוגיקה שלנו**, לא את Stripe עצמו.

**מה הtest בודק:**
- webhook עם חתימה לא תקינה → 400
- webhook שכבר עובד (idempotency) → 200 בלי עיבוד כפול
- webhook עם סכום שגוי → payment.status = "failed"

---

### `integration.test.ts` — E2E מלא

```ts
it("should complete full checkout flow", async () => {
  // 1. Register → token
  // 2. Add to cart
  // 3. Create order
  // 4. Simulate webhook → stock reduced, order confirmed
});
```
בדיקה אחת מכסה **8 שלבים** — אם משהו משתנה בזרימה, הtest נכשל מיד.

---

### `performance.test.ts` — 100 משתמשים מקביל

```ts
const requests = Array.from({ length: 100 }, (_, i) =>
  request(app).post("/api/cart/items")
    .set("Authorization", `Bearer ${authToken}`)
    .send({ productId, quantity: 1 })
);
const results = await Promise.all(requests);
expect(successRate).toBeGreaterThan(0.95);
```
בודק שה-VersionError retry ב-CartService עובד תחת עומס ואין race condition במלאי.

---

### `jest.config.js`

```js
module.exports = {
  testMatch: ["**/dist/__tests__/**/*.js"], // רץ על JS מקומפל!
  testEnvironment: "node",
  testTimeout: 30000,
  maxWorkers: 1, // בדיקות ברצף — MongoDB shared state
  forceExit: true,
};
```

- **`testMatch: dist/`** — TypeScript מקומפל קודם ל-JS → אחר כך Jest
- **`maxWorkers: 1`** — בדיקות אחת-אחת, לא מקביל — כי כולן חולקות MongoMemoryServer
- **timeout 30s** — MongoMemoryServer צריך זמן לעלות

---

### סיכום — מה כל סוג test בודק

| מה לבדוק | סוג test |
|----------|---------|
| פונקציה בודדת (validator) | Unit test |
| Controller + Service + DB | Integration test |
| Register → checkout → webhook | E2E test |
| 100 משתמשים מקביל | Performance test |
| חתימת webhook, סכום | Security test |

---

## מצב התקדמות

כל הנושאים הבאים הושלמו:

- [x] הבנת `server.ts` ו-`app.ts`
- [x] מיפוי ה-routes המרכזיים
- [x] הבנת middleware chain גלובלי
- [x] Auth flow מלא — route, controller, validator, service, user.model
- [x] Products flow מלא — routes, controller, service, model
- [x] Cart flow מלא — caching, concurrency, pre-save hook
- [x] Orders flow מלא — idempotency, state machine, tracking history
- [x] Payments flow מלא — 4 שכבות אבטחה, webhook, factory pattern
- [x] Addresses flow מלא — CRUD, soft defaults, authorization per query
- [x] Admin flow מלא — double auth, soft delete, aggregation, audit
- [x] Infrastructure — asyncHandler, error middleware, rate limiters, logging, audit, response
- [x] Supporting files — validateRequest, types/express, db, redis, stripe.provider, webhook-retry
- [x] Tests — MongoMemoryServer, mock Redis, E2E, performance, webhook security
- [x] 43/43 בדיקות עוברות (`npm run build && npm run test`)
