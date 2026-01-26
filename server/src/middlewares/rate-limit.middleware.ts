import rateLimit from "express-rate-limit";
import { log } from "../utils/logger";

/**
 * Rate limiting middleware for webhook endpoint
 * Protects against DoS attacks
 */
export const webhookRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per windowMs per IP
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
  // Skip rate limiting for Stripe IPs (optional - for production)
  skip: (req) => {
    // Stripe webhook IPs: https://stripe.com/docs/ips
    const stripeIPs = [
      "3.18.12.63",
      "3.130.192.231",
      "13.235.14.237",
      "13.235.122.149",
      "18.211.135.69",
      "35.154.171.200",
      "52.15.183.38",
      "54.88.130.119",
      "54.88.130.237",
      "54.187.174.169",
      "54.187.205.235",
      "54.187.216.72",
    ];

    // In production, skip rate limiting for known Stripe IPs
    if (process.env.NODE_ENV === "production") {
      return stripeIPs.includes(req.ip || "");
    }

    return false;
  },
});

/**
 * Stricter rate limiter for general API endpoints
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Max 200 requests per windowMs per IP
  message: {
    success: false,
    error: "TOO_MANY_REQUESTS",
    message: "Too many requests from this IP, please slow down",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
