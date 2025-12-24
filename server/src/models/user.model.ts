import { Schema, model, Document } from "mongoose";
import bcrypt from "bcryptjs";

// Interface for User document
export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  name: string;
  
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  lastLogin?: Date;

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

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete (ret as any).password;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Index for better query performance
// Email index is already created by unique: true in schema
UserSchema.index({ createdAt: -1 });

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
  candidatePassword: string
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
};

export type LoginInput = {
  email: string;
  password: string;
};

export type UserResponse = {
  _id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
};
