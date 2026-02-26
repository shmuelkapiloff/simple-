import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "../validators/auth.validator";
import { ValidationError, UnauthorizedError, log } from "../utils/asyncHandler";

export class AuthController {
  /**
   * Register new user
   * POST /api/auth/register
   */
  static async register(req: Request, res: Response) {
    const validated = registerSchema.parse(req.body);

    log.info("User registration attempt", { email: validated.email });
    const result = await AuthService.register(validated);

    res.status(201).json({
      success: true,
      data: result,
      message: "User registered successfully",
    });
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response) {
    const validated = loginSchema.parse(req.body);

    log.info("User login attempt", { email: validated.email });
    const result = await AuthService.login(validated);

    res.status(200).json({
      success: true,
      data: result,
      message: "Login successful",
    });
  }

  /**
   * Request password reset
   * POST /api/auth/forgot-password
   */
  static async forgotPassword(req: Request, res: Response) {
    const validated = forgotPasswordSchema.parse(req.body);

    log.info("Password reset requested", { email: validated.email });
    const result = await AuthService.forgotPassword(validated.email);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  }

  /**
   * Verify token
   * GET /api/auth/verify
   */
  static async verify(req: Request, res: Response) {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new UnauthorizedError("No token provided");
    }

    const user = await AuthService.verifyToken(token);

    res.status(200).json({
      success: true,
      data: { user },
    });
  }

  /**
   * Get user profile
   * GET /api/auth/profile
   */
  static async getProfile(req: Request, res: Response) {
    const userId = req.userId;

    if (!userId) {
      throw new UnauthorizedError();
    }

    const user = await AuthService.getProfile(userId);
    log.info("Profile retrieved", { userId });

    res.status(200).json({
      success: true,
      data: { user },
    });
  }

  /**
   * Update user profile
   * PUT /api/auth/profile
   */
  static async updateProfile(req: Request, res: Response) {
    const userId = req.userId;
    const validated = updateProfileSchema.parse(req.body);

    if (!userId) {
      throw new UnauthorizedError();
    }

    log.info("Profile update requested", { userId });
    const user = await AuthService.updateProfile(userId, validated);

    res.status(200).json({
      success: true,
      data: { user },
      message: "Profile updated successfully",
    });
  }

  /**
   * Reset password with token
   * POST /api/auth/reset-password/:token
   */
  static async resetPassword(req: Request, res: Response) {
    const { token } = req.params;
    const validated = resetPasswordSchema.parse(req.body);

    if (!token) {
      throw new ValidationError("Reset token is required");
    }

    log.info("Password reset initiated");
    const result = await AuthService.resetPassword(token, validated.password);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh
   * Body: { refreshToken }
   *
   * Exchanges a long-lived refresh token for a new short-lived access token
   * Useful when access token (15 min) expires but refresh token (7 days) is still valid
   */
  static async refreshToken(req: Request, res: Response) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    const newAccessToken = await AuthService.refreshAccessToken(refreshToken);

    res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",
      data: {
        token: newAccessToken, // New short-lived access token
        refreshToken, // Same refresh token (can be reused)
      },
    });
  }

  /**
   * Logout user
   * POST /api/auth/logout
   * Increments tokenVersion to instantly invalidate all existing tokens
   */
  static async logout(req: Request, res: Response) {
    const userId = req.userId;

    if (!userId) {
      throw new UnauthorizedError();
    }

    const result = await AuthService.logout(userId);
    log.info("User logout - all tokens revoked", { userId });

    res.status(200).json({
      success: true,
      message: result.message,
    });
  }

  /**
   * Change password (authenticated)
   * POST /api/auth/change-password
   */
  static async changePassword(req: Request, res: Response) {
    const userId = req.userId;
    const validated = changePasswordSchema.parse(req.body);

    if (!userId) {
      throw new UnauthorizedError();
    }

    log.info("Password change requested", { userId });
    const result = await AuthService.changePassword(
      userId,
      validated.currentPassword,
      validated.newPassword,
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  }
}
