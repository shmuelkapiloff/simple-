import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { CreateUserInput, LoginInput, UpdateProfileInput } from "../models/user.model";

export class AuthController {
  /**
   * Register new user
   * POST /api/auth/register
   */
  static async register(req: Request, res: Response) {
    try {
      const userData: CreateUserInput = req.body;

      // Validate required fields
      if (!userData.email || !userData.password || !userData.name) {
        return res.status(400).json({
          success: false,
          message: "Email, password, and name are required",
        });
      }

      const result = await AuthService.register(userData);

      res.status(201).json({
        success: true,
        data: result,
        message: "User registered successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Registration failed",
      });
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response) {
    try {
      const credentials: LoginInput = req.body;

      // Validate required fields
      if (!credentials.email || !credentials.password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required",
        });
      }

      const result = await AuthService.login(credentials);

      res.status(200).json({
        success: true,
        data: result,
        message: "Login successful",
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || "Login failed",
      });
    }
  }

  /**
   * Verify token
   * GET /api/auth/verify
   */
  static async verify(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "No token provided",
        });
      }

      const user = await AuthService.verifyToken(token);

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || "Token verification failed",
      });
    }
  }

  /**
   * Get user profile
   * GET /api/auth/profile
   */
  static async getProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).userId; // From auth middleware

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      const user = await AuthService.getProfile(userId);

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || "User not found",
      });
    }
  }

  // ⬅️ חדש - עדכון פרופיל
  /**
   * Update user profile
   * PUT /api/auth/profile
   */
  static async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const data: UpdateProfileInput = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      // Validate at least one field is provided
      if (!data.name && !data.phone) {
        return res.status(400).json({
          success: false,
          message: "At least one field (name or phone) is required",
        });
      }

      const user = await AuthService.updateProfile(userId, data);

      res.status(200).json({
        success: true,
        data: { user },
        message: "Profile updated successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Profile update failed",
      });
    }
  }

  // ⬅️ חדש - בקשה לאיפוס סיסמה
  /**
   * Request password reset
   * POST /api/auth/forgot-password
   */
  static async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      const result = await AuthService.forgotPassword(email);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to send reset email",
      });
    }
  }

  // ⬅️ חדש - איפוס סיסמה בפועל
  /**
   * Reset password with token
   * POST /api/auth/reset-password/:token
   */
  static async resetPassword(req: Request, res: Response) {
    try {
      const { token } = req.params;
      const { newPassword } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: "Reset token is required",
        });
      }

      if (!newPassword) {
        return res.status(400).json({
          success: false,
          message: "New password is required",
        });
      }

      const result = await AuthService.resetPassword(token, newPassword);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Password reset failed",
      });
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  static async logout(req: Request, res: Response) {
    try {
      // In a stateless JWT system, logout is handled client-side
      // Server can optionally blacklist the token here
      
      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Logout failed",
      });
    }
  }
}