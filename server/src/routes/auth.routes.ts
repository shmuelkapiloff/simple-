import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import {
  requireAuth,
  requireAdmin,
  authRateLimit,
} from "../middlewares/auth.middleware";

const router = Router();

/**
 * Authentication Routes
 * Base path: /api/auth
 */

// Public routes (no authentication requ;ired)
router.post("/register", authRateLimit, AuthController.register);
router.post("/login", authRateLimit, AuthController.login);
router.post("/logout", AuthController.logout);
router.get("/verify", AuthController.verifyToken)

// Protected routes (require authentication)
router.get("/profile", requireAuth, AuthController.getProfile);
router.put("/profile", requireAuth, AuthController.updateProfile);
router.put(
  "/password",
  requireAuth,
  authRateLimit,
  AuthController.changePassword
);
router.delete("/account", requireAuth, AuthController.deactivateAccount);

// Admin routes
router.get("/stats", requireAdmin, AuthController.getUserStats);

export { router as authRoutes };
