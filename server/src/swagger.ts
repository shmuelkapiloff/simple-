/**
 * OpenAPI / Swagger Configuration for Simple Shop Backend
 *
 * Setup Instructions:
 * 1. npm install swagger-ui-express swagger-jsdoc
 * 2. Add to app.ts (see example at bottom)
 * 3. Start server: npm run dev
 * 4. Visit: http://localhost:5000/api/docs
 *
 * This file generates the OpenAPI specification automatically from JSDoc comments
 * in the route handlers. Keep comments updated as you modify endpoints!
 */

import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Simple Shop Backend API",
      description:
        "Production-ready e-commerce backend with Stripe payment processing, MongoDB transactions, and Redis caching",
      version: "1.0.0",
      contact: {
        name: "Simple Shop Team",
        url: "https://github.com/simple-shop",
      },
    },
    servers: [
      {
        url: process.env.API_URL || "http://localhost:5000",
        description: "API Server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token obtained from /auth/login endpoint",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: { type: "string", description: "User ID (MongoDB ObjectId)" },
            email: { type: "string", format: "email" },
            name: { type: "string" },
            role: { type: "string", enum: ["customer", "admin"] },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Product: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            price: { type: "number", minimum: 0 },
            stock: { type: "integer", minimum: 0 },
            category: { type: "string" },
            description: { type: "string" },
            image: { type: "string", format: "url" },
          },
        },
        Order: {
          type: "object",
          properties: {
            _id: { type: "string" },
            orderNumber: { type: "string" },
            user: { type: "string" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  product: { type: "string" },
                  quantity: { type: "integer" },
                  price: { type: "number" },
                },
              },
            },
            totalAmount: { type: "number" },
            paymentStatus: {
              type: "string",
              enum: ["pending", "paid", "failed"],
            },
            shippingAddress: { type: "object" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Cart: {
          type: "object",
          properties: {
            _id: { type: "string" },
            user: { type: "string" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  product: { type: "string" },
                  quantity: { type: "integer" },
                },
              },
            },
            total: { type: "number" },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
            message: { type: "string" },
            statusCode: { type: "integer" },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/**/*.ts", "./src/controllers/**/*.ts"],
};

export const specs = swaggerJsdoc(options);

/**
 * ═════════════════════════════════════════════════════════════════
 * ENDPOINT DOCUMENTATION EXAMPLES
 * ═════════════════════════════════════════════════════════════════
 *
 * Add these JSDoc comments ABOVE each route handler to auto-generate docs
 *
 * ─────────────────────────────────────────────────────────────────
 * AUTH ENDPOINTS
 * ─────────────────────────────────────────────────────────────────
 */

/*
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Create a new user account
 *     description: |
 *       Register a new user with email and password.
 *       Passwords must be at least 8 characters.
 *       Email must be valid and unique.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   description: JWT access token (valid 15 minutes)
 *                 refreshToken:
 *                   type: string
 *                   description: Refresh token (valid 7 days)
 *       400:
 *         description: Invalid input or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/*
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login with email and password
 *     description: Authenticate user and receive JWT token
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
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/*
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Refresh JWT token
 *     description: Get a new access token using refresh token (rotate tokens for security)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New tokens issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: New access token
 *                 refreshToken:
 *                   type: string
 *                   description: New refresh token (old one invalidated)
 *       401:
 *         description: Invalid or expired refresh token
 */

/**
 * ─────────────────────────────────────────────────────────────────
 * PRODUCT ENDPOINTS
 * ─────────────────────────────────────────────────────────────────
 */

/*
 * @swagger
 * /api/products:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get all products (paginated)
 *     description: |
 *       Retrieve products with pagination.
 *       Default: 20 products per page.
 *       Results cached in Redis for fast retrieval.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by product name
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pages:
 *                   type: integer
 */

/*
 * @swagger
 * /api/products/{id}:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get product details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */

/**
 * ─────────────────────────────────────────────────────────────────
 * CART ENDPOINTS
 * ─────────────────────────────────────────────────────────────────
 */

/*
 * @swagger
 * /api/cart:
 *   get:
 *     tags:
 *       - Cart
 *     summary: Get current user's cart
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User's shopping cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       401:
 *         description: Unauthorized (missing token)
 */

/*
 * @swagger
 * /api/cart/add:
 *   post:
 *     tags:
 *       - Cart
 *     summary: Add item to cart
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Item added to cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Invalid product or quantity
 */

/**
 * ─────────────────────────────────────────────────────────────────
 * ORDER ENDPOINTS
 * ─────────────────────────────────────────────────────────────────
 */

/*
 * @swagger
 * /api/orders:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Get user's orders
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: List of user's orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 total:
 *                   type: integer
 *   post:
 *     tags:
 *       - Orders
 *     summary: Create new order
 *     security:
 *       - BearerAuth: []
 *     description: |
 *       Create order from cart items.
 *       - Validates cart is not empty
 *       - Checks stock availability
 *       - Calculates total amount
 *       - Reserves inventory (but doesn't reduce yet)
 *       - Next step: Call /payments/create-intent to process payment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shippingAddress:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   zip:
 *                     type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Cart empty, out of stock, or invalid address
 */

/**
 * ─────────────────────────────────────────────────────────────────
 * PAYMENT ENDPOINTS
 * ─────────────────────────────────────────────────────────────────
 */

/*
 * @swagger
 * /api/payments/create-intent:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Create payment intent (Stripe Checkout Session)
 *     security:
 *       - BearerAuth: []
 *     description: |
 *       Create Stripe Checkout Session to process payment.
 *       - Order must be created first (via POST /api/orders)
 *       - Returns checkout URL to redirect customer
 *       - Customer redirected to Stripe-hosted payment page
 *       - Payment processing happens on Stripe servers (PCI compliant)
 *       - Webhook sent to /api/payments/webhook on completion
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Payment intent created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 checkoutUrl:
 *                   type: string
 *                   format: url
 *                   description: URL to redirect customer to Stripe
 *                 sessionId:
 *                   type: string
 *                   description: Stripe Checkout Session ID
 *       400:
 *         description: Invalid order or amount
 */

/*
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Stripe webhook endpoint (for Stripe servers only)
 *     description: |
 *       Stripe sends payment notifications to this endpoint.
 *       - ⚠️ IMPORTANT: Don't call from client
 *       - Only Stripe servers call this with valid signature
 *       - Webhook signature verified (HMAC-SHA256)
 *       - Idempotency tracked (same event processed only once)
 *       - Must return 200 OK within 5 seconds or Stripe retries
 *       - Should be kept completely public (no auth required)
 *       - Must use raw body (not JSON-parsed) for signature verification
 *
 *       Events handled:
 *       - checkout.session.completed: Customer completed checkout
 *       - payment_intent.succeeded: Payment confirmed by bank
 *       - payment_intent.payment_failed: Payment declined
 *     requestBody:
 *       description: Stripe webhook payload (raw JSON)
 *     responses:
 *       200:
 *         description: Webhook received and processed
 *       400:
 *         description: Signature verification failed
 *       500:
 *         description: Processing failed (Stripe will retry)
 */

/**
 * ═════════════════════════════════════════════════════════════════
 * INTEGRATION WITH EXPRESS APP
 * ═════════════════════════════════════════════════════════════════
 *
 * Add this to your app.ts file:
 *
 * import swaggerUi from 'swagger-ui-express';
 * import { specs } from './swagger';
 *
 * app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs));
 *
 * Then visit: http://localhost:5000/api/docs
 */
