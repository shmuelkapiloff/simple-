import {
  UserModel,
  CreateUserInput,
  LoginInput,
  UpdateProfileInput,
} from "../models/user.model";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { logger } from "../utils/logger";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRE = process.env.JWT_EXPIRE || "7d";

export class AuthService {
  /**
   * ==========================================
   * 🔓 PUBLIC METHODS (No auth required)
   * ==========================================
   */

  /**
   * Register a new user
   */
  static async register(userData: CreateUserInput) {
    // Check if user already exists
    const existingUser = await UserModel.findOne({
      email: userData.email.toLowerCase(),
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Create new user
    const user = await UserModel.create({
      ...userData,
      email: userData.email.toLowerCase(),
    });

    // Generate JWT token
    const token = this.generateToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * Login user
   */
  static async login(credentials: LoginInput) {
    // Find user with password field
    const user = await UserModel.findOne({
      email: credentials.email.toLowerCase(),
      isActive: true,
    }).select("+password");

    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(credentials.password);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    // Generate token
    const token = this.generateToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * Send password reset email
   */
  static async forgotPassword(email: string) {
    const user = await UserModel.findOne({
      email: email.toLowerCase(),
      isActive: true,
    });

    if (!user) {
      // Don't reveal if user exists for security
      return {
        message: "If this email exists, a password reset link has been sent",
      };
    }

    const includeTokenInResponse = process.env.NODE_ENV !== "production";

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Save hashed token and expiry (1 hour)
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Send email
    const resetUrl = `${
      process.env.CLIENT_URL || "http://localhost:3000"
    }/reset-password/${resetToken}`;

    try {
      await this.sendResetEmail(user.email, resetUrl, user.name);
    } catch (error) {
      // Remove reset token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      // Do NOT fail the request: return generic success to avoid 500s and user enumeration
      // This is especially helpful in local/dev when SMTP creds are not valid
      logger.warn(
        { error },
        "Failed to send reset email, returning generic success"
      );
      return {
        message: "If this email exists, a password reset link has been sent",
        ...(includeTokenInResponse ? { resetToken } : {}),
      };
    }

    return {
      message: "Password reset link has been sent to your email",
      ...(includeTokenInResponse ? { resetToken } : {}),
    };
  }

  /**
   * Reset password with token
   */
  static async resetPassword(resetToken: string, newPassword: string) {
    // Hash the token from URL
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Find user with valid token
    const user = await UserModel.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: new Date() },
      isActive: true,
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) {
      throw new Error("Invalid or expired reset token");
    }

    // Validate new password
    if (newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.lastUpdated = new Date();
    await user.save();

    return {
      message: "Password has been reset successfully",
    };
  }

  /**
   * ==========================================
   * 🔐 PROTECTED METHODS (Auth required)
   * ==========================================
   */

  /**
   * Verify JWT token
   */
  static async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const user = await UserModel.findById(decoded.userId);

      if (!user || !user.isActive) {
        throw new Error("Invalid token");
      }

      return this.sanitizeUser(user);
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  /**
   * Get user profile
   */
  static async getProfile(userId: string) {
    const user = await UserModel.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    return this.sanitizeUser(user);
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, data: UpdateProfileInput) {
    const user = await UserModel.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    // Update fields
    if (data.name !== undefined) user.name = data.name;
    if (data.phone !== undefined) user.phone = data.phone;
    user.lastUpdated = new Date();

    await user.save();

    return this.sanitizeUser(user);
  }

  /**
   * ==========================================
   * 🛠️ HELPER METHODS
   * ==========================================
   */

  /**
   * Send password reset email
   */
  private static async sendResetEmail(
    to: string,
    resetUrl: string,
    name: string
  ) {
    /**
     * Dev-friendly fallback: if SMTP credentials are not configured, skip sending the email.
     * - Useful locally to avoid 500 errors when EMAIL_USER/PASSWORD are not set
     * - In production, prefer providing proper SMTP env vars and failing fast on startup if missing
     */
    // If SMTP credentials are not configured, skip sending and log for local/dev
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      logger.info("⚠️ EMAIL_USER/EMAIL_PASSWORD not set - skipping email send");
      logger.info(`Reset URL for ${to}: ${resetUrl}`);
      return;
    }

    // Configure email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Email HTML template
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background: #007bff; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>🔐 Password Reset Request</h2>
          <p>Hi ${name},</p>
          <p>You requested to reset your password. Click the button below to reset it:</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <p>Or copy this link: <br><code>${resetUrl}</code></p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request this, please ignore this email.</p>
          <div class="footer">
            <p>Simple Shop Team</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    await transporter.sendMail({
      from: `"Simple Shop" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Password Reset Request - Simple Shop",
      html,
    });
  }

  /**
   * Generate JWT token
   */
  private static generateToken(userId: string): string {
    return jwt.sign({ userId }, JWT_SECRET, {
      expiresIn: JWT_EXPIRE,
    } as jwt.SignOptions);
  }

  /**
   * Remove sensitive data from user object
   */
  private static sanitizeUser(user: any) {
    const userObject = user.toJSON();
    delete userObject.password;
    delete userObject.resetPasswordToken;
    delete userObject.resetPasswordExpires;
    return userObject;
  }
}

