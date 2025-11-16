import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  register,
  clearError,
  selectAuthLoading,
  selectAuthError,
} from "../app/authSlice";
import type { AppDispatch, RootState } from "../app/store";

interface RegisterProps {
  onSwitch: () => void;
  onClose: () => void;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const Register: React.FC<RegisterProps> = ({ onSwitch, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const isLoading = useSelector((state: RootState) => selectAuthLoading(state));
  const authError = useSelector((state: RootState) => selectAuthError(state));

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [localErrors, setLocalErrors] = useState<string>("");

  const validateForm = (): string | null => {
    const { name, email, password, confirmPassword } = formData;

    if (!name.trim()) {
      return "Name is required";
    }

    if (!email.trim()) {
      return "Email is required";
    }

    if (!password) {
      return "Password is required";
    }

    if (password.length < 6) {
      return "Password must be at least 6 characters";
    }

    if (password !== confirmPassword) {
      return "Passwords do not match";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalErrors("");
    dispatch(clearError());

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setLocalErrors(validationError);
      return;
    }

    try {
      // Dispatch register action
      const result = await dispatch(
        register({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        })
      ).unwrap();

      console.log("✅ Registration successful:", result);

      // Close modal on success
      onClose();
    } catch (error: any) {
      console.error("❌ Registration error:", error);
      // Error will be handled by authSlice
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear errors when user starts typing
    if (localErrors) {
      setLocalErrors("");
    }
    if (authError) {
      dispatch(clearError());
    }
  };

  // Get the error to display (local validation or auth error)
  const displayError = localErrors || authError;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">הרשמה</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Field */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            שם מלא
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="הכנס את שמך המלא"
            required
            disabled={isLoading}
          />
        </div>

        {/* Email Field */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            אימייל
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="your@email.com"
            required
            disabled={isLoading}
          />
        </div>

        {/* Password Field */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            סיסמה
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="לפחות 6 תווים"
            required
            disabled={isLoading}
          />
        </div>

        {/* Confirm Password Field */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            אישור סיסמה
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="הכנס את הסיסמה שוב"
            required
            disabled={isLoading}
          />
        </div>

        {/* Error Message */}
        {displayError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {displayError}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              נרשם...
            </div>
          ) : (
            "הירשם"
          )}
        </button>

        {/* Switch to Login */}
        <div className="text-center text-sm text-gray-600">
          כבר יש לך חשבון?{" "}
          <button
            type="button"
            onClick={onSwitch}
            className="text-blue-600 hover:text-blue-800 font-medium"
            disabled={isLoading}
          >
            התחבר כאן
          </button>
        </div>
      </form>
    </div>
  );
};
