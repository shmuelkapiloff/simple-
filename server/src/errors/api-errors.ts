/**
 * Centralized API Error Messages
 * 
 * This file consolidates all error messages used throughout the API.
 * Benefits:
 * - Easy to maintain and update messages globally
 * - Supports localization (i18n) in the future
 * - Prevents duplicate error message strings scattered across files
 * - Consistent error messaging across all endpoints
 * 
 * Usage:
 * ──────
 * import { ApiErrors } from "../errors/api-errors";
 * 
 * throw new Error(ApiErrors.Payment.OrderNotFound);
 * 
 * or in controllers:
 * return sendError(res, 404, ApiErrors.Payment.OrderNotFound);
 */

export const ApiErrors = {
  // ═══════════════════════════════════════════════════════════════════════════
  // AUTHENTICATION ERRORS
  // ═══════════════════════════════════════════════════════════════════════════
  Auth: {
    NotAuthenticated: "Access denied. No token provided",
    InvalidToken: "Access denied. Invalid token",
    TokenExpired: "Token has expired. Please login again",
    NoTokenProvided: "Authentication required",
    InvalidCredentials: "Invalid email or password",
    AccountLocked: "Account locked due to multiple failed login attempts. Please try again later",
    AccountLockedMinutes: (minutes: number) =>
      `Account locked for ${minutes} minutes due to failed login attempts`,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTHORIZATION ERRORS
  // ═══════════════════════════════════════════════════════════════════════════
  Authorization: {
    AdminRequired: "This action requires admin privileges",
    OwnerRequired: "You can only access your own resources",
    InsufficientPermissions: "Insufficient permissions for this action",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDATION ERRORS
  // ═══════════════════════════════════════════════════════════════════════════
  Validation: {
    MissingRequiredFields: "Missing required fields",
    InvalidObjectId: "Invalid MongoDB ObjectId format",
    InvalidEmail: "Invalid email format",
    InvalidPassword: "Password must be at least 8 characters",
    InvalidPhoneNumber: "Invalid phone number format",
    InvalidPostalCode: "Invalid postal code format",
    PasswordTooShort: "Password must be at least 8 characters",
    PasswordMismatch: "Passwords do not match",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PRODUCT ERRORS
  // ═══════════════════════════════════════════════════════════════════════════
  Product: {
    NotFound: "Product not found",
    NotActive: "Product is not available",
    InvalidSku: "Invalid product SKU",
    DuplicateSku: "Product with this SKU already exists",
    CategoryRequired: "Product category is required",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CART ERRORS
  // ═══════════════════════════════════════════════════════════════════════════
  Cart: {
    Empty: "Cart is empty",
    ItemNotFound: "Item not found in cart",
    InvalidQuantity: "Quantity must be greater than 0",
    InsufficientStock: "Insufficient stock available",
    CartNotFound: "Cart not found",
    MaxQuantityExceeded: "Maximum quantity per item exceeded",
    InvalidProductId: "Invalid product ID",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ORDER ERRORS
  // ═══════════════════════════════════════════════════════════════════════════
  Order: {
    NotFound: "Order not found",
    NotOwned: "You can only view your own orders",
    InvalidStatus: "Invalid order status",
    CannotCancel: "Order cannot be cancelled in current status",
    CartEmpty: "Cannot create order with empty cart",
    StockError: "Insufficient stock for one or more items",
    InvalidAddress: "Invalid shipping or billing address",
    CreationFailed: "Failed to create order. Please try again",
    InvalidPaymentMethod: "Invalid payment method specified",
    AlreadyConfirmed: "Order has already been confirmed",
    PaymentRequired: "Order payment is required",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PAYMENT ERRORS
  // ═══════════════════════════════════════════════════════════════════════════
  Payment: {
    OrderNotFound: "Order not found for payment",
    InvalidAmount: "Invalid payment amount",
    AmountMismatch: "Payment amount does not match order total",
    AlreadyProcessed: "Payment has already been processed",
    ProcessingFailed: "Payment processing failed. Please try again",
    StripeError: "Stripe payment processing error",
    WebhookFailed: "Webhook processing failed",
    SignatureInvalid: "Invalid webhook signature",
    EventNotFound: "Webhook event not found",
    ClientSecretInvalid: "Invalid or expired client secret",
    CheckoutSessionExpired: "Checkout session has expired",
    RefundFailed: "Refund processing failed",
    RefundNotAllowed: "Refund cannot be processed in current order status",
    ProviderNotConfigured: "Payment provider not configured",
    WebhookNotAuthenticated: "Webhook authentication failed",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // USER ERRORS
  // ═══════════════════════════════════════════════════════════════════════════
  User: {
    NotFound: "User not found",
    EmailExists: "Email already in use",
    PhoneExists: "Phone number already in use",
    InvalidRole: "Invalid user role",
    ProfileUpdateFailed: "Failed to update profile",
    PasswordChangeFailed: "Failed to change password",
    CurrentPasswordIncorrect: "Current password is incorrect",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADDRESS ERRORS
  // ═══════════════════════════════════════════════════════════════════════════
  Address: {
    NotFound: "Address not found",
    DefaultAddressRequired: "At least one default address is required",
    InvalidLabel: "Invalid address label (home/work/other)",
    DeleteFailed: "Failed to delete address",
    CreateFailed: "Failed to create address",
    UpdateFailed: "Failed to update address",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PASSWORD RESET ERRORS
  // ═══════════════════════════════════════════════════════════════════════════
  PasswordReset: {
    TokenInvalid: "Invalid or expired reset token",
    TokenExpired: "Reset token has expired",
    EmailNotFound: "No account found with this email",
    ResetFailed: "Password reset failed. Please try again",
    NoTokenProvided: "Reset token is required",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DATABASE ERRORS
  // ═══════════════════════════════════════════════════════════════════════════
  Database: {
    ConnectionFailed: "Database connection failed",
    QueryFailed: "Database query failed",
    UpdateFailed: "Failed to update record",
    DeleteFailed: "Failed to delete record",
    TransactionFailed: "Database transaction failed",
    DuplicateEntry: "Duplicate entry - this value already exists",
    ValidationFailed: "Data validation failed",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STRIPE-SPECIFIC ERRORS
  // ═══════════════════════════════════════════════════════════════════════════
  Stripe: {
    InvalidApiKey: "Stripe API key is not configured",
    SessionCreationFailed: "Failed to create Stripe checkout session",
    IntentCreationFailed: "Failed to create Stripe payment intent",
    WebhookSecretMissing: "Stripe webhook secret is not configured",
    InvalidCard: "Card declined or invalid",
    PaymentFailed: "Payment was declined",
    RateLimited: "Too many payment attempts. Please wait before trying again",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GENERAL/SERVER ERRORS
  // ═══════════════════════════════════════════════════════════════════════════
  Server: {
    InternalError: "Internal server error",
    NotImplemented: "This feature is not yet implemented",
    ServiceUnavailable: "Service temporarily unavailable",
    RateLimitExceeded: "Too many requests. Please try again later",
    Timeout: "Request timeout",
    BadRequest: "Bad request",
    MethodNotAllowed: "Method not allowed",
    NotFound: "Resource not found",
    Conflict: "Resource conflict",
    UnexpectedError: "An unexpected error occurred",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RATE LIMITING ERRORS
  // ═══════════════════════════════════════════════════════════════════════════
  RateLimit: {
    TooManyRequests: "Too many requests from this IP address",
    TooManyAttempts: "Too many login attempts. Please try again later",
    TooManyPasswordResets: "Too many password reset requests. Please try again later",
    WebhookRateLimited: "Webhook rate limit exceeded",
  },
};

/**
 * Helper function to get error message with context
 * Useful for logging and error reporting
 */
export function getErrorMessage(
  category: keyof typeof ApiErrors,
  key: string,
  fallback = "An error occurred"
): string {
  const categoryErrors = ApiErrors[category];
  if (!categoryErrors) return fallback;

  const errorMsg = (categoryErrors as any)[key];
  if (typeof errorMsg === "function") {
    return "Dynamic error message - call with params";
  }
  return errorMsg || fallback;
}

/**
 * HTTP Status Codes paired with error messages
 * Use this to ensure consistent status codes across endpoints
 */
export const ErrorStatusCodes = {
  [ApiErrors.Auth.NotAuthenticated]: 401,
  [ApiErrors.Auth.InvalidToken]: 401,
  [ApiErrors.Authorization.AdminRequired]: 403,
  [ApiErrors.Authorization.OwnerRequired]: 403,
  [ApiErrors.Payment.AmountMismatch]: 400,
  [ApiErrors.Payment.ProcessingFailed]: 402,
  [ApiErrors.Product.NotFound]: 404,
  [ApiErrors.Order.NotFound]: 404,
  [ApiErrors.User.NotFound]: 404,
  [ApiErrors.Server.InternalError]: 500,
  [ApiErrors.Server.RateLimitExceeded]: 429,
};
