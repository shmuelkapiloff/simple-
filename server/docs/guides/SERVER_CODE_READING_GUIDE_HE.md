# Server Code Reading Guide

מדריך עזר מהיר להבנת קוד צד השרת בפרויקט.

**מטרה:**
- לזהות מהר איזה סוג קובץ אתה קורא
- להבין מה כל פונקציה עושה בלי ללכת לאיבוד בתחביר
- לזכור את הניואנסים של TypeScript, Express ו-Mongoose
- לקבל שיטת עבודה קבועה כשפותחים קובץ חדש

---

## 1. איך לחשוב על שרת ב-10 שניות

בפרויקט הזה כמעט כל בקשה נראית כך:

```text
Client Request
-> app.ts
-> route
-> middleware
-> controller
-> service
-> model / external service
-> response
```

אם אתה לא בטוח מה אתה קורא, תשאל מיד:

1. האם הקובץ מקבל `req` ו-`res`?
2. האם הוא רק מחווט URL לפונקציה?
3. האם הוא בודק הרשאות או אימות?
4. האם הוא נוגע ב-DB או ב-Stripe או ב-Redis?
5. האם הוא מגדיר צורת נתונים?

התשובות לשאלות האלה כמעט תמיד יגלו את סוג הקובץ.

---

## 2. איך לזהות איזה סוג קובץ פתחת

### Route

אם אתה רואה שורות כמו:

```ts
router.post("/login", authRateLimiter, AuthController.login);
```

זה אומר:
- `router.post` = HTTP POST
- `"/login"` = הנתיב
- `authRateLimiter` = middleware שרץ לפני ה-controller
- `AuthController.login` = הפונקציה שמטפלת בבקשה

**מה Route עושה:**
הוא לא מחזיק לוגיקה עסקית אמיתית. הוא רק מחבר בין כתובת, middleware ו-controller.

### Controller

אם אתה רואה:

```ts
static login = asyncHandler(async (req: Request, res: Response) => {
  const validated = loginSchema.parse(req.body);
  const result = await AuthService.login(validated);
  res.status(200).json({ success: true, data: result });
});
```

זה אומר:
- `static login` = מתודה של המחלקה, לא צריך ליצור אובייקט כדי לקרוא לה
- `asyncHandler(...)` = עוטף את הפונקציה כדי להעביר שגיאות ל-error middleware
- `req.body` = הנתונים שהלקוח שלח
- `loginSchema.parse(...)` = validation
- `AuthService.login(...)` = הלוגיקה העסקית האמיתית
- `res.status(...).json(...)` = תשובת HTTP ללקוח

**מה Controller עושה:**
מנהל את ה-HTTP. הוא קורא קלט, עושה validation, מפעיל service ומחזיר response.

### Service

אם אתה רואה:

```ts
static async login(credentials: LoginInput) {
  const user = await UserModel.findOne({
    email: credentials.email.toLowerCase(),
    isActive: true,
  }).select("+password +failedLoginAttempts +lockedUntil");
}
```

זה אומר:
- `static async` = פונקציה אסינכרונית של מחלקה
- `credentials: LoginInput` = טיפוס של הפרמטר
- `await` = מחכים לפעולה אסינכרונית
- `UserModel.findOne(...)` = שאילתת MongoDB דרך Mongoose
- `.select(...)` = מבקשים במפורש שדות שלא חוזרים כברירת מחדל

**מה Service עושה:**
הלוגיקה העסקית. כאן בודקים חוקים, מאחדים נתונים, מדברים עם DB ועם שירותים חיצוניים.

### Model

אם אתה רואה:

```ts
const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
  },
});
```

זה אומר:
- `Schema<IUser>` = schema עם טיפוס TypeScript
- `email` = שדה במסמך
- `type: String` = סוג הנתון ב-MongoDB
- `required: true` = חובה
- `unique: true` = ערך ייחודי

**מה Model עושה:**
מגדיר איך הנתונים נראים, אילו חוקים חלים עליהם, ואילו hooks/methods קיימים.

### Middleware

אם אתה רואה:

```ts
static async requireAuth(req: Request, res: Response, next: NextFunction) {
```

זה אומר:
- `next` = פונקציה שמעבירה את הבקשה לשלב הבא
- אם קוראים ל-`next()` הבקשה ממשיכה
- אם מחזירים `res.status(...).json(...)` הבקשה נעצרת כאן

**מה Middleware עושה:**
רץ לפני ה-controller. בדרך כלל מאמת auth, rate limit, IDs, logging, metrics או validation.

### Validator

אם אתה רואה:

```ts
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
```

זה אומר:
- `z.object(...)` = אובייקט שחייב להתאים למבנה הזה
- `z.string()` = חייב string
- `.email()` = חייב להיות email תקין
- `.min(1)` = לפחות תו אחד

**מה Validator עושה:**
בודק קלט. הוא לא עושה DB, לא מחזיר response לבד, ולא מפעיל business logic.

### Config / Utils

אם אתה רואה קובץ בלי `req` ובלי `router`, אבל עם קבועים, logger, env או helper functions,
כנראה זה קובץ תשתית.

---

## 3. מילון תחביר קצר שלא מבלבל

### `import`

```ts
import { Router } from "express";
import jwt from "jsonwebtoken";
```

- עם `{}` = named export
- בלי `{}` = default export

### `export`

```ts
export class AuthController {}
export const authRateLimiter = ...
export default router;
```

- `export` = אפשר לייבא בשם שלו
- `export default` = מייצא דבר ראשי אחד מהקובץ

### פונקציית חץ

```ts
const fn = () => {}
```

זאת פשוט פונקציה. בפרויקט הזה משתמשים בזה הרבה ל-callbacks ולפונקציות קצרות.

### `async` / `await`

```ts
const user = await UserModel.findById(userId);
```

- `async` = הפונקציה מחזירה Promise
- `await` = חכה עד שהתוצאה תחזור

### Type Annotation

```ts
req: Request
res: Response
next: NextFunction
userId: string
```

החלק שאחרי `:` הוא לא ערך, אלא טיפוס.

### Union Type

```ts
role: "user" | "admin"
```

המשמעות: הערך יכול להיות רק אחד משני המחרוזות האלה.

### Optional Field

```ts
password?: string
```

הסימן `?` אומר שהשדה יכול לא להיות קיים.

### Generic

```ts
new Schema<IUser>(...)
Promise<boolean>
Partial<CreateUserInput>
```

מה שבתוך `<>` עוזר ל-TypeScript להבין איזה טיפוס חוזר או מתקבל.

### Destructuring

```ts
const { idToken } = req.body;
```

זה קיצור של "קח את `idToken` מתוך האובייקט `req.body`".

### Spread Operator

```ts
const user = {
  ...data,
  email: data.email?.toLowerCase(),
};
```

`...data` מעתיק את כל השדות של `data` לתוך אובייקט חדש.

### Optional Chaining

```ts
req.cookies?.token
data.email?.toLowerCase()
```

אם מה שלפני `?.` הוא `null` או `undefined`, לא תיזרק שגיאה.

### Nullish Coalescing

```ts
const price = item.lockedPrice ?? product?.price ?? 0;
```

`??` אומר: אם הערך משמאל הוא `null` או `undefined`, עבור לימין.

### Logical OR

```ts
const requestId = incomingId || randomUUID();
```

`||` אומר: אם השמאלי הוא falsy, עבור לימני.

### Method Chaining

```ts
UserModel.findOne({ email }).select("+password").lean()
```

כל נקודה ממשיכה פעולה על התוצאה הקודמת.

---

## 4. איך לקרוא שורת קוד בלי פאניקה

### דוגמה 1

```ts
router.get("/profile", authenticate, AuthController.getProfile);
```

פירוק:
- `router.get` = route של GET
- `"/profile"` = הנתיב
- `authenticate` = בודק שהמשתמש מחובר
- `AuthController.getProfile` = אם האימות עבר, הולכים לפונקציה הזאת

### דוגמה 2

```ts
const validated = registerSchema.parse(req.body);
```

פירוק:
- `req.body` = הנתונים מהלקוח
- `registerSchema` = חוקי validation
- `parse` = בודק שהנתונים מתאימים; אם לא, זורק שגיאה

### דוגמה 3

```ts
const user = await UserModel.findOne({
  email: credentials.email.toLowerCase(),
  isActive: true,
}).select("+password +failedLoginAttempts +lockedUntil");
```

פירוק:
- מחפשים משתמש אחד
- לפי `email` אחרי המרה ל-lowercase
- רק אם `isActive: true`
- מחזירים גם שדות שמוסתרים בדרך כלל

### דוגמה 4

```ts
if (!token) {
  return sendError(res, 401, "Access denied. No token provided");
}
```

פירוק:
- `!token` = אין token
- `return` = עצור כאן
- `sendError(...)` = החזר תגובת שגיאה ללקוח

---

## 5. מפת המשמעות של פונקציות נפוצות בפרויקט

| מה רואים | מה זה בדרך כלל אומר |
|----------|----------------------|
| `router.get/post/put/delete(...)` | הגדרת endpoint |
| `router.use(...)` | middleware על כל ה-router |
| `asyncHandler(...)` | תפיסת שגיאות async |
| `schema.parse(...)` | validation עם Zod |
| `sendSuccess(...)` | response אחיד של הצלחה |
| `sendError(...)` | response אחיד של שגיאה |
| `UserModel.findOne(...)` | קריאת מסמך אחד מה-DB |
| `findByIdAndUpdate(...)` | עדכון לפי `_id` |
| `populate(...)` | המרת ObjectId למסמך מלא |
| `lean()` | החזר plain object, לא Mongoose document |
| `next()` | המשך לשלב הבא בשרשרת |
| `throw new ApiError(...)` | זריקת שגיאה מבוקרת |
| `res.status(...).json(...)` | שליחת תשובת HTTP |

---

## 6. איך להבין כל קובץ בשרת בתוך דקה

### אם זה Route

שאל:
1. מה הנתיב?
2. איזה middleware רץ לפני ה-controller?
3. איזו פונקציית controller מופעלת?

### אם זה Controller

שאל:
1. מאיפה הוא קורא נתונים: `req.body`, `req.params`, `req.query`, `req.userId`?
2. האם יש validation?
3. לאיזה service הוא קורא?
4. איזה response הוא מחזיר?

### אם זה Service

שאל:
1. אילו חוקים עסקיים יש כאן?
2. איזה model או provider מופעל?
3. האם יש checks של הרשאה, מלאי, token או status?
4. מה מוחזר ל-controller?

### אם זה Model

שאל:
1. אילו שדות קיימים?
2. אילו שדות חובה?
3. אילו indexes יש?
4. אילו hooks או methods יש?

### אם זה Middleware

שאל:
1. באיזה תנאי הוא ממשיך עם `next()`?
2. באיזה תנאי הוא מחזיר שגיאה ועוצר?
3. האם הוא משנה את `req` או `res`?

---

## 7. ניואנסים חשובים בפרויקט הזה

### `authenticate` ו-`requireAuth`

בפרויקט הזה:

```ts
export const requireAuth = AuthMiddleware.requireAuth;
export const authenticate = AuthMiddleware.requireAuth;
```

כלומר אלה בפועל אותו middleware בדיוק, רק שני שמות.

### `select: false`

ב-`user.model.ts`:

```ts
password: {
  type: String,
  select: false,
}
```

כלומר סיסמה לא תחזור משאילתות רגילות. אם רוצים אותה, צריך לבקש במפורש:

```ts
.select("+password")
```

### `static`

כשאתה רואה:

```ts
export class AuthService {
  static async login(...) { ... }
}
```

זה אומר שקוראים לה כך:

```ts
AuthService.login(...)
```

ולא צריך `new AuthService()`.

### `req.userId`

זה לא שדה מקורי של Express. ה-middleware של auth מוסיף אותו אחרי אימות token.

### `parse()` של Zod

`parse()` לא מחזיר `true` או `false`.
אם הנתונים טובים, הוא מחזיר את הנתון המאומת.
אם לא, הוא זורק שגיאה.

### `return` בתוך middleware או controller

כשיש:

```ts
return res.status(400).json(...)
```

המטרה היא לא רק לשלוח תשובה, אלא גם לעצור את המשך הריצה של הפונקציה.

---

## 8. איך לזכור מאיפה מגיע כל נתון

| מקור | איפה רואים אותו |
|------|------------------|
| `req.body` | נתונים שנשלחו בגוף הבקשה |
| `req.params` | ערכים מתוך ה-URL, כמו `:id` |
| `req.query` | query string כמו `?page=2` |
| `req.headers` | headers כמו Authorization |
| `req.userId` | נוסף על ידי auth middleware |
| `res` | האובייקט שדרכו מחזירים תשובה |
| `next` | ממשיך ל-middleware הבא |

---

## 9. סדר קריאה מומלץ כשאתה תקוע

אם endpoint לא ברור לך, קרא בדיוק בסדר הזה:

1. route
2. middleware שרשומים עליו
3. controller method
4. validator אם יש
5. service method
6. model relevant

דוגמה:

```text
src/routes/auth.routes.ts
-> AuthController.login
-> loginSchema
-> AuthService.login
-> UserModel
```

זה כמעט תמיד המסלול הכי קצר להבנה.

---

## 10. שאלות קבועות שכדאי לשאול על כל קטע קוד

כשאתה רואה פונקציה חדשה, שאל:

1. מי קורא לה?
2. איזה קלט היא מקבלת?
3. מה היא מחזירה?
4. האם היא רק מחווטת או שהיא מחזיקה לוגיקה?
5. האם היא יכולה לזרוק שגיאה?
6. האם היא משנה DB או רק קוראת?
7. האם יש כאן אבטחה או validation שחשוב לא לפספס?

אם ענית על 7 השאלות האלה, בדרך כלל הבנת את הפונקציה מספיק טוב.

---

## 11. איפה להתחיל כשאתה רוצה להבין את כל השרת

סדר טוב לקריאה:

1. `src/server.ts`
2. `src/app.ts`
3. `src/routes/auth.routes.ts`
4. `src/controllers/auth.controller.ts`
5. `src/validators/auth.validator.ts`
6. `src/services/auth.service.ts`
7. `src/models/user.model.ts`
8. שאר המודולים לפי אותו דפוס

---

## 12. משפט סיכום לזכור תמיד

אם קובץ מבלבל אותך, אל תנסה להבין הכל בבת אחת.

תזהה קודם:
- האם זה route, controller, service, model או middleware
- מה נכנס אליו
- מה יוצא ממנו
- מי קורא למי

ברגע שהשרשרת ברורה, רוב התחביר מפסיק לבלבל.