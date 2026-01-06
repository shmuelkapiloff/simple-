import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

/**
 * Public routes (no authentication required)
 */

// POST /api/auth/register - Register new user
router.post("/register", AuthController.register);

// POST /api/auth/login - Login user
router.post("/login", AuthController.login);

// GET /api/auth/verify - Verify JWT token (requires auth)
router.get("/verify", authenticate, AuthController.verify);

// ⬅️ חדש - Password reset flow
// POST /api/auth/forgot-password - Request password reset
router.post("/forgot-password", AuthController.forgotPassword);

// POST /api/auth/reset-password/:token - Reset password with token
router.post("/reset-password/:token", AuthController.resetPassword);

/**
 * Protected routes (authentication required)
 */

// GET /api/auth/profile - Get user profile
router.get("/profile", authenticate, AuthController.getProfile);

// ⬅️ חדש - PUT /api/auth/profile - Update user profile
router.put("/profile", authenticate, AuthController.updateProfile);

// POST /api/auth/logout - Logout user
router.post("/logout", authenticate, AuthController.logout);

export default router;
