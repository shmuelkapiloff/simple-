# 📚 Simple Shop - Master Project Guide
## כל מה שצריך לדעת - Complete Project Documentation

---

## 📑 Table of Contents
1. [Project Overview](#project-overview)
2. [Your Role - Backend Developer](#your-role)
3. [**איך ללמוד את הקוד בסדר הנכון** ⭐](#learning-path)
4. [How It All Works](#how-it-works)
5. [Architecture & Design](#architecture)
6. [Database Design](#database)
7. [API Endpoints](#api-endpoints)
8. [Code Organization](#code-organization)
9. [Key Concepts](#key-concepts)
10. [How to Run](#how-to-run)
11. [Before Submission](#before-submission)
12. [Presentation Guide](#presentation-guide)
13. [Q&A With Answers](#qa)
14. [Troubleshooting](#troubleshooting)

---

# 1️⃣ PROJECT OVERVIEW

## What is Simple Shop?
A full-stack e-commerce platform demonstrating modern web development.

**Technology Stack:**
- **Frontend:** React 18 + TypeScript + Redux Toolkit + Tailwind CSS
- **Backend:** Node.js + Express.js + TypeScript + MongoDB + Redis
- **Payments:** Stripe Integration
- **Authentication:** JWT Tokens
- **Logging:** Pino (structured logging)

## Features
✅ User registration & authentication  
✅ Product browsing & search  
✅ Shopping cart management  
✅ Order creation & tracking  
✅ Stripe payment integration  
✅ Admin dashboard  
✅ Password reset with email  
✅ Address management  

## Project Goals
- Demonstrate full-stack development skills
- Show understanding of security best practices
- Implement production-grade code
- Use modern tools and patterns

---

# 2️⃣ YOUR ROLE - BACKEND DEVELOPER

## Your Responsibility
You built the **server/backend** that:
1. **Authenticates users** (registration, login, password reset)
2. **Manages products** (CRUD operations)
3. **Handles shopping carts** (add/remove items, persistence)
4. **Processes orders** (creation, tracking, fulfillment)
5. **Manages payments** (Stripe integration)
6. **Secures everything** (authentication, validation, rate limiting)

## What You Need to Know
- How every HTTP request flows through your code
- Where everything is located in the file structure
- Why you made each architectural decision
- How to explain your code to others
- How to debug issues when they arise

## Key Responsibilities
- **Code Quality:** TypeScript, proper error handling, structured logging
- **Security:** JWT, password hashing, input validation, rate limiting
- **Performance:** Redis caching, database indexing, optimized queries
- **Testing:** Endpoints work with Postman/curl
- **Documentation:** Code is self-explanatory, comments for complex logic

---

# 3️⃣ איך ללמוד את הקוד בסדר הנכון {#learning-path}

## 📖 מסלול הלימוד המומלץ - The Right Learning Path

**זמן כולל: 4-5 שעות**

### שלב 1️⃣: הבנה כללית (30 דקות)

**קרא את הקבצים האלה בסדר הזה:**

1. **README.md** (5 דקות)
   - מה הפרויקט עושה
   - איך להריץ אותו
   
2. **server/src/app.ts** (10 דקות)
   - איך האפליקציה מתחילה
   - אילו middleware משתמשים
   - איך ה-routes מחוברים
   
3. **server/src/server.ts** (10 דקות)
   - איך השרת עולה
   - חיבור ל-MongoDB
   - חיבור ל-Redis
   
4. **server/package.json** (5 דקות)
   - אילו ספריות משתמשים
   - אילו scripts יש

**מה תבין אחרי שלב זה:**
✅ איך השרת מתחיל לעבוד  
✅ מה הספריות שמשתמשים  
✅ איך הכל מחובר ביחד

---

### שלב 2️⃣: הבנת המבנה (45 דקות)

**עבור על המבנה הזה בסדר:**

#### א. Models (15 דקות)
**סדר קריאה:**
1. `server/src/models/user.model.ts` - איך משתמשים נשמרים
2. `server/src/models/product.model.ts` - איך מוצרים נשמרים
3. `server/src/models/cart.model.ts` - איך עגלות נשמרות
4. `server/src/models/order.model.ts` - איך הזמנות נשמרות

**מה לחפש:**
- אילו שדות יש בכל Schema
- אילו validations יש
- אילו indexes יש
- אילו methods/statics יש

#### ב. Routes (15 דקות)
**סדר קריאה:**
1. `server/src/routes/index.ts` - איך כל ה-routes מחוברים
2. `server/src/routes/auth.routes.ts` - routes של authentication
3. `server/src/routes/product.routes.ts` - routes של מוצרים
4. `server/src/routes/cart.routes.ts` - routes של עגלה
5. `server/src/routes/order.routes.ts` - routes של הזמנות

**מה לחפש:**
- אילו endpoints יש
- איזה HTTP method (GET/POST/PUT/DELETE)
- אילו middleware על כל route (authenticate, validate)

#### ג. Middleware (15 דקות)
**סדר קריאה:**
1. `server/src/middlewares/auth.middleware.ts` - איך בודקים token
2. `server/src/middlewares/errorHandler.middleware.ts` - איך מטפלים בשגיאות
3. `server/src/validators/validators.ts` - איך בודקים input

**מה לחפש:**
- איך ה-JWT נבדק
- איך שגיאות מטופלות
- איך הקלט מאומת

**מה תבין אחרי שלב זה:**
✅ איפה כל קובץ נמצא  
✅ מה התפקיד של כל קובץ  
✅ איך הקבצים מחוברים

---

### שלב 3️⃣: עקוב אחרי Request מלא (60 דקות)

**בחר endpoint אחד ועקוב אחריו מתחילה עד סוף:**

#### דוגמה: "הוספת פריט לעגלה"

**צעד 1: ה-Request מגיע**
```
POST /api/cart/add
Authorization: Bearer eyJhbGc...
Body: { "productId": "123", "quantity": 2 }
```

**צעד 2: Route Matching (5 דקות)**
```typescript
// קובץ: server/src/routes/cart.routes.ts
router.post('/add', authenticate, addToCart);
```
**שאלות:**
- איך הנתיב `/api/cart/add` מתאים?
- מה ה-middleware `authenticate` עושה?
- מי זה `addToCart`?

**צעד 3: Authentication Middleware (10 דקות)**
```typescript
// קובץ: server/src/middlewares/auth.middleware.ts
export const authenticate = (req, res, next) => {
  // 1. קח את ה-token מה-header
  const token = req.headers.authorization?.split(' ')[1];
  
  // 2. בדוק שיש token
  if (!token) throw Error('No token');
  
  // 3. בדוק שה-token תקין
  const decoded = jwt.verify(token, JWT_SECRET);
  
  // 4. שמור את ה-user ב-request
  req.user = decoded;
  
  // 5. תן לבקשה להמשיך
  next();
};
```
**שאלות:**
- מה קורה אם אין token?
- מה `jwt.verify` עושה?
- איפה `req.user` נשמר?

**צעד 4: Controller (15 דקות)**
```typescript
// קובץ: server/src/controllers/cart.controller.ts
export const addToCart = asyncHandler(async (req, res) => {
  // 1. קח את ה-userId מה-token
  const userId = req.user.id;
  
  // 2. קח את הנתונים מה-body
  const { productId, quantity } = req.body;
  
  // 3. קרא ל-service
  const cart = await CartService.addItem(userId, productId, quantity);
  
  // 4. החזר תשובה
  res.json({ success: true, data: cart });
});
```
**שאלות:**
- מה `asyncHandler` עושה?
- למה לא עושים את הלוגיקה כאן?
- למה קוראים ל-Service?

**צעד 5: Service (20 דקות)**
```typescript
// קובץ: server/src/services/cart.service.ts
static async addItem(userId: string, productId: string, quantity: number) {
  // 1. בדוק שהמוצר קיים
  const product = await ProductModel.findById(productId);
  if (!product) throw Error('Product not found');
  
  // 2. בדוק שיש מלאי
  if (product.quantity < quantity) throw Error('Out of stock');
  
  // 3. מצא את העגלה של המשתמש
  let cart = await CartModel.findOne({ userId });
  if (!cart) {
    cart = new CartModel({ userId, items: [] });
  }
  
  // 4. הוסף את הפריט
  const existingItem = cart.items.find(i => i.product.toString() === productId);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({ product: productId, quantity, lockedPrice: product.price });
  }
  
  // 5. שמור ב-MongoDB
  await cart.save();
  
  // 6. שמור ב-Redis (cache)
  await redisClient.setex(`cart:${userId}`, 3600, JSON.stringify(cart));
  
  // 7. החזר את העגלה
  return cart;
}
```
**שאלות:**
- למה בודקים שהמוצר קיים?
- למה שומרים גם ב-MongoDB וגם ב-Redis?
- מה `lockedPrice` ולמה צריך אותו?

**צעד 6: Model (10 דקות)**
```typescript
// קובץ: server/src/models/cart.model.ts
const cartSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, required: true, min: 1 },
    lockedPrice: { type: Number, required: true }
  }]
});

export const CartModel = model('Cart', cartSchema);
```
**שאלות:**
- מה `ref: 'Product'` עושה?
- למה `quantity` חייב להיות לפחות 1?
- איך `cart.save()` יודע איפה לשמור?

**מה תבין אחרי שלב זה:**
✅ איך request עובר דרך כל השכבות  
✅ מה קורה בכל שלב  
✅ למה צריך כל שכבה

---

### שלב 4️⃣: למד עוד Endpoints (90 דקות)

**עכשיו שאתה מבין endpoint אחד, עקוב אחרי עוד 3:**

#### 1. Login Flow (30 דקות)
```
POST /api/auth/login
→ routes/auth.routes.ts
→ controllers/auth.controller.ts (login)
→ services/auth.service.ts (validateLogin)
→ models/user.model.ts
```
**מה ללמוד:**
- איך password hash נבדק (`bcrypt.compare`)
- איך JWT token נוצר
- איך שגיאות מטופלות

#### 2. Create Order Flow (30 דקות)
```
POST /api/orders
→ routes/order.routes.ts
→ middlewares/auth.middleware.ts (authenticate)
→ controllers/order.controller.ts (createOrder)
→ services/order.service.ts (createOrder)
→ services/payment.service.ts (createPaymentIntent)
→ models/order.model.ts
```
**מה ללמוד:**
- איך העגלה הופכת להזמנה
- איך Stripe משתלב
- איך העגלה מתרוקנת אחרי הזמנה

#### 3. Get Products Flow (30 דקות)
```
GET /api/products?category=electronics&page=1
→ routes/product.routes.ts
→ controllers/product.controller.ts (getProducts)
→ services/product.service.ts (getProducts)
→ models/product.model.ts
```
**מה ללמוד:**
- איך filtering עובד
- איך pagination עובדת
- איך queries ל-MongoDB נבנות

**מה תבין אחרי שלב זה:**
✅ איך כל ה-features עובדים  
✅ פטרנים חוזרים בקוד  
✅ איך לקרוא קוד חדש מהר

---

### שלב 5️⃣: הבנת מושגים מתקדמים (60 דקות)

#### א. Redis Caching (15 דקות)
**קבצים:**
- `server/src/config/redisClient.ts`
- `server/src/services/cart.service.ts`

**מה ללמוד:**
- מתי שומרים ב-Redis (`setex`)
- מתי קוראים מ-Redis (`get`)
- מתי מוחקים מ-Redis (`del`)
- למה Redis מהיר יותר מ-MongoDB

#### ב. JWT & Security (15 דקות)
**קבצים:**
- `server/src/middlewares/auth.middleware.ts`
- `server/src/services/auth.service.ts`

**מה ללמוד:**
- איך JWT token נוצר (`jwt.sign`)
- איך JWT token נבדק (`jwt.verify`)
- מה בתוך ה-token (payload)
- למה הוא בטוח

#### ג. Error Handling (15 דקות)
**קבצים:**
- `server/src/middlewares/errorHandler.middleware.ts`
- `server/src/utils/asyncHandler.ts`

**מה ללמוד:**
- איך `asyncHandler` תופס שגיאות
- איך שגיאות הופכות ל-JSON
- אילו status codes יש

#### ד. Logging (15 דקות)
**קבצים:**
- `server/src/utils/logger.ts`
- `server/src/services/health.service.ts`

**מה ללמוד:**
- איך Pino עובד
- מתי לוגים INFO/WARN/ERROR
- איך לקרוא logs

**מה תבין אחרי שלב זה:**
✅ איך ההיבטים המתקדמים עובדים  
✅ למה כל דבר נעשה ככה  
✅ איך להסביר את זה לפרופסור

---

### שלב 6️⃣: בדיקה מעשית (30 דקות)

**הרץ את השרת ובדוק:**

1. **Start the server**
   ```bash
   cd server
   npm install
   npm run dev
   ```

2. **Test with Postman**
   - Import: `server/postman/Simple-Shop-Complete-Collection.json`
   - Run: Register → Login → Get Products → Add to Cart → Create Order
   
3. **Watch the logs**
   - תראה כל request בלוג
   - תראה איך הוא עובר דרך השכבות
   
4. **Check MongoDB**
   - פתח MongoDB Compass
   - תראה איך הנתונים נשמרים

5. **Check Redis**
   ```bash
   redis-cli
   KEYS *
   GET cart:USER_ID
   ```

**מה תבין אחרי שלב זה:**
✅ איך הקוד באמת עובד בפועל  
✅ איך לדבג בעיות  
✅ איך הכל מחובר

---

## 📋 Checklist - מה אתה צריך לדעת

לפני שאתה מציג לפרופסור, ודא שאתה יכול לענות על השאלות האלה:

### Basic Understanding
- [ ] איך request עובר מ-client ל-database?
- [ ] מה התפקיד של כל שכבה (Routes, Controllers, Services, Models)?
- [ ] איפה כל סוג קוד נמצא?

### Authentication & Security
- [ ] איך JWT authentication עובד?
- [ ] איך passwords מאוחסנים (bcrypt)?
- [ ] מה middleware עושה?

### Database
- [ ] אילו collections יש ב-MongoDB?
- [ ] איך הם מחוברים זה לזה (relationships)?
- [ ] מה indexes ולמה הם חשובים?

### Advanced Features
- [ ] איך Redis caching עובד?
- [ ] איך Stripe payment integration עובד?
- [ ] איך error handling עובד?
- [ ] איך logging עובד?

### Practical Skills
- [ ] איך להריץ את השרת?
- [ ] איך לבדוק endpoint ב-Postman?
- [ ] איך לראות logs?
- [ ] איך לדבג בעיה?

---

## 💡 טיפים ללימוד

### ✅ עשה
- **קרא קוד בסדר** - אל תדלג בין קבצים
- **רשום הערות** - כתוב מה כל קובץ עושה
- **הרץ ובדוק** - תראה איך זה עובד בפועל
- **עקוב אחרי נתונים** - תראה איך request הופך לתגובה
- **שאל שאלות** - למה כל דבר נעשה ככה?

### ❌ אל תעשה
- לא לקרוא הכל בבת אחת
- לא לדלג על middleware
- לא להתעלם מ-error handling
- לא לקרוא קוד בלי להריץ אותו
- לא להמשיך אם לא הבנת משהו

---

## 🎯 סיכום מהיר

**הסדר הנכון:**
1. **הבנה כללית** → app.ts, server.ts, package.json
2. **מבנה** → Models, Routes, Middleware
3. **עקוב אחרי request** → בחר endpoint ועקוב מתחילה עד סוף
4. **עוד endpoints** → Login, Create Order, Get Products
5. **מושגים מתקדמים** → Redis, JWT, Error Handling, Logging
6. **בדיקה מעשית** → הרץ ובדוק עם Postman

**זמן:** 4-5 שעות כולל  
**תוצאה:** הבנה מלאה של הצד שרת

---

# 4️⃣ HOW IT ALL WORKS

## Request Flow Diagram

```
1. User Action (e.g., adds item to cart)
         ↓
2. Client sends HTTP Request
   POST /api/cart/add
   Headers: { Authorization: Bearer JWT_TOKEN }
   Body: { productId: "...", quantity: 2 }
         ↓
3. Server Receives Request
         ↓
4. Middleware Chain:
   - CORS: Allow cross-origin request
   - Parse JSON body
   - Authenticate: Verify JWT token
   - Rate Limit: Check if too many requests
   - Validate: Check data with Zod
         ↓
5. Route Matching:
   "/api/cart/add" → cartController.addToCart()
         ↓
6. Controller (Parse & Call Service):
   Extract userId from JWT
   Extract productId, quantity from request
   Call CartService.addItem()
         ↓
7. Service (Business Logic):
   Check product exists
   Check inventory available
   Check/create user's cart
   Add item or update quantity
   Calculate total
   Save to MongoDB
   Cache in Redis
         ↓
8. Response Back:
   JSON: { success: true, cart: {...} }
         ↓
9. Client Receives & Updates UI
```

## Key Concepts

### 1. Request → Response Cycle
Every endpoint follows: **Request → Parse → Validate → Process → Save → Response**

### 2. Layered Architecture
```
HTTP Request
    ↓
ROUTE (app.get('/path', controller))
    ↓
CONTROLLER (Extract data, call service)
    ↓
SERVICE (Business logic, call models)
    ↓
MODEL (Interact with database)
    ↓
DATABASE (MongoDB)
    ↓
Response back up the chain
```

### 3. Authentication Flow
```
User enters email/password
    ↓
Server hashes password, compares with stored hash
    ↓
If correct: Generate JWT token
    ↓
Client stores token in localStorage
    ↓
Client sends token in every request header
    ↓
Server verifies token signature
    ↓
Request allowed/denied based on token
```

### 4. Cart with Caching
```
User opens cart
    ↓
Check Redis cache (super fast: 1-2ms)
    ↓
If found: Return immediately
    ↓
If not found: Query MongoDB (slower: 50-100ms)
    ↓
Save result to Redis for next time
    ↓
Return to client
```

---

# 4️⃣ ARCHITECTURE & DESIGN

## Why Layered Architecture?

### Controllers → Services → Models Pattern

**Controllers** (HTTP Layer)
- Parse incoming requests
- Extract parameters/body data
- Call appropriate service
- Send HTTP response back
- Handle HTTP errors (400, 401, 404, 500)

**Services** (Business Logic Layer)
- Implement business rules
- Validate data
- Call models/database
- Handle application errors
- Can be reused by multiple controllers

**Models** (Data Layer)
- Define database schemas
- Validate data before saving
- Query the database
- Handle database errors

### Benefits of This Design
1. **Testability** - Can test each layer independently
2. **Reusability** - Services used by multiple controllers
3. **Maintainability** - Changes in one layer don't affect others
4. **Scalability** - Easy to add new features
5. **Security** - Consistent validation and error handling

## Example: Add to Cart

**Step 1: Route**
```typescript
// routes/cart.routes.ts
router.post('/add', authenticate, addToCart);
```

**Step 2: Controller**
```typescript
// controllers/cart.controller.ts
export const addToCart = asyncHandler(async (req, res) => {
  const userId = (req as any).user.id;  // From JWT
  const { productId, quantity } = req.body;  // From request
  
  const cart = await CartService.addItem(userId, productId, quantity);
  res.json({ success: true, data: cart });
});
```

**Step 3: Service**
```typescript
// services/cart.service.ts
static async addItem(userId: string, productId: string, quantity: number) {
  // Validate product exists
  const product = await ProductModel.findById(productId);
  if (!product) throw new Error('Product not found');
  
  // Validate quantity
  if (quantity <= 0) throw new Error('Invalid quantity');
  if (product.quantity < quantity) throw new Error('Not enough stock');
  
  // Get or create cart
  let cart = await CartModel.findOne({ userId });
  if (!cart) cart = new CartModel({ userId, items: [] });
  
  // Add item
  const item = cart.items.find(i => i.product.toString() === productId);
  if (item) {
    item.quantity += quantity;
  } else {
    cart.items.push({
      product: productId,
      quantity,
      lockedPrice: product.price
    });
  }
  
  // Save to database
  await cart.save();
  
  // Cache in Redis
  await redisClient.setex(
    `cart:${userId}`,
    3600,  // 1 hour expiry
    JSON.stringify(cart)
  );
  
  return cart;
}
```

**Step 4: Model**
```typescript
// models/cart.model.ts
const cartSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  items: [
    {
      product: { type: Schema.Types.ObjectId, ref: 'Product' },
      quantity: Number,
      lockedPrice: Number
    }
  ]
});

export const CartModel = model('Cart', cartSchema);
```

---

# 5️⃣ DATABASE DESIGN

## Collections Overview

### Users Collection
Store user accounts and credentials

```json
{
  "_id": ObjectId,
  "name": "John Doe",
  "email": "john@example.com",
  "password": "$2b$10$...",  // bcrypt hashed
  "phone": "+1234567890",
  "role": "user",  // or "admin"
  "addresses": [
    {
      "type": "home",
      "street": "123 Main St",
      "city": "NYC",
      "country": "USA",
      "isDefault": true
    }
  ],
  "isActive": true,
  "lastLogin": "2024-01-13T10:30:00Z",
  "lastUpdated": "2024-01-13T10:30:00Z",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Indexes:**
- `email` (unique, for login)
- `role` (for filtering admin users)

---

### Products Collection
Store product catalog

```json
{
  "_id": ObjectId,
  "name": "Laptop",
  "description": "High-performance laptop",
  "price": 999.99,
  "category": "electronics",
  "inStock": true,
  "quantity": 50,  // Available units
  "images": ["url1", "url2"],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-13T10:30:00Z"
}
```

**Indexes:**
- `category` (for filtering by category)
- `name` (for text search)

---

### Carts Collection
Store shopping carts

```json
{
  "_id": ObjectId,
  "userId": ObjectId,  // Reference to Users
  "items": [
    {
      "product": ObjectId,  // Reference to Products
      "quantity": 2,
      "lockedPrice": 999.99  // Price at time of adding
    }
  ],
  "updatedAt": "2024-01-13T10:30:00Z"
}
```

**Indexes:**
- `userId` (for finding user's cart)

**Special Features:**
- Cached in Redis for fast access
- Auto-deletes from Redis after 1 hour of inactivity
- Persisted in MongoDB for reliability

---

### Orders Collection
Store completed orders

```json
{
  "_id": ObjectId,
  "userId": ObjectId,  // Reference to Users
  "items": [
    {
      "product": ObjectId,
      "quantity": 2,
      "price": 999.99  // Price at time of purchase
    }
  ],
  "totalAmount": 1999.98,
  "status": "pending",  // or "confirmed", "shipped", "delivered"
  "paymentStatus": "pending",  // or "confirmed", "failed"
  "shippingAddress": {
    "street": "123 Main St",
    "city": "NYC",
    "country": "USA"
  },
  "stripePaymentId": "pi_...",
  "createdAt": "2024-01-13T10:30:00Z",
  "updatedAt": "2024-01-13T10:30:00Z"
}
```

**Indexes:**
- `userId` (for user order history)
- `status` (for admin filtering)
- `stripePaymentId` (for payment lookups)

---

## Relationships

```
Users (1) ←→ (Many) Carts
  Each user has one active cart

Users (1) ←→ (Many) Orders
  Each user has multiple orders

Products (1) ←→ (Many) OrderItems
  Each product appears in many orders

Products (1) ←→ (Many) CartItems
  Each product in many carts
```

---

# 6️⃣ API ENDPOINTS

## Authentication Endpoints

### Register User
```
POST /api/auth/register
Content-Type: application/json

Request Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "MyPassword123"
}

Response: 201 Created
{
  "status": "success",
  "data": {
    "user": { "id": "...", "name": "John Doe", "email": "..." },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}

Error: 400 Bad Request
{
  "status": "error",
  "message": "Email already registered"
}
```

### Login
```
POST /api/auth/login
Content-Type: application/json

Request Body:
{
  "email": "john@example.com",
  "password": "MyPassword123"
}

Response: 200 OK
{
  "status": "success",
  "data": {
    "user": { "id": "...", "name": "John", "email": "..." },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}

Error: 401 Unauthorized
{
  "status": "error",
  "message": "Invalid email or password"
}
```

### Verify Token
```
POST /api/auth/verify
Headers: Authorization: Bearer <token>

Response: 200 OK
{
  "status": "success",
  "data": {
    "user": { "id": "...", "name": "John", "email": "..." }
  }
}
```

---

## Product Endpoints

### Get All Products
```
GET /api/products?category=electronics&search=laptop&page=1&limit=10

Response: 200 OK
{
  "status": "success",
  "data": {
    "products": [
      {
        "_id": "...",
        "name": "Laptop",
        "price": 999,
        "category": "electronics",
        "inStock": true,
        "images": [...]
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "pages": 10
    }
  }
}
```

### Get Product By ID
```
GET /api/products/:id

Response: 200 OK
{
  "status": "success",
  "data": {
    "_id": "...",
    "name": "Laptop",
    "description": "...",
    "price": 999,
    "category": "electronics",
    "quantity": 50,
    "images": [...]
  }
}
```

---

## Cart Endpoints

### Get Cart
```
GET /api/cart
Headers: Authorization: Bearer <token>

Response: 200 OK
{
  "status": "success",
  "data": {
    "items": [
      {
        "product": { "_id": "...", "name": "Laptop", "price": 999 },
        "quantity": 2,
        "lockedPrice": 999
      }
    ],
    "total": 1998
  }
}
```

### Add to Cart
```
POST /api/cart/add
Headers: Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "productId": "...",
  "quantity": 2
}

Response: 200 OK
{
  "status": "success",
  "data": { ... cart data ... }
}
```

### Update Quantity
```
POST /api/cart/update
Headers: Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "productId": "...",
  "quantity": 5
}

Response: 200 OK
{
  "status": "success",
  "data": { ... cart data ... }
}
```

### Remove from Cart
```
POST /api/cart/remove/:productId
Headers: Authorization: Bearer <token>

Response: 200 OK
{
  "status": "success",
  "data": { ... cart data ... }
}
```

### Clear Cart
```
POST /api/cart/clear
Headers: Authorization: Bearer <token>

Response: 200 OK
{
  "status": "success",
  "message": "Cart cleared"
}
```

---

## Order Endpoints

### Create Order
```
POST /api/orders
Headers: Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "shippingAddress": {
    "street": "123 Main St",
    "city": "NYC",
    "country": "USA"
  }
}

Response: 201 Created
{
  "status": "success",
  "data": {
    "_id": "...",
    "items": [...],
    "totalAmount": 1998,
    "status": "pending",
    "paymentStatus": "pending",
    "stripePaymentId": "pi_...",
    "clientSecret": "..."  // For Stripe payment
  }
}
```

### Get User Orders
```
GET /api/orders
Headers: Authorization: Bearer <token>

Response: 200 OK
{
  "status": "success",
  "data": {
    "orders": [
      {
        "_id": "...",
        "items": [...],
        "totalAmount": 1998,
        "status": "delivered",
        "createdAt": "2024-01-13T10:30:00Z"
      }
    ]
  }
}
```

### Get Order Details
```
GET /api/orders/:id
Headers: Authorization: Bearer <token>

Response: 200 OK
{
  "status": "success",
  "data": { ... order details ... }
}
```

---

## Admin Endpoints

### Get All Orders (Admin)
```
GET /api/admin/orders
Headers: Authorization: Bearer <admin_token>

Response: 200 OK
{
  "status": "success",
  "data": {
    "orders": [ ... all orders ... ]
  }
}
```

### Update Order Status (Admin)
```
PUT /api/admin/orders/:id/status
Headers: Authorization: Bearer <admin_token>
Content-Type: application/json

Request Body:
{
  "status": "shipped"  // or "pending", "confirmed", "delivered"
}

Response: 200 OK
{
  "status": "success",
  "data": { ... updated order ... }
}
```

---

# 7️⃣ CODE ORGANIZATION

## File Structure

```
server/
├── src/
│   ├── app.ts                          # Express app setup
│   ├── server.ts                       # Server startup
│   │
│   ├── config/                         # Configuration
│   │   ├── db.ts                       # MongoDB connection
│   │   ├── env.ts                      # Environment variables
│   │   ├── cors.ts                     # CORS setup
│   │   └── redisClient.ts              # Redis connection
│   │
│   ├── controllers/                    # HTTP handlers
│   │   ├── auth.controller.ts
│   │   ├── cart.controller.ts
│   │   ├── order.controller.ts
│   │   ├── product.controller.ts
│   │   └── admin.controller.ts
│   │
│   ├── services/                       # Business logic
│   │   ├── auth.service.ts
│   │   ├── cart.service.ts
│   │   ├── order.service.ts
│   │   ├── product.service.ts
│   │   ├── payment.service.ts
│   │   └── health.service.ts
│   │
│   ├── models/                         # Database schemas
│   │   ├── user.model.ts
│   │   ├── product.model.ts
│   │   ├── cart.model.ts
│   │   ├── order.model.ts
│   │   └── index.ts
│   │
│   ├── routes/                         # API endpoints
│   │   ├── auth.routes.ts
│   │   ├── cart.routes.ts
│   │   ├── order.routes.ts
│   │   ├── product.routes.ts
│   │   ├── admin.routes.ts
│   │   └── index.ts
│   │
│   ├── middlewares/                    # Express middleware
│   │   ├── auth.middleware.ts          # JWT verification
│   │   ├── errorHandler.middleware.ts  # Error handling
│   │   └── rateLimit.middleware.ts     # Rate limiting
│   │
│   ├── validators/                     # Input validation
│   │   └── validators.ts               # Zod schemas
│   │
│   ├── utils/                          # Utility functions
│   │   ├── logger.ts                   # Pino logging
│   │   ├── asyncHandler.ts             # Error wrapper
│   │   └── response.ts                 # Response formatter
│   │
│   └── seed/                           # Database seeding
│       └── seed.ts
│
├── dist/                               # Compiled JavaScript
├── jest.config.js                      # Testing config
├── package.json                        # Dependencies
├── tsconfig.json                       # TypeScript config
└── .env.example                        # Config template
```

## Key Files Explained

### app.ts - Express Application Setup
Initializes Express app with:
- Routes (all endpoints)
- Middleware (CORS, logging, etc.)
- Error handling
- Server configuration

### server.ts - Server Startup
Connects to:
- MongoDB database
- Redis cache
- Starts listening on port 5000

### Models
Define MongoDB schemas with:
- Fields and types
- Validation rules
- Indexes for performance
- Helper methods

### Services
Implement business logic:
- Validation
- Database queries
- External API calls (Stripe)
- Error handling

### Controllers
Handle HTTP:
- Parse requests
- Call services
- Format responses
- Send HTTP status codes

### Routes
Map URLs to controllers:
- Define endpoints
- Specify HTTP methods
- Attach middleware

---

# 8️⃣ KEY CONCEPTS

## JWT Authentication

**What:** A token that proves you're logged in

**How it works:**
1. User logs in with email/password
2. Server creates JWT token with user ID inside
3. Server signs token with secret key (only server knows this key)
4. Client stores token in browser localStorage
5. Client sends token in Authorization header with every request
6. Server verifies token signature (proves it wasn't faked)
7. If signature matches, server extracts user ID and allows request

**JWT Structure:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiIxMjM0NTY3ODkwIn0.
dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U

Header.Payload.Signature
```

**Why it's secure:**
- Token is signed (can't be forged)
- Token has expiration (can't be used forever)
- Server verifies signature on every request

**Code Example:**
```typescript
// Create token (on login)
const token = jwt.sign(
  { userId: user._id },
  JWT_SECRET,
  { expiresIn: '7d' }
);

// Verify token (on protected request)
const decoded = jwt.verify(token, JWT_SECRET);
const userId = decoded.userId;
```

---

## Password Hashing

**What:** Converting password to unreadable string using bcrypt

**How it works:**
1. User enters password: "MyPassword123"
2. Server applies bcrypt algorithm
3. Result: "$2b$10$K1Ey7w8gR..." (different each time!)
4. Server stores ONLY the hash in database
5. Password is never stored or logged

**On Login:**
1. User enters password: "MyPassword123"
2. Server hashes it
3. Server compares hashes (not passwords!)
4. If hashes match → password is correct

**Code Example:**
```typescript
// Register (hash password)
const hashedPassword = await bcrypt.hash(password, 10);
user.password = hashedPassword;

// Login (verify password)
const isPasswordValid = await bcrypt.compare(
  passwordFromLogin,
  user.password
);
```

---

## Redis Caching

**What:** Super-fast temporary data storage in memory

**Why use it:**
- MongoDB: 50-100ms per query
- Redis: 1-2ms per lookup
- 50x faster!

**How it works for cart:**
```
User opens cart
  ↓
Try Redis first
  ├─ Found? Return immediately (1-2ms)
  └─ Not found? Query MongoDB (50-100ms)
           ↓
       Save to Redis
           ↓
       Return to user
```

**Auto-expiration:**
- Cart cached for 1 hour
- After 1 hour of no activity, Redis deletes it
- User's cart still safe in MongoDB
- Next time user logs in, it re-loads from MongoDB

**Code Example:**
```typescript
// Save to cache
await redisClient.setex(
  `cart:${userId}`,  // key
  3600,              // expire after 1 hour
  JSON.stringify(cart)  // value
);

// Retrieve from cache
const cachedCart = await redisClient.get(`cart:${userId}`);
```

---

## Stripe Payment Integration

**What:** Third-party service that safely handles credit cards

**Why use Stripe:**
- We never see credit card numbers (PCI compliance)
- Stripe handles security
- Payment processing is reliable
- Webhooks ensure order updates even if client disconnects

**Payment Flow:**
```
1. User clicks "Checkout"
   └─ Order created with status "pending"

2. Client creates Stripe payment session
   └─ Shows payment form

3. User enters credit card on Stripe
   └─ Card data never sent to our server!

4. Stripe processes payment

5. Stripe sends webhook to our server
   └─ Server updates order status to "confirmed"
   └─ Server clears user's cart
   └─ Server logs payment

6. User receives confirmation
   └─ Order ready to ship
```

**Webhook Security:**
- Webhook is POST request from Stripe to your server
- Includes digital signature (proves it came from Stripe)
- Server verifies signature before processing
- Prevents fake payments

---

## Input Validation with Zod

**What:** Runtime validation that data has correct format

**Why use it:**
- Type-safe data (correct fields, correct types)
- Automatic error messages for invalid data
- Prevents injection attacks
- Serves as API documentation

**Example:**
```typescript
const CreateOrderSchema = z.object({
  shippingAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    country: z.string().min(1),
  })
});

// Invalid data automatically rejected
const invalid = { shippingAddress: { street: "" } };
// Error: street must be at least 1 character

// Valid data accepted
const valid = {
  shippingAddress: {
    street: "123 Main St",
    city: "NYC",
    country: "USA"
  }
};
// ✅ Passes validation
```

---

## Structured Logging with Pino

**What:** Production-grade logging that outputs JSON instead of text

**Why use it:**
- JSON format can be parsed by log aggregation tools
- Easier to filter and search logs in production
- Include structured data (userId, product ID, etc.)
- Automatic pretty-printing in development

**Development:**
```
🔍 [10:30:45] CartService: Adding item
  Product ID: 507f1f77bcf86cd799439011
  Quantity: 2
  User: john@example.com
```

**Production:**
```json
{
  "level": "info",
  "time": "2024-01-13T10:30:45.000Z",
  "service": "CartService",
  "userId": "507f1f77bcf86cd799439011",
  "productId": "507f1f77bcf86cd799439012",
  "quantity": 2,
  "msg": "Adding item"
}
```

---

# 9️⃣ HOW TO RUN

## Local Development Setup

### Prerequisites
- Node.js 18+
- MongoDB 5.0+
- Redis 6.0+
- npm or yarn

### Installation Steps

**1. Clone and navigate**
```bash
cd simple-shop
cd server
```

**2. Install dependencies**
```bash
npm install
```

**3. Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with:
```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/simple-shop
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-random-secret-key-here
JWT_EXPIRE=7d
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
CLIENT_URL=http://localhost:3000
LOG_LEVEL=debug
```

**4. Seed database with sample data**
```bash
npm run seed
```

**5. Start development server**
```bash
npm run dev
```

Server runs on `http://localhost:5000`

### Available Commands

```bash
npm run dev           # Start with hot reload
npm run build         # Compile TypeScript
npm start            # Run compiled code
npm test             # Run tests
npm run seed         # Seed database
npm run lint         # Check code style
```

### Testing with Postman

1. Open Postman
2. Import collection: `server/postman/Simple-Shop-Complete-Collection.json`
3. Test endpoints:
   - POST `/api/auth/register` - Create account
   - POST `/api/auth/login` - Get token
   - GET `/api/products` - Browse products
   - POST `/api/cart/add` - Add to cart
   - POST `/api/orders` - Create order

---

# 🔟 BEFORE SUBMISSION

## Pre-Submission Checklist

### Code Quality
- [ ] No `console.log` statements in code
- [ ] No debug/test files remaining
- [ ] TypeScript compiles without errors
- [ ] ESLint passes (if configured)
- [ ] Code is readable and documented

### Functionality
- [ ] Registration works
- [ ] Login works
- [ ] Products load
- [ ] Add to cart works
- [ ] Create order works
- [ ] Stripe payments work
- [ ] All error cases handled gracefully

### Security
- [ ] JWT authentication enabled
- [ ] Password hashing enabled
- [ ] Input validation enabled
- [ ] Rate limiting enabled
- [ ] CORS configured
- [ ] No credentials in code

### Testing
- [ ] Server runs: `npm run dev`
- [ ] All endpoints work in Postman
- [ ] Database seeds: `npm run seed`
- [ ] Error handling works (test with invalid data)
- [ ] Logging displays correctly

### Deployment Ready
- [ ] Build succeeds: `npm run build`
- [ ] `.env.example` has all required variables
- [ ] Database indexes created
- [ ] No missing dependencies
- [ ] Production config ready

---

# 1️⃣1️⃣ PRESENTATION GUIDE

## How to Present to Your Professor

### Opening Statement (1 minute)
> "I built the backend for this e-commerce platform. It's a REST API using Node.js, Express, TypeScript, and MongoDB. The server handles user authentication with JWT tokens, product management, shopping carts with Redis caching, order processing, and Stripe payment integration. As the backend developer, I'm responsible for all server-side functionality and security."

### Key Points to Explain (10 minutes)

#### 1. Architecture (2 minutes)
Show this diagram and explain:
```
Request → Route → Controller → Service → Model → Database
```

"I designed a layered architecture that separates concerns:
- **Controllers** handle HTTP (parsing requests, sending responses)
- **Services** contain business logic (validation, calculations)
- **Models** interact with database (queries, schemas)

This design is testable, maintainable, and scalable."

#### 2. Security (2 minutes)
"I implemented multiple security layers:
- **JWT Tokens** for stateless authentication (secure, scalable)
- **Password Hashing** with bcrypt (passwords never stored directly)
- **Input Validation** with Zod (prevents injection attacks)
- **Rate Limiting** to prevent abuse
- **CORS** configured for cross-origin requests"

#### 3. Performance (2 minutes)
"I optimized performance with:
- **Redis Caching** for shopping cart (50x faster than database)
- **Database Indexing** on frequently queried fields
- **Pagination** for large result sets
- **Lazy Loading** of related data"

#### 4. Key Features (2 minutes)
- User authentication & password reset
- Product catalog with search
- Shopping cart with persistence
- Order management
- Stripe payment integration
- Admin dashboard

#### 5. Code Quality (2 minutes)
"I used industry best practices:
- **TypeScript** for type safety
- **Pino** for structured production logging
- **Zod** for runtime validation
- **asyncHandler** wrapper for error handling
- Clean, documented code"

### Demo Script (5-10 minutes)

```bash
# 1. Show server starting
npm run dev
# Explain: Server connects to MongoDB and Redis, listens on port 5000

# 2. Show database
# (Open MongoDB Compass or show in terminal)
# Explain: We have 4 collections: Users, Products, Orders, Carts

# 3. Test endpoints in Postman
# a) Register user
POST /api/auth/register
Body: { "name": "Test", "email": "test@test.com", "password": "123456" }
# Explain: Creates user, hashes password, returns JWT token

# b) Login
POST /api/auth/login
Body: { "email": "test@test.com", "password": "123456" }
# Explain: Verifies password, returns token

# c) Get products
GET /api/products
# Explain: Returns paginated product list

# d) Add to cart
POST /api/cart/add
Headers: Authorization: Bearer <token_from_login>
Body: { "productId": "...", "quantity": 2 }
# Explain: Saves to Redis (fast) and MongoDB (persistent)

# e) Create order
POST /api/orders
Headers: Authorization: Bearer <token>
Body: { "shippingAddress": {...} }
# Explain: Creates order, initiates Stripe payment

# 4. Show logs
# Explain: Structured logging for debugging and monitoring

# 5. Show error handling
# Send invalid data, show error response
POST /api/cart/add
Headers: Authorization: Bearer <token>
Body: { "productId": "invalid", "quantity": -1 }
# Explain: Validation catches errors, returns helpful messages
```

---

# 1️⃣2️⃣ Q&A WITH ANSWERS

## Common Questions & Good Answers

### Q: "Why did you use MongoDB?"
**A:** "MongoDB provides flexible document storage, which is good for a product catalog where items might have different attributes. The JSON-like structure aligns well with JavaScript. For more relational data, I'd consider PostgreSQL, but MongoDB serves this project's needs well."

### Q: "Why separate Services from Controllers?"
**A:** "Services contain reusable business logic that multiple controllers might need. If I change the business logic, I only update the service, not multiple controllers. It's also easier to test services independently."

### Q: "How do you prevent users from accessing others' data?"
**A:** "Every protected endpoint verifies the JWT token and extracts the user ID. Before returning data, the service checks that the resource belongs to that user:
```typescript
if (order.userId !== currentUserId) throw Error('Unauthorized');
```
This prevents data leakage."

### Q: "Why use Redis for caching?"
**A:** "Redis is in-memory, making it ~50x faster than MongoDB. For cart (accessed frequently), this drastically improves performance. I also save to MongoDB for persistence - if Redis restarts, data isn't lost."

### Q: "How does Stripe integration work?"
**A:** "We never see credit card numbers. The client sends card data directly to Stripe, which returns a token. We send that token to Stripe, which processes payment. Stripe sends us a webhook confirming payment. We update order status based on webhook. This is PCI-compliant and secure."

### Q: "How do you handle errors?"
**A:** "I use `asyncHandler` wrapper around all async handlers. It catches errors and passes them to error handler middleware, which formats them as JSON and sends appropriate HTTP status codes. I also log errors with context (user ID, what operation failed)."

### Q: "Why TypeScript?"
**A:** "TypeScript catches type errors at compile time instead of runtime. For example, if I try to call `.toUpperCase()` on a number, TypeScript catches it before code runs. It's safer and helps refactor with confidence."

### Q: "How would you scale this to 1 million users?"
**A:** "Several approaches:
1. **Database Sharding** - Split data across multiple MongoDB instances
2. **Read Replicas** - Distribute read traffic
3. **Vertical Scaling** - Bigger servers
4. **API Gateway** - Load balance requests across multiple server instances
5. **Microservices** - Split into separate services (auth, products, orders)
6. **CDN** - Cache static assets globally"

### Q: "What was the hardest part?"
**A:** "Getting Redis caching right. It was tricky to keep Redis and MongoDB in sync. I implemented a system where cart saves to both simultaneously, and if either fails, the operation fails. For read operations, I try Redis first, then fall back to MongoDB."

### Q: "What would you add with more time?"
**A:** "1. **Real-time notifications** with WebSockets
2. **GraphQL API** for more flexible queries
3. **API authentication keys** for external integrations
4. **Email notifications** for orders
5. **Search with Elasticsearch** for better product search
6. **Analytics dashboard** to track sales
7. **More comprehensive tests** with Jest"

### Q: "Why did you choose this architecture?"
**A:** "The layered architecture (Controllers → Services → Models) is industry standard because:
1. **Separation of Concerns** - Each layer has one job
2. **Testability** - Can test each layer independently
3. **Maintainability** - Changes in one layer don't break others
4. **Scalability** - Easy to add new features
5. **Team Collaboration** - Clear boundaries between responsibilities"

---

# 1️⃣3️⃣ TROUBLESHOOTING

## Common Issues & Solutions

### Server won't start
**Problem:** `npm run dev` fails
**Solution:**
1. Check Node.js installed: `node --version` (should be 18+)
2. Install dependencies: `npm install`
3. Check MongoDB running: `mongod` in another terminal
4. Check Redis running: `redis-server` in another terminal
5. Check `.env` file exists and has MONGO_URI

### "Cannot find module" error
**Problem:** Module not found
**Solution:**
1. Install dependencies: `npm install`
2. Check import paths are correct
3. Check file names match (case-sensitive on Linux/Mac)

### Port 5000 already in use
**Problem:** `EADDRINUSE: address already in use :::5000`
**Solution:**
```bash
# Kill process using port 5000
# On Mac/Linux:
lsof -ti:5000 | xargs kill -9

# On Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### MongoDB connection error
**Problem:** `MongooseError: Cannot connect to MongoDB`
**Solution:**
1. Check MongoDB running: `mongod`
2. Check MONGO_URI in `.env`
3. Default should be: `mongodb://localhost:27017/simple-shop`

### Redis connection error
**Problem:** `Error: connect ECONNREFUSED 127.0.0.1:6379`
**Solution:**
1. Check Redis running: `redis-server`
2. Check REDIS_URL in `.env`
3. Default should be: `redis://localhost:6379`

### JWT token not working
**Problem:** "Invalid token" error on protected routes
**Solution:**
1. Send token in header: `Authorization: Bearer <token>`
2. Make sure it's from recent login
3. Check JWT_SECRET in `.env` is set
4. Token expires after 7 days (check JWT_EXPIRE)

### Can't login - "Invalid email or password"
**Problem:** Email/password not working
**Solution:**
1. Make sure user is registered first
2. Check email is lowercase
3. Use exact email from registration
4. Password is case-sensitive

### Add to cart fails - "Product not found"
**Problem:** Can't add non-existent product
**Solution:**
1. Use product ID from GET /api/products
2. Product might not exist in database
3. Run `npm run seed` to add sample products

### Stripe payment not working
**Problem:** Payment failing or webhook not received
**Solution:**
1. Check STRIPE_SECRET_KEY in `.env`
2. Use test keys (sk_test_*)
3. Use test card: 4242 4242 4242 4242
4. Check STRIPE_WEBHOOK_SECRET is correct
5. Webhook URL must be publicly accessible (use ngrok for local testing)

---

## Summary

This master guide contains everything you need to:
1. **Understand the project** - What it does, how it works
2. **Understand your role** - What you built and why
3. **Understand the code** - Where things are, how they work
4. **Run and test** - How to start server, test endpoints
5. **Present confidently** - What to say, how to demo
6. **Answer questions** - Good answers prepared
7. **Troubleshoot** - Common problems and solutions

**Everything is in this ONE file for easy reference.**

---

## Quick Navigation

Need information about...?
- **Project Overview** → Section 1
- **Your Role** → Section 2
- **How It Works** → Section 3
- **Architecture** → Section 4
- **Database** → Section 5
- **API Endpoints** → Section 6
- **Code Organization** → Section 7
- **Key Concepts** → Section 8
- **How to Run** → Section 9
- **Before Submission** → Section 10
- **Presentation** → Section 11
- **Q&A** → Section 12
- **Troubleshooting** → Section 13

---

**Last Updated:** January 13, 2026  
**Status:** Ready for Final Project Submission  
**Language:** English (עברית בתוך הטקסט)

**Good luck! בהצלחה!** 🚀
