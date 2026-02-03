import rateLimit from "express-rate-limit";
import { log } from "../utils/logger";
import {
  AUTH_RATE_LIMIT,
  WEBHOOK_RATE_LIMIT,
  API_RATE_LIMIT,
  PUBLIC_READ_RATE_LIMIT,
  STRIPE_IPS,
} from "../config/constants";

/**
 * Authentication Rate Limiter
 * Protects login, register, and password reset endpoints from brute force attacks
 */
export const authRateLimiter = rateLimit({
  windowMs: AUTH_RATE_LIMIT.windowMs,
  max: AUTH_RATE_LIMIT.maxRequests,
  message: {
    success: false,
    message: "Too many attempts, please try again later",
    code: "RATE_LIMITED",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Webhook Rate Limiter
 * Protects webhook endpoint from DoS attacks
 * Skips Stripe IPs in production
 */
export const webhookRateLimiter = rateLimit({
  windowMs: WEBHOOK_RATE_LIMIT.windowMs,
  max: WEBHOOK_RATE_LIMIT.maxRequests,
  message: {
    success: false,
    error: "TOO_MANY_REQUESTS",
    message: "Too many webhook requests from this IP, please try again later",
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req, res) => {
    log.warn("⚠️ Rate limit exceeded for webhook", {
      ip: req.ip,
      path: req.path,
    });

    res.status(429).json({
      success: false,
      error: "TOO_MANY_REQUESTS",
      message: "Too many webhook requests from this IP, please try again later",
    });
  },
  // Skip rate limiting for Stripe IPs (for production)
  skip: (req) => {
    // In production, skip rate limiting for known Stripe IPs
    if (process.env.NODE_ENV === "production") {
      return STRIPE_IPS.includes(req.ip || "");
    }

    return false;
  },
});

/**
 * General API Rate Limiter
 * Applies to general API endpoints that don't need special protection
 */
export const apiRateLimiter = rateLimit({
  windowMs: API_RATE_LIMIT.windowMs,
  max: API_RATE_LIMIT.maxRequests,
  message: {
    success: false,
    error: "TOO_MANY_REQUESTS",
    message: "Too many requests from this IP, please slow down",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Public Read Rate Limiter
 * Applies to public GET endpoints (products listing, etc.)
 */
export const publicReadRateLimiter = rateLimit({
  windowMs: PUBLIC_READ_RATE_LIMIT.windowMs,
  max: PUBLIC_READ_RATE_LIMIT.maxRequests,
  message: {
    success: false,
    message: "Too many requests, slow down",
    code: "RATE_LIMITED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
