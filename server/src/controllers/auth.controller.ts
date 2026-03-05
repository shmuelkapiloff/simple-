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
import {
  asyncHandler,
  ValidationError,
  UnauthorizedError,
} from "../utils/asyncHandler";

export class AuthController {
  /** POST /api/auth/register */
  static register = asyncHandler(async (req: Request, res: Response) => {
    const validated = registerSchema.parse(req.body);
    const result = await AuthService.register(validated);
    res.status(201).json({
      success: true,
      data: result,
      message: "User registered successfully",
    });
  });

  /** POST /api/auth/login */
  static login = asyncHandler(async (req: Request, res: Response) => {
    const validated = loginSchema.parse(req.body);
    const result = await AuthService.login(validated);
    res.status(200).json({
      success: true,
      data: result,
      message: "Login successful",
    });
  });

  /** POST /api/auth/forgot-password */
  static forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const validated = forgotPasswordSchema.parse(req.body);
    const result = await AuthService.forgotPassword(validated.email);
    res.status(200).json({ success: true, message: result.message });
  });

  /** GET /api/auth/verify */
  static verify = asyncHandler(async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) throw new UnauthorizedError("No token provided");
    const user = await AuthService.verifyToken(token);
    res.status(200).json({ success: true, data: { user } });
  });

  /** GET /api/auth/profile */
  static getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    if (!userId) throw new UnauthorizedError();
    const user = await AuthService.getProfile(userId);
    res.status(200).json({ success: true, data: { user } });
  });

  /** PUT /api/auth/profile */
  static updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    const validated = updateProfileSchema.parse(req.body);
    if (!userId) throw new UnauthorizedError();
    const user = await AuthService.updateProfile(userId, validated);
    res.status(200).json({
      success: true,
      data: { user },
      message: "Profile updated successfully",
    });
  });

  /** POST /api/auth/reset-password/:token */
  static resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params;
    const validated = resetPasswordSchema.parse(req.body);
    if (!token) throw new ValidationError("Reset token is required");
    const result = await AuthService.resetPassword(token, validated.password);
    res.status(200).json({ success: true, message: result.message });
  });

  /** POST /api/auth/refresh */
  static refreshToken = asyncHandler(async (req: Request, res: Response) => {
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
      data: { token: newAccessToken, refreshToken },
    });
  });

  /** POST /api/auth/logout */
  static logout = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    if (!userId) throw new UnauthorizedError();
    const result = await AuthService.logout(userId);
    res.status(200).json({ success: true, message: result.message });
  });

  /** POST /api/auth/change-password */
  static changePassword = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    const validated = changePasswordSchema.parse(req.body);
    if (!userId) throw new UnauthorizedError();
    const result = await AuthService.changePassword(
      userId,
      validated.currentPassword,
      validated.newPassword,
    );
    res.status(200).json({ success: true, message: result.message });
  });
}
