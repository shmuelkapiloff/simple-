import jwt from "jsonwebtoken";
import {
  UserModel,
  IUser,
  CreateUserInput,
  LoginInput,
  UserResponse,
} from "../models/user.model";
import { track } from "../utils/quickLog";
import { env } from "../config/env";

export class AuthService {
  private static readonly JWT_SECRET = env.JWT_SECRET;
  private static readonly JWT_EXPIRES_IN = "7d"; // 7 days

  /**
   * Register a new user
   */
  static async register(
    userData: CreateUserInput
  ): Promise<{ user: UserResponse; token: string }> {
    const t = track("AuthService", "register");

    try {
      console.log("🔐 Registering new user:", userData.email);

      // Check if user already exists
      const existingUser = await UserModel.findOne({
        email: userData.email.toLowerCase(),
      });

      if (existingUser) {
        throw new Error("User already exists with this email");
      }

      // Validate password strength
      if (userData.password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      // Create new user (password will be hashed automatically by pre-save middleware)
      const user = new UserModel({
        email: userData.email.toLowerCase(),
        password: userData.password,
        name: userData.name.trim(),
      });

      await user.save();
      console.log("✅ User created successfully:", user.email);

      // Generate JWT token
      const token = this.generateToken(user._id);

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Return user data without password
      const userResponse: UserResponse = {
        _id: user._id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLogin,
      };

      t.success({ userId: user._id });
      return { user: userResponse, token };
    } catch (error) {
      t.error(error);
      throw error;
    }
  }

  /**
   * Login existing user
   */
  static async login(
    loginData: LoginInput
  ): Promise<{ user: UserResponse; token: string }> {
    const t = track("AuthService", "login");

    try {
      console.log("🔐 User attempting login:", loginData.email);

      // Find user and include password for comparison
      const user = await UserModel.findOne({
        email: loginData.email.toLowerCase(),
        isActive: true,
      }).select("+password");

      if (!user) {
        throw new Error("Invalid email or password");
      }

      // Compare password
      const isPasswordValid = await user.comparePassword(loginData.password);
      if (!isPasswordValid) {
        console.log("❌ Invalid password attempt for:", loginData.email);
        throw new Error("Invalid email or password");
      }

      console.log("✅ User login successful:", user.email);

      // Generate JWT token
      const token = this.generateToken(user._id);

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Return user data without password
      const userResponse: UserResponse = {
        _id: user._id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLogin,
      };

      t.success({ userId: user._id });
      return { user: userResponse, token };
    } catch (error) {
      t.error(error);
      throw error;
    }
  }

  /**
   * Verify JWT token and get user
   */
  static async verifyToken(token: string): Promise<UserResponse> {
    const t = track("AuthService", "verifyToken");

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, this.JWT_SECRET) as { userId: string };

      // Find user by ID
      const user = await UserModel.findById(decoded.userId);
      if (!user) {
        throw new Error("User not found or inactive");
      }

      // Return user data
      const userResponse: UserResponse = {
        _id: user._id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLogin,
      };

      t.success({ userId: user._id });
      return userResponse;
    } catch (error) {
      t.error(error);
      throw new Error("Invalid or expired token");
    }
  }

  /**
   * Get user profile by ID
   */
  static async getProfile(userId: string): Promise<UserResponse> {
    const t = track("AuthService", "getProfile");

    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const userResponse: UserResponse = {
        _id: user._id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLogin,
      };

      t.success({ userId });
      return userResponse;
    } catch (error) {
      t.error(error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    updates: { name?: string; email?: string }
  ): Promise<UserResponse> {
    const t = track("AuthService", "updateProfile");

    try {
      console.log("📝 Updating user profile:", userId);

      // If updating email, check if it's already taken
      if (updates.email) {
        const existingUser = await UserModel.findOne({
          email: updates.email.toLowerCase(),
          _id: { $ne: userId }, // Exclude current user
        });

        if (existingUser) {
          throw new Error("Email already taken by another user");
        }
      }

      // Update user
      const user = await UserModel.findByIdAndUpdate(
        userId,
        {
          ...(updates.name && { name: updates.name.trim() }),
          ...(updates.email && { email: updates.email.toLowerCase() }),
        },
        { new: true, runValidators: true }
      );

      if (!user) {
        throw new Error("User not found");
      }

      console.log("✅ User profile updated:", user.email);

      const userResponse: UserResponse = {
        _id: user._id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLogin,
      };

      t.success({ userId });
      return userResponse;
    } catch (error) {
      t.error(error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const t = track("AuthService", "changePassword");

    try {
      console.log("🔒 Changing password for user:", userId);

      // Find user with password
      const user = await UserModel.findById(userId).select("+password");
      if (!user) {
        throw new Error("User not found");
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(
        currentPassword
      );
      if (!isCurrentPasswordValid) {
        throw new Error("Current password is incorrect");
      }

      // Validate new password
      if (newPassword.length < 6) {
        throw new Error("New password must be at least 6 characters long");
      }

      // Update password (will be hashed by pre-save middleware)
      user.password = newPassword;
      await user.save();

      console.log("✅ Password changed successfully for:", user.email);
      t.success({ userId });
    } catch (error) {
      t.error(error);
      throw error;
    }
  }

  /**
   * Deactivate user account
   */
  static async deactivateAccount(userId: string): Promise<void> {
    const t = track("AuthService", "deactivateAccount");

    try {
      console.log("⚠️ Deactivating user account:", userId);

      const user = await UserModel.findByIdAndUpdate(
        userId,
        { isActive: false },
        { new: true }
      );

      if (!user) {
        throw new Error("User not found");
      }

      console.log("✅ Account deactivated:", user.email);
      t.success({ userId });
    } catch (error) {
      t.error(error);
      throw error;
    }
  }

  /**
   * Generate JWT token
   */
  private static generateToken(userId: string): string {
    return jwt.sign({ userId }, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
      issuer: "techbasket-api",
    });
  }

  /**
   * Get user statistics (for admin)
   */
  static async getUserStats() {
    const t = track("AuthService", "getUserStats");

    try {
      const stats = await UserModel.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: {
              $sum: {
                $cond: [{ $eq: ["$isActive", true] }, 1, 0],
              },
            },
            recentUsers: {
              $sum: {
                $cond: [
                  {
                    $gte: [
                      "$createdAt",
                      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]);

      const result = stats[0] || {
        totalUsers: 0,
        activeUsers: 0,
        recentUsers: 0,
      };

      t.success(result);
      return result;
    } catch (error) {
      t.error(error);
      throw error;
    }
  }
}
