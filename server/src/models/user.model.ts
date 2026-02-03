import { Schema, model, Document } from "mongoose";
import bcrypt from "bcryptjs";

// Interface for User document
export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  name: string;
  phone?: string; // ⬅️ חדש
  role: "user" | "admin"; // ⬅️ חדש

  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  lastLogin?: Date;
  lastUpdated?: Date; // ⬅️ חדש

  // Password reset fields ⬅️ חדש
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;

  // Account lockout fields ⬅️ חדש - אבטחה
  failedLoginAttempts: number;
  lockedUntil?: Date | null;

  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  toJSON(): any;
}

// User Schema
const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false, // Don't include password in queries by default
    },

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    // ⬅️ חדש - שדות נוספים
    phone: {
      type: String,
      trim: true,
      default: "",
      match: [/^[0-9\-\+\(\)\s]*$/, "Please provide a valid phone number"],
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLogin: {
      type: Date,
    },

    lastUpdated: {
      type: Date,
      default: Date.now,
    },

    // ⬅️ חדש - איפוס סיסמה
    resetPasswordToken: {
      type: String,
      default: null,
      select: false, // Don't include in queries
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
      select: false, // Don't include in queries
    },

    // ⬅️ חדש - נעילת חשבון (Account Lockout)
    failedLoginAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    lockedUntil: {
      type: Date,
      default: null,
      index: true, // For efficient querying of locked accounts
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete (ret as any).password;
        delete (ret as any).resetPasswordToken;
        delete (ret as any).resetPasswordExpires;
        delete (ret as any).failedLoginAttempts;
        delete (ret as any).lockedUntil;
        delete (ret as any).__v;
        return ret;
      },
    },
  },
);

// Index for better query performance
// Email index is already created by unique: true in schema
UserSchema.index({ createdAt: -1 });
UserSchema.index({ resetPasswordToken: 1 }); // ⬅️ חדש - לאיפוס סיסמה מהיר

// Pre-save middleware to hash password
UserSchema.pre("save", async function (next) {
  // Only hash password if it's modified
  if (!this.isModified("password")) {
    return next();
  }

  try {
    // Hash password with salt rounds of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare passwords
UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

// Static methods
UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase(), isActive: true });
};

UserSchema.statics.findById = function (id: string) {
  return this.findOne({ _id: id, isActive: true });
};

// Create and export the User model
export const UserModel = model<IUser>("User", UserSchema);

// Export types for use in other files
export type CreateUserInput = {
  email: string;
  password: string;
  name: string;
  phone?: string; // ⬅️ חדש
};

export type LoginInput = {
  email: string;
  password: string;
};

export type UserResponse = {
  _id: string;
  email: string;
  name: string;
  phone?: string; // ⬅️ חדש
  role: string; // ⬅️ חדש
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
};

// ⬅️ חדש - טייפ לעדכון פרופיל
export type UpdateProfileInput = {
  name?: string;
  phone?: string;
};
