import rateLimit from "express-rate-limit";

// Rate limiter for authentication endpoints (login, register, forgot/reset)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 6, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: "Too many attempts, please try again later",
    code: "RATE_LIMITED",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Generic limiter for public GET endpoints (optional to use as needed)
export const publicReadRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 reads per minute per IP
  message: {
    success: false,
    message: "Too many requests, slow down",
    code: "RATE_LIMITED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
