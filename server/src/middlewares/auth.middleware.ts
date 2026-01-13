import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { sendResponse, sendError } from "../utils/response";
import { track, log } from "../utils/quickLog";
import { logger } from "../utils/logger";

// Extend Express Request interface to include user data
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: any;
    }
  }
}

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
            "Access denied. Admin privileges required"
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

  /**
   * Rate limiting middleware for auth endpoints
   * Prevents brute force attacks
   */
  static createRateLimit() {
    const attempts = new Map<string, { count: number; resetTime: number }>();
    const MAX_ATTEMPTS = 5;
    const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

    return (req: Request, res: Response, next: NextFunction) => {
      const t = track("AuthMiddleware", "rateLimit");

      try {
        const clientIp = req.ip || req.connection.remoteAddress || "unknown";
        const currentTime = Date.now();

        // Clean up expired entries
        for (const [ip, data] of attempts.entries()) {
          if (currentTime > data.resetTime) {
            attempts.delete(ip);
          }
        }

        // Get current attempt data
        const attemptData = attempts.get(clientIp);

        if (!attemptData) {
          // First attempt
          attempts.set(clientIp, {
            count: 1,
            resetTime: currentTime + WINDOW_MS,
          });

          t.success({ ip: clientIp, attempt: 1 });
          return next();
        }

        // Check if rate limit exceeded
        if (attemptData.count >= MAX_ATTEMPTS) {
          const remainingTime = Math.ceil(
            (attemptData.resetTime - currentTime) / 60000
          );

          logger.info(`⚠️ Rate limit exceeded for IP: ${clientIp}`);
          t.error(new Error("Rate limit exceeded"));

          return sendError(
            res,
            429,
            `Too many attempts. Try again in ${remainingTime} minutes`
          );
        }

        // Increment attempt count
        attemptData.count++;
        attempts.set(clientIp, attemptData);

        logger.info(
          `⚠️ Auth attempt ${attemptData.count}/${MAX_ATTEMPTS} for IP: ${clientIp}`
        );
        t.success({ ip: clientIp, attempt: attemptData.count });

        next();
      } catch (error: any) {
        t.error(error);
        // If rate limiting fails, allow the request
        next();
      }
    };
  }
}

// Export individual middleware functions for easier use
export const requireAuth = AuthMiddleware.requireAuth;
export const requireAdmin = AuthMiddleware.requireAdmin;
export const authRateLimit = AuthMiddleware.createRateLimit();

// Alias for backward compatibility
export const authenticate = AuthMiddleware.requireAuth;
