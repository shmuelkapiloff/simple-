# Simple Shop - Final Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Server Architecture](#server-architecture)
3. [Technical Implementation](#technical-implementation)
4. [Database Design](#database-design)
5. [API Documentation](#api-documentation)
6. [Setup & Deployment](#setup--deployment)
7. [Key Features & Design Decisions](#key-features--design-decisions)

---

## Project Overview

**Project Name:** Simple Shop  
**Type:** Full-Stack E-Commerce Application  
**Technology Stack:** 
- Frontend: React 18 + TypeScript + Redux Toolkit + Tailwind CSS
- Backend: Node.js + Express + TypeScript + MongoDB + Redis
- Payment: Stripe Integration
- Authentication: JWT (JSON Web Tokens)

**Project Purpose:**  
A complete e-commerce platform demonstrating modern full-stack development practices with production-ready features like user authentication, shopping cart management, order processing, and payment integration.

**Your Role:** Backend/Server Development

---

## Server Architecture

### High-Level Overview

```
Client (React)
    ↓
    ↓ HTTP/REST
    ↓
[Express Server]
    ├── Authentication Middleware (JWT)
    ├── Rate Limiting & Security
    ├── Request Validation (Zod)
    └── Error Handling

[Application Layer]
    ├── Controllers (Handle HTTP requests)
    ├── Services (Business logic)
    ├── Models (Data structures)
    └── Middleware (Cross-cutting concerns)

[Data Layer]
    ├── MongoDB (Primary database)
    ├── Redis (Caching & sessions)
    └── Stripe API (Payment processing)
```

### Layered Architecture Pattern

**Controllers** → Request entry point, validation, HTTP responses  
**Services** → Business logic, data manipulation, external API calls  
**Models** → MongoDB schemas, data validation, relationships  
**Middleware** → Authentication, logging, error handling, CORS

### Key Server Components

#### 1. Authentication System
- JWT token generation and verification
- Password hashing with bcrypt
- Password reset flow with email verification
- User session management
- Role-based access control (Admin/User)

#### 2. Shopping Cart System
- Redis caching for fast cart access
- MongoDB persistence for permanent storage
- Optimistic updates for better UX
- Cart item validation and pricing
- Automatic cart expiration (1 hour)

#### 3. Order Processing
- Order creation from cart
- Inventory management
- Order status tracking
- Order history retrieval
- Admin order management

#### 4. Payment Integration
- Stripe webhook handling
- Payment confirmation flow
- Transaction logging
- Refund processing
- Payment security with webhooks

#### 5. Product Management
- Product CRUD operations
- Inventory tracking
- Search and filtering
- Category management
- Admin-only access

#### 6. Health & Monitoring
- Database connection health checks
- Service status monitoring
- Error logging with Pino
- Request/response logging
- Performance tracking

---

## Technical Implementation

### File Structure

```
server/
├── src/
│   ├── app.ts                 # Express app initialization
│   ├── server.ts              # Server startup & error handling
│   ├── config/                # Configuration files
│   │   ├── db.ts              # MongoDB connection
│   │   ├── env.ts             # Environment variables
│   │   ├── cors.ts            # CORS configuration
│   │   └── redisClient.ts     # Redis client setup
│   ├── controllers/           # HTTP request handlers
│   │   ├── auth.controller.ts
│   │   ├── cart.controller.ts
│   │   ├── order.controller.ts
│   │   ├── product.controller.ts
│   │   └── admin.controller.ts
│   ├── services/              # Business logic
│   │   ├── auth.service.ts
│   │   ├── cart.service.ts
│   │   ├── order.service.ts
│   │   ├── product.service.ts
│   │   ├── payment.service.ts
│   │   └── health.service.ts
│   ├── models/                # MongoDB schemas
│   │   ├── user.model.ts
│   │   ├── product.model.ts
│   │   ├── cart.model.ts
│   │   ├── order.model.ts
│   │   └── index.ts
│   ├── routes/                # Express routes
│   │   ├── auth.routes.ts
│   │   ├── cart.routes.ts
│   │   ├── order.routes.ts
│   │   ├── product.routes.ts
│   │   ├── admin.routes.ts
│   │   └── index.ts
│   ├── middlewares/           # Express middleware
│   │   ├── auth.middleware.ts      # JWT verification
│   │   ├── errorHandler.middleware.ts
│   │   └── rateLimit.middleware.ts
│   ├── validators/            # Input validation (Zod)
│   │   └── validators.ts
│   ├── utils/                 # Utility functions
│   │   ├── logger.ts          # Pino logging
│   │   ├── asyncHandler.ts    # Error handling wrapper
│   │   └── response.ts        # Standard response format
│   └── seed/                  # Database seeding
│       └── seed.ts
├── dist/                      # Compiled JavaScript
├── jest.config.js             # Testing configuration
├── package.json               # Dependencies & scripts
└── tsconfig.json              # TypeScript configuration
```

### Key Technologies & Libraries

**Express.js** - Web framework for routing and middleware  
**Mongoose** - MongoDB ODM for schema validation and queries  
**Zod** - Runtime type validation for API inputs  
**JWT** - Token-based authentication  
**Stripe** - Payment processing integration  
**Redis** - In-memory data store for caching  
**Pino** - Structured logging for production  
**Helmet** - Security headers middleware  
**express-rate-limit** - Rate limiting for DDoS protection  
**TypeScript** - Static typing for better code quality  

---

## Database Design

### MongoDB Collections

#### Users Collection
```json
{
  "_id": ObjectId,
  "name": "String",
  "email": "String (unique)",
  "password": "String (hashed)",
  "phone": "String",
  "role": "String (user|admin)",
  "addresses": [
    {
      "type": "String",
      "street": "String",
      "city": "String",
      "country": "String",
      "isDefault": "Boolean"
    }
  ],
  "isActive": "Boolean",
  "lastLogin": "Date",
  "lastUpdated": "Date",
  "createdAt": "Date"
}
```

#### Products Collection
```json
{
  "_id": ObjectId,
  "name": "String",
  "description": "String",
  "price": "Number",
  "category": "String",
  "inStock": "Boolean",
  "quantity": "Number",
  "images": ["String"],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### Carts Collection
```json
{
  "_id": ObjectId,
  "userId": "ObjectId (ref: users)",
  "items": [
    {
      "product": "ObjectId (ref: products)",
      "quantity": "Number",
      "lockedPrice": "Number"
    }
  ],
  "updatedAt": "Date"
}
```

#### Orders Collection
```json
{
  "_id": ObjectId,
  "userId": "ObjectId (ref: users)",
  "items": [
    {
      "product": "ObjectId (ref: products)",
      "quantity": "Number",
      "price": "Number"
    }
  ],
  "totalAmount": "Number",
  "status": "String (pending|confirmed|shipped|delivered)",
  "paymentStatus": "String (pending|confirmed|failed)",
  "shippingAddress": "Object",
  "stripePaymentId": "String",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Database Relationships

```
Users
  ├── 1 → Many → Carts
  ├── 1 → Many → Orders
  └── 1 → Many → Addresses

Products
  ├── 1 → Many → CartItems
  └── 1 → Many → OrderItems

Orders
  └── 1 → Many → OrderItems (with product references)
```

### Indexing Strategy

- **Users**: Index on `email` (unique) for login queries
- **Products**: Index on `category` for filtering
- **Orders**: Index on `userId` and `status` for queries
- **Carts**: Index on `userId` for quick lookups

---

## API Documentation

### Authentication Endpoints

#### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "string",
  "email": "string",
  "password": "string"
}

Response: 201 Created
{
  "user": { ...user object... },
  "token": "JWT token"
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}

Response: 200 OK
{
  "user": { ...user object... },
  "token": "JWT token"
}
```

#### Verify Token
```
POST /api/auth/verify
Headers: Authorization: Bearer <token>

Response: 200 OK
{
  "user": { ...user object... }
}
```

### Product Endpoints

#### Get All Products
```
GET /api/products?category=electronics&search=laptop

Response: 200 OK
{
  "products": [
    {
      "_id": "...",
      "name": "Laptop",
      "price": 999,
      "category": "electronics",
      ...
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

#### Get Product By ID
```
GET /api/products/:id

Response: 200 OK
{
  "_id": "...",
  "name": "Laptop",
  "price": 999,
  ...
}
```

### Cart Endpoints

#### Get Cart
```
GET /api/cart
Headers: Authorization: Bearer <token>

Response: 200 OK
{
  "items": [
    {
      "product": { ...product object... },
      "quantity": 2,
      "lockedPrice": 999
    }
  ],
  "total": 1998
}
```

#### Add to Cart
```
POST /api/cart/add
Headers: Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "...",
  "quantity": 1
}

Response: 200 OK
{
  "items": [...],
  "total": ...
}
```

#### Remove from Cart
```
POST /api/cart/remove
Headers: Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "..."
}

Response: 200 OK
{
  "items": [...],
  "total": ...
}
```

### Order Endpoints

#### Create Order
```
POST /api/orders
Headers: Authorization: Bearer <token>
Content-Type: application/json

{
  "shippingAddress": {
    "street": "...",
    "city": "...",
    "country": "..."
  }
}

Response: 201 Created
{
  "_id": "...",
  "items": [...],
  "totalAmount": 1998,
  "status": "pending",
  "stripePaymentId": "..."
}
```

#### Get User Orders
```
GET /api/orders
Headers: Authorization: Bearer <token>

Response: 200 OK
{
  "orders": [
    {
      "_id": "...",
      "items": [...],
      "status": "delivered",
      "totalAmount": 1998,
      ...
    }
  ]
}
```

#### Get Order By ID
```
GET /api/orders/:id
Headers: Authorization: Bearer <token>

Response: 200 OK
{
  "_id": "...",
  "items": [...],
  "status": "delivered",
  ...
}
```

### Admin Endpoints

#### Get All Orders (Admin)
```
GET /api/admin/orders
Headers: Authorization: Bearer <token> (Admin required)

Response: 200 OK
{
  "orders": [...]
}
```

#### Update Order Status (Admin)
```
PUT /api/admin/orders/:id/status
Headers: Authorization: Bearer <token> (Admin required)
Content-Type: application/json

{
  "status": "shipped"
}

Response: 200 OK
{
  "order": { ...updated order... }
}
```

---

## Setup & Deployment

### Local Development Setup

#### Prerequisites
- Node.js 18+
- MongoDB 5.0+
- Redis 6.0+
- npm or yarn

#### Installation

```bash
# 1. Clone repository
git clone <repository-url>
cd simple-shop

# 2. Install server dependencies
cd server
npm install

# 3. Create environment file
cp .env.example .env
# Edit .env with your values:
#   - MONGO_URI: MongoDB connection string
#   - REDIS_URL: Redis connection string
#   - JWT_SECRET: Random secret for tokens
#   - STRIPE_SECRET_KEY: Your Stripe API key
#   - NODE_ENV: development or production

# 4. Run database seed
npm run seed

# 5. Start development server
npm run dev
# Server runs on http://localhost:5000
```

#### Environment Variables (.env)
```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/simple-shop
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-random-secret-key-here
JWT_EXPIRE=7d
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
CLIENT_URL=http://localhost:3000
LOG_LEVEL=debug
```

#### Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript to JavaScript
npm start            # Run compiled server (production)
npm run seed         # Seed database with sample data
npm test             # Run tests with Jest
npm run test:watch   # Run tests in watch mode
npm run lint         # Check code style with ESLint
```

### Production Deployment

#### Using Docker

```dockerfile
# Dockerfile example
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "dist/server.js"]
```

#### Deployment Checklist
- ✅ Set `NODE_ENV=production`
- ✅ Use secure MongoDB connection (MongoDB Atlas)
- ✅ Use secure Redis (Redis Cloud)
- ✅ Configure CORS for production domain
- ✅ Set strong JWT_SECRET
- ✅ Enable HTTPS/SSL
- ✅ Configure Stripe webhooks for production API keys
- ✅ Set up logging and monitoring
- ✅ Enable rate limiting
- ✅ Use environment variables for secrets

---

## Key Features & Design Decisions

### 1. Authentication & Security
**Decision:** JWT-based authentication with secure password hashing

**Why:** 
- Stateless authentication scales better than sessions
- JWT tokens can be validated on any server instance
- Password hashing protects user data even if database is compromised

**Implementation:**
- bcrypt for password hashing (automatic salting)
- JWT tokens expire after 7 days
- Refresh token mechanism for extended sessions
- Email verification for password reset

### 2. Cart System with Redis Caching
**Decision:** Dual storage - Redis for performance, MongoDB for persistence

**Why:**
- Redis caching reduces database load (10-100x faster)
- MongoDB persistence ensures no data loss on Redis restart
- Automatic sync between cache and database
- Cart auto-expires after 1 hour of inactivity

**Performance Impact:**
- Cart load: 1-2ms (Redis) vs 50-100ms (MongoDB)
- Reduced database connections under high load

### 3. Layered Architecture
**Decision:** Controllers → Services → Models separation

**Why:**
- **Separation of Concerns:** Each layer has single responsibility
- **Testability:** Services can be tested independently
- **Reusability:** Services can be called from multiple controllers
- **Maintainability:** Easy to change business logic without touching HTTP layer

**Example Flow:**
```
GET /api/cart
    ↓
[CartController] - Parse request, extract userId
    ↓
[CartService] - Check Redis, fallback to MongoDB, calculate totals
    ↓
[CartModel] - Database query with Mongoose
    ↓
[Response] - Format and send to client
```

### 4. Error Handling & Logging
**Decision:** Structured logging with Pino, custom error handling

**Why:**
- **Pino** provides JSON logging for production log aggregation
- **asyncHandler** wrapper prevents uncaught promise rejections
- **Structured data** makes debugging and monitoring easier
- **Log levels** (debug/info/warn/error) for different environments

**Example Log Output:**
```json
{
  "level": "error",
  "time": "2024-01-13T10:30:00.000Z",
  "service": "CartService",
  "error": "Item not found in cart",
  "userId": "...",
  "productId": "..."
}
```

### 5. Input Validation with Zod
**Decision:** Runtime type validation for all API inputs

**Why:**
- **Type Safety:** Validates data shape and types at runtime
- **Automatic Errors:** Invalid data returns 400 Bad Request with details
- **Documentation:** Schema serves as API documentation
- **Security:** Prevents injection attacks through validation

**Example:**
```typescript
const CreateOrderSchema = z.object({
  shippingAddress: z.object({
    street: z.string(),
    city: z.string(),
    country: z.string(),
  })
});

// Invalid input automatically rejected with error message
```

### 6. Payment Integration
**Decision:** Stripe webhooks for reliable payment confirmation

**Why:**
- **Webhook Security:** Verifies payment status from Stripe directly
- **Idempotent:** Multiple webhook calls won't double-charge
- **Async:** Doesn't block order creation if payment is delayed
- **Reliable:** Even if client disconnects, payment still processes

**Payment Flow:**
```
Client initiates payment
    ↓
Stripe processes payment
    ↓
Stripe sends webhook to server
    ↓
Server updates order status
    ↓
Client polls for confirmation
```

### 7. Admin Dashboard
**Decision:** Role-based access control for admin features

**Why:**
- **Security:** Only admins can modify products/orders
- **Scalability:** Middleware checks role on protected routes
- **Flexibility:** Easy to add more roles (moderator, support, etc.)

**Protection:**
```typescript
// Protected admin route
router.put('/orders/:id/status', 
  authenticate,      // Verify JWT
  requireAdmin,      // Check role is 'admin'
  updateOrderStatus  // Handle request
);
```

---

## Summary

This project demonstrates:
- ✅ **Modern Architecture:** Layered design with separation of concerns
- ✅ **Security:** Authentication, rate limiting, input validation
- ✅ **Performance:** Caching with Redis, optimized queries
- ✅ **Reliability:** Error handling, logging, payment webhooks
- ✅ **Scalability:** Stateless design, database indexing
- ✅ **Code Quality:** TypeScript, Zod validation, structured logging
- ✅ **Production Ready:** Docker support, environment configuration

---

**Last Updated:** January 13, 2026  
**Author:** Your Name  
**Status:** Final Project Submission
