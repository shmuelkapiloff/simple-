# 🎯 Server Endpoints - מדריך חזותי מלא

> **📖 מדריך זה מציג את כל ה-endpoints של השרת עם דיאגרמות חזותיות מפורטות**  
> כל endpoint כולל: זרימת נתונים, תנאים, שגיאות, ודוגמאות Request/Response

## 🚀 קישורים מהירים

- **התחל כאן:** [Health Check](#️-health-endpoints) - בדיקה שהשרת עובד
- **Authentication:** [Auth Endpoints](#-authentication-endpoints) - הרשמה והתחברות
- **קניות:** [Cart System](#-cart-endpoints) - עגלת קניות
- **מוצרים:** [Products](#-product-endpoints) - קטלוג
- **הזמנות:** [Orders](#-order-endpoints) - ניהול הזמנות
- **Best Practices:** [למטה ↓](#-best-practices) - המלצות ודוגמאות

## 💡 איך להשתמש במדריך?

### לפי תפקיד:

**👨‍💻 Frontend Developer:**
1. ראה את ה-Request/Response examples
2. שים לב ל-Error tables (מה לטפל בצד לקוח)
3. בדוק Authentication requirements

**🔧 Backend Developer:**
1. עקוב אחרי הדיאגרמות - שלב אחרי שלב
2. שים לב ל-Side Effects (stock, cart, emails)
3. הבן את ההבדל בין MongoDB ו-Redis

**🧪 QA/Tester:**
1. השתמש ב-Error tables לבדיקות
2. תכנן test cases לפי הזרימות
3. בדוק את כל התנאים בדיאגרמות

**📚 מתכנת מתחיל:**
1. התחל ב-[Common Workflows](#-common-workflows)
2. קרא את הדיאגרמות משמאל לימין
3. עקוב אחרי הצבעים (כחול→ירוק=הצלחה)

---

## 🎨 מקרא צבעים מהיר

| צבע | משמעות | דוגמה |
|-----|--------|-------|
| 🔵 **כחול** | נקודת כניסה - Request | `POST /api/auth/login` |
| 🟢 **ירוק** | הצלחה - Response 200/201 | `✅ 200: Success` |
| 🔴 **אדום** | שגיאה - Errors 400/401/404/409 | `❌ 401: Unauthorized` |
| 🟡 **צהוב** | MongoDB - מסד נתונים ראשי | `Find user in MongoDB` |
| 🟠 **כתום** | Redis - Cache מהיר | `Get cart from Redis` |

---

## 🔐 Authentication Endpoints

> **מטרה:** ניהול משתמשים - הרשמה, התחברות, ניהול פרופיל  
> **Authentication:** JWT Token ב-httpOnly cookie  
> **Rate Limiting:** מוגבל ל-5 ניסיונות לדקה

---

### POST /api/auth/register

**📝 תיאור:** יצירת משתמש חדש במערכת

**🔒 Security:** Password מוצפן ב-bcrypt, Token נשמר ב-httpOnly cookie

```mermaid
flowchart TD
    Request([POST /api/auth/register]) --> Middleware1[Parse JSON body]
    Middleware1 --> RateLimit{Rate limit check}
    RateLimit -->|Exceeded| Return429[❌ 429 Too Many Requests]
    RateLimit -->|OK| RouteHandler[authRoutes.post /register]
    
    RouteHandler --> Controller[AuthController.register]
    
    Controller --> ValidateInput{Validate input}
    ValidateInput -->|Missing fields| Return400["❌ 400: Name, email, password required"]
    ValidateInput -->|Invalid email| Return400Email["❌ 400: Invalid email format"]
    ValidateInput -->|Weak password| Return400Pass["❌ 400: Password must be 6+ chars"]
    ValidateInput -->|Valid| CallService[Call AuthService.register]
    
    CallService --> CheckExists{Check if user exists}
    CheckExists -->|Email exists| Return409["❌ 409: Email already registered"]
    CheckExists -->|New user| HashPassword[Hash password with bcrypt]
    
    HashPassword --> CreateUser[Create new User document]
    CreateUser --> SaveMongo[(Save to MongoDB users collection)]
    SaveMongo --> GenerateJWT[Generate JWT token]
    
    GenerateJWT --> SetCookie[Set httpOnly cookie]
    SetCookie --> PrepareResponse[Prepare response object]
    PrepareResponse --> Return201["✅ 201: User created + token + user data"]
    
    style Request fill:#e3f2fd
    style Return201 fill:#c8e6c9
    style Return429 fill:#ffcdd2
    style Return400 fill:#ffcdd2
    style Return400Email fill:#ffcdd2
    style Return400Pass fill:#ffcdd2
    style Return409 fill:#ffcdd2
    style SaveMongo fill:#fff9c4
```

📥 **Request Example:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass123"
}
```

✅ **Success Response (201):**

```json
{
  "status": "success",
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

❌ **Possible Errors:**

| Status | Message | Cause |
|--------|---------|-------|
| 400 | Name, email, password required | חסרים שדות חובה |
| 400 | Invalid email format | פורמט email לא תקין |
| 400 | Password must be 6+ chars | סיסמה קצרה מדי |
| 409 | Email already registered | Email כבר קיים במערכת |
| 429 | Too Many Requests | יותר מדי ניסיונות |

---

### POST /api/auth/login

**📝 תיאור:** התחברות למערכת עם email וסיסמה

**🔒 Security:** bcrypt password comparison, JWT token generation

```mermaid
flowchart TD
    Request([POST /api/auth/login]) --> Middleware1[Parse JSON body]
    Middleware1 --> RateLimit{Rate limit check}
    RateLimit -->|Exceeded| Return429[❌ 429 Too Many Requests]
    RateLimit -->|OK| RouteHandler[authRoutes.post /login]
    
    RouteHandler --> Controller[AuthController.login]
    
    Controller --> ValidateInput{Validate input}
    ValidateInput -->|Missing fields| Return400["❌ 400: Email and password required"]
    ValidateInput -->|Invalid email| Return400Email["❌ 400: Invalid email format"]
    ValidateInput -->|Valid| CallService[Call AuthService.login]
    
    CallService --> FindUser[(Find user by email in MongoDB)]
    FindUser --> UserExists{User found?}
    UserExists -->|No| Return401User["❌ 401: Invalid credentials"]
    UserExists -->|Yes| CheckActive{User is active?}
    
    CheckActive -->|No| Return403["❌ 403: Account deactivated"]
    CheckActive -->|Yes| ComparePassword[Compare password with bcrypt]
    
    ComparePassword --> PasswordMatch{Password matches?}
    PasswordMatch -->|No| Return401Pass["❌ 401: Invalid credentials"]
    PasswordMatch -->|Yes| GenerateJWT[Generate JWT token]
    
    GenerateJWT --> SetCookie[Set httpOnly cookie]
    SetCookie --> PrepareResponse[Prepare response object]
    PrepareResponse --> Return200["✅ 200: Login successful + token + user data"]
    
    style Request fill:#e3f2fd
    style Return200 fill:#c8e6c9
    style Return429 fill:#ffcdd2
    style Return400 fill:#ffcdd2
    style Return400Email fill:#ffcdd2
    style Return401User fill:#ffcdd2
    style Return401Pass fill:#ffcdd2
    style Return403 fill:#ffcdd2
    style FindUser fill:#fff9c4
```

📥 **Request Example:**

```json
{
  "email": "john@example.com",
  "password": "securepass123"
}
```

✅ **Success Response (200):**

```json
{
  "status": "success",
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

❌ **Possible Errors:**

| Status | Message | Cause |
|--------|---------|-------|
| 400 | Email and password required | חסרים שדות חובה |
| 400 | Invalid email format | פורמט email לא תקין |
| 401 | Invalid credentials | Email או סיסמה שגויים |
| 403 | Account deactivated | החשבון מושבת |
| 429 | Too Many Requests | יותר מדי ניסיונות התחברות |

---

### POST /api/auth/logout

**📝 תיאור:** התנתקות מהמערכת - מחיקת session cookie

**🔒 Security:** מחיקת httpOnly cookie מהדפדפן

```mermaid
flowchart TD
    Request([POST /api/auth/logout]) --> Middleware1[Parse JSON body]
    Middleware1 --> OptionalAuth[optionalAuth middleware]
    OptionalAuth --> RouteHandler[authRoutes.post /logout]
    
    RouteHandler --> Controller[AuthController.logout]
    Controller --> ClearCookie[Clear httpOnly cookie]
    ClearCookie --> Return200["✅ 200: Logged out successfully"]
    
    style Request fill:#e3f2fd
    style Return200 fill:#c8e6c9
```

✅ **Success Response (200):**

```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

💡 **Note:** ה-logout עובד גם עבור משתמשים לא מחוברים (optionalAuth)

---

### GET /api/auth/verify

**📝 תיאור:** בדיקת תקינות Token - מוודא שהמשתמש מחובר

**🔒 Security:** מחייב JWT token תקף

```mermaid
flowchart TD
    Request([GET /api/auth/verify]) --> RequireAuth[requireAuth middleware]
    
    RequireAuth --> CheckToken{Has valid token?}
    CheckToken -->|No| Return401["❌ 401: No token provided"]
    CheckToken -->|Yes| VerifyJWT[Verify JWT signature]
    
    VerifyJWT --> TokenValid{Token valid?}
    TokenValid -->|No| Return401Invalid["❌ 401: Invalid token"]
    TokenValid -->|Yes| FindUser[(Find user by ID in MongoDB)]
    
    FindUser --> UserExists{User exists?}
    UserExists -->|No| Return401User["❌ 401: User not found"]
    UserExists -->|Yes| AttachUser[Attach user to req.user]
    
    AttachUser --> RouteHandler[authRoutes.get /verify]
    RouteHandler --> Controller[AuthController.verifyToken]
    Controller --> Return200["✅ 200: Token valid + user data"]
    
    style Request fill:#e3f2fd
    style Return200 fill:#c8e6c9
    style Return401 fill:#ffcdd2
    style FindUser fill:#fff9c4
```

✅ **Success Response (200):**

```json
{
  "status": "success",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

❌ **Possible Errors:**

| Status | Message | Cause |
|--------|---------|-------|
| 401 | No token provided | אין cookie/token בבקשה |
| 401 | Invalid token | Token לא תקף או פג תוקף |
| 401 | User not found | המשתמש נמחק מהמערכת |

---

### GET /api/auth/profile

**📝 תיאור:** קבלת פרטי המשתמש המחובר

**🔒 Security:** מחייב התחברות (requireAuth)

```mermaid
flowchart TD
    Request([GET /api/auth/profile]) --> RequireAuth[requireAuth middleware]
    RequireAuth --> CheckToken{Valid token?}
    CheckToken -->|No| Return401["❌ 401: Unauthorized"]
    CheckToken -->|Yes| RouteHandler[authRoutes.get /profile]
    
    RouteHandler --> Controller[AuthController.getProfile]
    Controller --> GetUserId[Get userId from req.user]
    GetUserId --> FindUser[(Find user by ID in MongoDB)]
    
    FindUser --> UserExists{User found?}
    UserExists -->|No| Return404["❌ 404: User not found"]
    UserExists -->|Yes| PrepareResponse[Prepare user object - exclude password]
    PrepareResponse --> Return200["✅ 200: User profile data"]
    
    style Request fill:#e3f2fd
    style Return200 fill:#c8e6c9
    style Return401 fill:#ffcdd2
    style Return404 fill:#ffcdd2
    style FindUser fill:#fff9c4
```

✅ **Success Response (200):**

```json
{
  "status": "success",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

❌ **Possible Errors:**

| Status | Message | Cause |
|--------|---------|-------|
| 401 | Unauthorized | לא מחובר |
| 404 | User not found | המשתמש לא נמצא |

---

## 🛒 Cart Endpoints

> **מטרה:** ניהול עגלת קניות - תמיכה במשתמשים מחוברים ואורחים  
> **Storage:**  
> - משתמשים מחוברים → MongoDB (קבוע)  
> - משתמשים אורחים → Redis (זמני, 24 שעות TTL)

### GET /api/cart

**📝 תיאור:** קבלת עגלת הקניות - עובד גם למשתמשים מחוברים וגם לאורחים

```mermaid
flowchart TD
    Request([GET /api/cart]) --> OptionalAuth[optionalAuth middleware]
    OptionalAuth --> CheckAuth{User authenticated?}
    
    CheckAuth -->|Yes| UserPath[User path]
    CheckAuth -->|No| GuestPath[Guest path]
    
    UserPath --> FindUserCart[(Find cart by userId in MongoDB)]
    GuestPath --> FindGuestCart[(Find cart by sessionId in Redis)]
    
    FindUserCart --> UserCartExists{Cart exists?}
    FindGuestCart --> GuestCartExists{Cart exists?}
    
    UserCartExists -->|No| ReturnEmptyUser["✅ 200: Empty cart"]
    UserCartExists -->|Yes| PopulateProducts[Populate product details]
    
    GuestCartExists -->|No| ReturnEmptyGuest["✅ 200: Empty cart"]
    GuestCartExists -->|Yes| PopulateProductsGuest[Populate product details]
    
    PopulateProducts --> CalculateTotalUser[Calculate totals]
    PopulateProductsGuest --> CalculateTotalGuest[Calculate totals]
    
    CalculateTotalUser --> ReturnUserCart["✅ 200: Cart with items"]
    CalculateTotalGuest --> ReturnGuestCart["✅ 200: Cart with items"]
    
    style Request fill:#e3f2fd
    style ReturnUserCart fill:#c8e6c9
    style ReturnGuestCart fill:#c8e6c9
    style ReturnEmptyUser fill:#c8e6c9
    style ReturnEmptyGuest fill:#c8e6c9
    style FindUserCart fill:#fff9c4
    style FindGuestCart fill:#ffe0b2
```

✅ **Success Response (200):**

```json
{
  "status": "success",
  "data": {
    "cart": {
      "items": [
        {
          "productId": "507f1f77bcf86cd799439011",
          "name": "Product Name",
          "price": 29.99,
          "quantity": 2,
          "subtotal": 59.98
        }
      ],
      "totalItems": 2,
      "totalPrice": 59.98
    }
  }
}
```

---

### POST /api/cart/add

**📝 תיאור:** הוספת מוצר לעגלה

```mermaid
flowchart TD
    Request([POST /api/cart/add]) --> OptionalAuth[optionalAuth middleware]
    OptionalAuth --> CheckAuth{User authenticated?}
    
    CheckAuth -->|Yes| GetUserId[Get userId from req.user]
    CheckAuth -->|No| GetSessionId[Get/Create sessionId]
    
    GetUserId --> RouteHandler[cartRoutes.post /add]
    GetSessionId --> RouteHandler
    
    RouteHandler --> Controller[CartController.addToCart]
    Controller --> ValidateInput{Validate input}
    ValidateInput -->|Missing productId| Return400["❌ 400: Product ID required"]
    ValidateInput -->|Invalid quantity| Return400Qty["❌ 400: Quantity must be positive"]
    ValidateInput -->|Valid| CheckProduct[(Find product in MongoDB)]
    
    CheckProduct --> ProductExists{Product exists?}
    ProductExists -->|No| Return404["❌ 404: Product not found"]
    ProductExists -->|Yes| CheckStock{Enough stock?}
    
    CheckStock -->|No| Return409["❌ 409: Insufficient stock"]
    CheckStock -->|Yes| ServiceCall[Add to cart]
    
    ServiceCall --> UpdateCart[Update cart]
    UpdateCart --> SaveCart[(Save cart)]
    SaveCart --> Return200["✅ 200: Item added to cart"]
    
    style Request fill:#e3f2fd
    style Return200 fill:#c8e6c9
    style Return400 fill:#ffcdd2
    style Return400Qty fill:#ffcdd2
    style Return404 fill:#ffcdd2
    style Return409 fill:#ffcdd2
    style CheckProduct fill:#fff9c4
    style SaveCart fill:#fff9c4
```

📥 **Request Example:**

```json
{
  "productId": "507f1f77bcf86cd799439011",
  "quantity": 2
}
```

✅ **Success Response (200):**

```json
{
  "status": "success",
  "data": {
    "cart": {
      "items": [
        {
          "productId": "507f1f77bcf86cd799439011",
          "quantity": 2,
          "price": 29.99
        }
      ],
      "totalItems": 2,
      "totalPrice": 59.98
    }
  }
}
```

---

## 📦 Product Endpoints

### GET /api/products

**📝 תיאור:** קבלת רשימת מוצרים עם אפשרויות סינון וחיפוש

```mermaid
flowchart TD
    Request([GET /api/products]) --> ParseQuery[Parse query parameters]
    ParseQuery --> Controller[ProductController.getProducts]
    
    Controller --> BuildQuery[Build MongoDB query]
    BuildQuery --> ApplyFilters[Apply all filters]
    
    ApplyFilters --> ExecuteQuery[(Execute MongoDB find)]
    ExecuteQuery --> Return200["✅ 200: Products array"]
    
    style Request fill:#e3f2fd
    style Return200 fill:#c8e6c9
    style ExecuteQuery fill:#fff9c4
```

✅ **Success Response (200):**

```json
{
  "status": "success",
  "data": {
    "products": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Product Name",
        "description": "Product description",
        "price": 29.99,
        "stock": 100,
        "category": "electronics"
      }
    ]
  }
}
```

---

### GET /api/products/:id

**📝 תיאור:** קבלת פרטי מוצר בודד

```mermaid
flowchart TD
    Request([GET /api/products/:id]) --> ExtractId[Extract product ID]
    ExtractId --> Controller[ProductController.getProduct]
    
    Controller --> ValidateId{Valid ObjectId?}
    ValidateId -->|No| Return400["❌ 400: Invalid ID"]
    ValidateId -->|Yes| FindProduct[(Find in MongoDB)]
    
    FindProduct --> ProductExists{Product found?}
    ProductExists -->|No| Return404["❌ 404: Not found"]
    ProductExists -->|Yes| Return200["✅ 200: Product details"]
    
    style Request fill:#e3f2fd
    style Return200 fill:#c8e6c9
    style Return400 fill:#ffcdd2
    style Return404 fill:#ffcdd2
    style FindProduct fill:#fff9c4
```

✅ **Success Response (200):**

```json
{
  "status": "success",
  "data": {
    "product": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Product Name",
      "description": "Detailed product description",
      "price": 29.99,
      "stock": 100,
      "category": "electronics",
      "imageUrl": "https://example.com/image.jpg"
    }
  }
}
```

---

## ❤️ Health Endpoints

### GET /api/health

**📝 תיאור:** בדיקת סטטוס השרת - MongoDB, Redis, זמן הפעולה

```mermaid
flowchart TD
    Request([GET /api/health]) --> RouteHandler[healthRoutes.get /]
    RouteHandler --> Controller[HealthController.getHealth]
    
    Controller --> CheckMongo[(Check MongoDB connection)]
    CheckMongo --> MongoOK{MongoDB connected?}
    MongoOK -->|Yes| MongoHealthy[mongo: healthy]
    MongoOK -->|No| MongoDown[mongo: down]
    
    MongoHealthy --> CheckRedisYes[(Check Redis connection)]
    MongoDown --> CheckRedisNo[(Check Redis connection)]
    
    CheckRedisYes --> RedisOKYes{Redis connected?}
    CheckRedisNo --> RedisOKNo{Redis connected?}
    
    RedisOKYes -->|Yes| BothHealthy["✅ Both healthy"]
    RedisOKYes -->|No| DegradedYes["⚠️ One down"]
    
    RedisOKNo -->|Yes| DegradedNo["⚠️ One down"]
    RedisOKNo -->|No| AllDown["❌ Both down"]
    
    BothHealthy --> Return200["✅ 200: All systems healthy"]
    DegradedYes --> Return503["⚠️ 503: Degraded service"]
    DegradedNo --> Return503
    AllDown --> Return503
    
    style Request fill:#e3f2fd
    style Return200 fill:#c8e6c9
    style Return503 fill:#fff3e0
    style CheckMongo fill:#fff9c4
    style CheckRedisYes fill:#ffe0b2
    style CheckRedisNo fill:#ffe0b2
```

✅ **Success Response (200):**

```json
{
  "status": "success",
  "data": {
    "health": {
      "status": "healthy",
      "mongodb": "connected",
      "redis": "connected",
      "uptime": 12345,
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

### GET /api/health/ping

**📝 תיאור:** בדיקה פשוטה - האם השרת עובד

```mermaid
flowchart TD
    Request([GET /api/health/ping]) --> RouteHandler[healthRoutes.get /ping]
    RouteHandler --> Controller[HealthController.ping]
    Controller --> Return200["✅ 200: pong"]
    
    style Request fill:#e3f2fd
    style Return200 fill:#c8e6c9
```

✅ **Success Response (200):**

```json
{
  "status": "success",
  "message": "pong"
}
```

---

## 💡 Best Practices

### 🔒 Security

1. **Always verify JWT** - כל הפעולות הרגישות דורשות requireAuth
2. **Rate Limiting** - Auth endpoints מוגבלים ל-5 ניסיונות/דקה
3. **httpOnly Cookies** - Tokens לא נגישים ל-JavaScript
4. **Password Hashing** - bcrypt עם salt
5. **Input Validation** - כל ה-inputs עוברים validation לפני שימוש

### ⚡ Performance

1. **Redis for Guest Carts** - מהיר פי 10 מ-MongoDB
2. **Debounced MongoDB Saves** - Cart saves מתבצעים כל 5 שניות
3. **Product Population** - Lazy loading של פרטי מוצרים
4. **Index על fields חשובים** - email, userId, sessionId

### 🐛 Error Handling

1. **Specific Error Messages** - כל שגיאה עם הסבר ברור
2. **HTTP Status Codes** - שימוש נכון ב-status codes
3. **Validation Errors** - 400 עם פירוט השדות החסרים
4. **Not Found** - 404 למשאבים שלא קיימים
5. **Unauthorized** - 401 כשאין token, 403 כשאין הרשאה

---

**Perfect for:**
- 🔍 הבנת התנהגות endpoints מדויקת
- 🐛 איתור באגים ב-API
- 📖 תיעוד API למפתחים
- 🧪 כתיבת טסטים
- 👥 Onboarding לצוות חדש
