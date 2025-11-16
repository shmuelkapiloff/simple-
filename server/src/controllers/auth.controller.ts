import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { CreateUserInput, LoginInput } from "../models/user.model";
import { sendResponse, sendError } from "../utils/response";
import { track } from "../utils/quickLog";

export class AuthController {
  /**
   * Register new user
   * POST /api/auth/register
   */
  static async register(req: Request, res: Response) {
    const t = track("AuthController", "register");

    try {
      const { email, password, name }: CreateUserInput = req.body;

      // Validate required fields
      if (!email || !password || !name) {
        return sendError(res, 400, "Email, password, and name are required");
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return sendError(res, 400, "Please provide a valid email address");
      }

      // Validate name length
      if (name.trim().length < 2) {
        return sendError(res, 400, "Name must be at least 2 characters long");
      }

      // Register user
      const result = await AuthService.register({ email, password, name });

      console.log("✅ User registered successfully:", email);

      // Set JWT cookie (optional - for browser sessions)
      res.cookie("token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: "strict",
      });

      t.success({ userId: result.user._id });

      return sendResponse(res, 201, "User registered successfully", {
        user: result.user,
        token: result.token,
      });
    } catch (error: any) {
      t.error(error);
      console.log("❌ Registration failed:", error.message);

      if (error.message.includes("already exists")) {
        return sendError(res, 409, error.message);
      }

      return sendError(res, 400, error.message);
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response) {
    const t = track("AuthController", "login");

    try {
      const { email, password }: LoginInput = req.body;

      // Validate required fields
      if (!email || !password) {
        return sendError(res, 400, "Email and password are required");
      }

      // Login user
      const result = await AuthService.login({ email, password });

      console.log("✅ User logged in successfully:", email);

      // Set JWT cookie
      res.cookie("token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: "strict",
      });

      t.success({ userId: result.user._id });

      return sendResponse(res, 200, "Login successful", {
        user: result.user,
        token: result.token,
      });
    } catch (error: any) {
      t.error(error);
      console.log("❌ Login failed:", error.message);

      return sendError(res, 401, "Invalid email or password");
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  static async logout(req: Request, res: Response) {
    const t = track("AuthController", "logout");

    try {
      // Clear JWT cookie
      res.clearCookie("token");

      console.log("✅ User logged out successfully");
      t.success();

      return sendResponse(res, 200, "Logout successful");
    } catch (error: any) {
      t.error(error);
      return sendError(res, 500, "Logout failed");
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/profile
   */
  static async getProfile(req: Request, res: Response) {
    const t = track("AuthController", "getProfile");

    try {
      const userId = (req as any).userId; // Set by auth middleware

      if (!userId) {
        return sendError(res, 401, "User not authenticated");
      }

      const user = await AuthService.getProfile(userId);

      t.success({ userId });

      return sendResponse(res, 200, "Profile retrieved successfully", { user });
    } catch (error: any) {
      t.error(error);
      return sendError(res, 404, "User not found");
    }
  }

  /**
   * Update user profile
   * PUT /api/auth/profile
   */
  static async updateProfile(req: Request, res: Response) {
    const t = track("AuthController", "updateProfile");

    try {
      const userId = (req as any).userId;
      const { name, email } = req.body;

      if (!userId) {
        return sendError(res, 401, "User not authenticated");
      }

      // Validate updates
      if (!name && !email) {
        return sendError(
          res,
          400,
          "At least one field (name or email) is required"
        );
      }

      if (name && name.trim().length < 2) {
        return sendError(res, 400, "Name must be at least 2 characters long");
      }

      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return sendError(res, 400, "Please provide a valid email address");
        }
      }

      const updatedUser = await AuthService.updateProfile(userId, {
        name,
        email,
      });

      console.log("✅ Profile updated successfully:", updatedUser.email);
      t.success({ userId });

      return sendResponse(res, 200, "Profile updated successfully", {
        user: updatedUser,
      });
    } catch (error: any) {
      t.error(error);

      if (error.message.includes("already taken")) {
        return sendError(res, 409, error.message);
      }

      return sendError(res, 400, error.message);
    }
  }

  /**
   * Change password
   * PUT /api/auth/password
   */
  static async changePassword(req: Request, res: Response) {
    const t = track("AuthController", "changePassword");

    try {
      const userId = (req as any).userId;
      const { currentPassword, newPassword } = req.body;

      if (!userId) {
        return sendError(res, 401, "User not authenticated");
      }

      // Validate required fields
      if (!currentPassword || !newPassword) {
        return sendError(
          res,
          400,
          "Current password and new password are required"
        );
      }

      // Validate new password length
      if (newPassword.length < 6) {
        return sendError(
          res,
          400,
          "New password must be at least 6 characters long"
        );
      }

      await AuthService.changePassword(userId, currentPassword, newPassword);

      console.log("✅ Password changed successfully for user:", userId);
      t.success({ userId });

      return sendResponse(res, 200, "Password changed successfully");
    } catch (error: any) {
      t.error(error);

      if (error.message.includes("Current password is incorrect")) {
        return sendError(res, 400, error.message);
      }

      return sendError(res, 400, error.message);
    }
  }

  /**
   * Deactivate account
   * DELETE /api/auth/account
   */
  static async deactivateAccount(req: Request, res: Response) {
    const t = track("AuthController", "deactivateAccount");

    try {
      const userId = (req as any).userId;

      if (!userId) {
        return sendError(res, 401, "User not authenticated");
      }

      await AuthService.deactivateAccount(userId);

      // Clear JWT cookie
      res.clearCookie("token");

      console.log("✅ Account deactivated successfully:", userId);
      t.success({ userId });

      return sendResponse(res, 200, "Account deactivated successfully");
    } catch (error: any) {
      t.error(error);
      return sendError(res, 400, error.message);
    }
  }

  /**
   * Verify token and get user info
   * GET /api/auth/verify
   */
  static async verifyToken(req: Request, res: Response) {
    const t = track("AuthController", "verifyToken");

    try {
      const token =
        req.headers.authorization?.split(" ")[1] || req.cookies?.token;

      if (!token) {
        return sendError(res, 401, "No token provided");
      }

      const user = await AuthService.verifyToken(token);

      t.success({ userId: user._id });

      return sendResponse(res, 200, "Token is valid", { user });
    } catch (error: any) {
      t.error(error);
      return sendError(res, 401, "Invalid or expired token");
    }
  }

  /**
   * Get user statistics (for admin)
   * GET /api/auth/stats
   */
  static async getUserStats(req: Request, res: Response) {
    const t = track("AuthController", "getUserStats");

    try {
      const stats = await AuthService.getUserStats();

      t.success();

      return sendResponse(res, 200, "User statistics retrieved", { stats });
    } catch (error: any) {
      t.error(error);
      return sendError(res, 500, "Failed to retrieve statistics");
    }
  }
}
