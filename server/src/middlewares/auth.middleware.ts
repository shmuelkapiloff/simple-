import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { sendError } from "../utils/response";
import { logger, track } from "../utils/logger";
import "../types/express";

export class AuthMiddleware {
  /**
   * Middleware to check if user is authenticated
   * Looks for JWT token in Authorization header or cookies
   */
  static async requireAuth(req: Request, res: Response, next: NextFunction) {
    const t = track("AuthMiddleware", "requireAuth");

    try {
      // Get token from Authorization header or cookies
      let token = "";

      // Check Authorization header first (Bearer token)
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
      // Check cookies if no Authorization header
      else if (req.cookies?.token) {
        token = req.cookies.token;
      }

      if (!token) {
        logger.info("❌ No token provided in request");
        return sendError(res, 401, "Access denied. No token provided");
      }

      // Verify token and get user
      const user = await AuthService.verifyToken(token);

      // Attach user info to request object
      req.userId = user._id.toString(); // Ensure string conversion
      req.user = user;

      logger.info(`✅ User authenticated: ${user.email}`);

      next();
    } catch (error: any) {
      t.error(error);
      logger.info("❌ Authentication failed:", error.message);

      return sendError(res, 401, "Access denied. Invalid token");
    }
  }

  /**
   * Admin-only middleware
   * Requires authentication and admin role (when implemented)
   */
  static async requireAdmin(req: Request, res: Response, next: NextFunction) {
    const t = track("AuthMiddleware", "requireAdmin");

    try {
      // First check if user is authenticated, then enforce admin role
      await AuthMiddleware.requireAuth(req, res, () => {
        if (!req.user || req.user.role !== "admin") {
          logger.info("❌ Admin access denied - not an admin user");
          return sendError(
            res,
            403,
            "Access denied. Admin privileges required",
          );
        }

        logger.info(`🔐 Admin access granted to: ${req.user?.email}`);
        t.success({ userId: req.userId, admin: true });
        next();
      });
    } catch (error: any) {
      t.error(error);
      return sendError(res, 403, "Access denied. Admin privileges required");
    }
  }
}

// Export individual middleware functions for easier use
export const requireAuth = AuthMiddleware.requireAuth;
export const requireAdmin = AuthMiddleware.requireAdmin;

// Alias for backward compatibility
export const authenticate = AuthMiddleware.requireAuth;
