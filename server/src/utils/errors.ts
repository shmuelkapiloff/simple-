/**
 * Centralized Error Hierarchy for Professional Error Handling
 *
 * This module defines all application-specific error types with:
 * - Proper HTTP status codes
 * - Consistent error messages
 * - Structured logging support
 * - Type safety across the application
 *
 * Usage Pattern:
 * ──────────────
 *   throw new AppError("User not found", 404);
 *   throw new ValidationError("Email already exists", "email");
 *   throw new AuthError("Invalid credentials", 401);
 *   throw new PaymentError("Payment declined", "payment_declined");
 */

/**
 * Base Application Error Class
 * All custom errors extend this for consistent handling
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * Serialize error for API response
   */
  toJSON() {
    return {
      success: false,
      error: this.code || this.name,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}

/**
 * Validation Error (400 Bad Request)
 * Thrown when input validation fails
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    public field?: string,
    code?: string,
  ) {
    super(message, 400, code || "VALIDATION_ERROR");
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      field: this.field,
    };
  }
}

/**
 * Not Found Error (404 Not Found)
 * Thrown when a resource cannot be found
 */
export class NotFoundError extends AppError {
  constructor(
    public resource: string,
    public id?: string,
    code?: string,
  ) {
    const message = id
      ? `${resource} with id "${id}" not found`
      : `${resource} not found`;

    super(message, 404, code || "NOT_FOUND");
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      resource: this.resource,
      id: this.id,
    };
  }
}

/**
 * Authentication Error (401 Unauthorized)
 * Thrown when authentication fails or token is invalid
 */
export class AuthError extends AppError {
  constructor(message: string = "Unauthorized", code?: string) {
    super(message, 401, code || "UNAUTHORIZED");
    this.name = "AuthError";
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

/**
 * Authorization Error (403 Forbidden)
 * Thrown when user lacks required permissions
 */
export class AuthorizationError extends AppError {
  constructor(
    message: string = "Forbidden - insufficient permissions",
    code?: string,
  ) {
    super(message, 403, code || "FORBIDDEN");
    this.name = "AuthorizationError";
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Conflict Error (409 Conflict)
 * Thrown when a resource already exists or operation conflicts
 */
export class ConflictError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 409, code || "CONFLICT");
    this.name = "ConflictError";
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Payment Error (402 Payment Required / 400 Bad Request)
 * Thrown when payment processing fails
 */
export class PaymentError extends AppError {
  constructor(
    message: string,
    public paymentCode?: string,
    statusCode: number = 400,
    code?: string,
  ) {
    super(message, statusCode, code || "PAYMENT_ERROR");
    this.name = "PaymentError";
    Object.setPrototypeOf(this, PaymentError.prototype);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      paymentCode: this.paymentCode,
    };
  }
}

/**
 * Database Error (500 Internal Server Error)
 * Thrown when database operations fail
 */
export class DatabaseError extends AppError {
  constructor(
    message: string,
    public operation?: string,
    code?: string,
  ) {
    super(message, 500, code || "DATABASE_ERROR");
    this.name = "DatabaseError";
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      operation: this.operation,
    };
  }
}

/**
 * External Service Error (503 Service Unavailable / 500)
 * Thrown when external services (Stripe, etc.) fail
 */
export class ExternalServiceError extends AppError {
  constructor(
    public service: string,
    message: string,
    statusCode: number = 503,
    code?: string,
  ) {
    super(
      `${service} error: ${message}`,
      statusCode,
      code || "EXTERNAL_SERVICE_ERROR",
    );
    this.name = "ExternalServiceError";
    Object.setPrototypeOf(this, ExternalServiceError.prototype);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      service: this.service,
    };
  }
}

/**
 * Rate Limit Error (429 Too Many Requests)
 * Thrown when rate limit is exceeded
 */
export class RateLimitError extends AppError {
  constructor(
    message: string = "Too many requests, please try again later",
    public retryAfter?: number,
    code?: string,
  ) {
    super(message, 429, code || "RATE_LIMIT_EXCEEDED");
    this.name = "RateLimitError";
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter,
    };
  }
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if error is a specific error type
 */
export function isErrorType<T extends AppError>(
  error: unknown,
  ErrorClass: new (...args: any[]) => T,
): error is T {
  return error instanceof ErrorClass;
}

/**
 * Extract status code from any error
 * Defaults to 500 for unknown errors
 */
export function getStatusCode(error: unknown): number {
  if (isAppError(error)) {
    return error.statusCode;
  }
  if (error instanceof Error) {
    // Check for common Node.js errors
    if ("statusCode" in error) {
      return (error as any).statusCode;
    }
  }
  return 500;
}

/**
 * Extract error message from any error
 * Provides sensible defaults
 */
export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unexpected error occurred";
}

/**
 * Extract error code from any error
 * Used for structured logging and client handling
 */
export function getErrorCode(error: unknown): string {
  if (isAppError(error)) {
    return error.code || error.name;
  }
  if (error instanceof Error) {
    return error.name || "UNKNOWN_ERROR";
  }
  return "UNKNOWN_ERROR";
}
