# Simple Shop – Server Routes & Flow

להלן מפת זרימת הנתיבים (API) מהלקוח עד ה-DB, שכבה אחר שכבה.

## ארכיטקטורת שכבות
```
Client → Middleware (app.ts: CORS, Helmet, JSON, Logger)
       → Routes (*.routes.ts)
       → Auth Middleware (requireAuth/requireAdmin/optionalAuth)
       → Controllers (*.controller.ts)
       → Services (*.service.ts)
       → Models (*.model.ts)
       → MongoDB / Redis
```

## Authentication (/api/auth)
- **POST /auth/register** → `auth.controller.register` → `auth.service.register`
  - יוצר משתמש (UserModel), מצפין סיסמה (bcrypt hook), מנפיק JWT.
- **POST /auth/login** → `auth.controller.login` → `auth.service.login`
  - בדיקת סיסמה (`comparePassword`), עדכון lastLogin, מנפיק JWT.
- **GET /auth/verify** → `requireAuth` → `auth.controller.verify`
  - אימות JWT, מחזיר user.
- **GET /auth/profile** → `requireAuth` → `auth.controller.getProfile` → `auth.service.getProfile`
- **PUT /auth/profile** → `requireAuth` → `auth.controller.updateProfile` → `auth.service.updateProfile`

## Products (/api/products)
- **GET /** → `product.controller.getProducts` → `product.service.listProducts` → `ProductModel.find({ isActive: true }).lean()`
- **GET /:id** → `product.controller.getProduct` → `product.service.getProductById` → `ProductModel.findById(id).lean()`

## Cart (/api/cart)
- **GET /** → `optionalAuth` → `cart.controller.getCart` → `cart.service.getCart(userId||sessionId)` → `CartModel.findOne().populate('items.product')`
- **POST /add** → `optionalAuth` → `cart.controller.addToCart` → `cart.service.addToCart`
- **PUT /update** → `cart.controller.updateCartQuantity` → `cart.service.updateCartQuantity`
- **DELETE /remove** → `cart.controller.removeFromCart` → `cart.service.removeFromCart`
- **DELETE /clear** → `cart.controller.clearCart` → `cart.service.clearCart`
- **POST /merge** → `cart.controller.mergeGuestCart` → `cart.service.mergeGuestCart`

## Orders (/api/orders)
- **POST /** → `requireAuth` → `order.controller.createOrder` → `order.service.createOrder`
  - טוען עגלה, מחשב total, יוצר orderNumber, יוצר OrderModel, מוחק עגלה.
- **GET /** → `requireAuth` → `order.controller.getUserOrders` → `order.service.getUserOrders`
- **GET /:orderId** → `requireAuth` → `order.controller.getOrderById` → `order.service.getOrderById`
- **GET /track/:orderId** (ציבורי) → `order.controller.trackOrder` → `order.service.trackOrder`
- **POST /:orderId/cancel** → `requireAuth` → `order.controller.cancelOrder` → `order.service.cancelOrder`

## Addresses (/api/addresses)
- **GET /** → `requireAuth` → `addresses.controller.getAddresses`
- **POST /** → `requireAuth` → `addresses.controller.createAddress` (קובע default אם צריך)
- **GET /default** → `requireAuth` → `addresses.controller.getDefaultAddress`
- **GET /:id** → `requireAuth` → `addresses.controller.getAddressById`
- **PUT /:id** → `requireAuth` → `addresses.controller.updateAddress`
- **DELETE /:id** → `requireAuth` → `addresses.controller.deleteAddress`
- **POST /:id/set-default** → `requireAuth` → `addresses.controller.setDefaultAddress`

## Admin (/api/admin) – מוגן `requireAdmin`
- **GET /products** → `admin.controller.listProducts` → `admin.service.listProducts`
- **POST /products** → `admin.controller.createProduct` → `admin.service.createProduct`
- **PUT /products/:id** → `admin.controller.updateProduct` → `admin.service.updateProduct`
- **DELETE /products/:id** → `admin.controller.deleteProduct` (soft delete)
- **GET /users** → `admin.controller.listUsers` → `admin.service.listUsers`
- **PUT /users/:id/role** → `admin.controller.updateUserRole` → `admin.service.updateUserRole`
- **GET /orders** → `admin.controller.listOrders` → `admin.service.listOrders`
- **PUT /orders/:id/status** → `admin.controller.updateOrderStatus` → `order.service.updateOrderStatus`
- **GET /stats/summary** → `admin.controller.getStats` → `admin.service.getStatsSummary`

## Health (/api/health)
- **GET /** → `health.controller.healthCheck`
  - בודק Mongo (readyState), Redis (ping), uptime.
- **GET /ping** → מחזיר pong.

## קבצי מפתח
```
server/src/app.ts              # חיבור middleware ונתיבים
server/src/server.ts           # אתחול השרת
server/src/config/cors.ts      # CORS
server/src/config/env.ts       # משתני סביבה
server/src/middlewares/auth.middleware.ts  # requireAuth/requireAdmin/optionalAuth
server/src/middlewares/error.middleware.ts # טיפול בשגיאות
server/src/routes/*.routes.ts  # ניתוב
server/src/controllers/*.ts    # בקר
server/src/services/*.ts       # לוגיקה עסקית
server/src/models/*.ts         # סכמות Mongoose
```
