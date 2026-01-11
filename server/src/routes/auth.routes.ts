import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { authRateLimiter } from "../middlewares/rateLimit.middleware";

const router = Router();

/**
 * Public routes (no authentication required)
 */

// POST /api/auth/register - Register new user
router.post(
  "/register",
  authRateLimiter,
  asyncHandler(AuthController.register)
);

// POST /api/auth/login - Login user
router.post("/login", authRateLimiter, asyncHandler(AuthController.login));

// POST /api/auth/forgot-password - Request password reset
router.post(
  "/forgot-password",
  authRateLimiter,
  asyncHandler(AuthController.forgotPassword)
);

// POST /api/auth/reset-password/:token - Reset password with token
router.post(
  "/reset-password/:token",
  authRateLimiter,
  asyncHandler(AuthController.resetPassword)
);

/**
 * Protected routes (authentication required)
 */

// GET /api/auth/verify - Verify JWT token (requires auth)
router.get("/verify", authenticate, asyncHandler(AuthController.verify));

// GET /api/auth/profile - Get user profile
router.get("/profile", authenticate, asyncHandler(AuthController.getProfile));

// PUT /api/auth/profile - Update user profile
router.put(
  "/profile",
  authenticate,
  asyncHandler(AuthController.updateProfile)
);

// POST /api/auth/logout - Logout user
router.post("/logout", authenticate, asyncHandler(AuthController.logout));

export default router;
