import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  login,
  clearError,
  selectAuthLoading,
  selectAuthError,
} from "../app/authSlice";
import type { AppDispatch, RootState } from "../app/store";

interface LoginProps {
  onSwitch: () => void;
  onClose: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSwitch, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const isLoading = useSelector((state: RootState) => selectAuthLoading(state));
  const authError = useSelector((state: RootState) => selectAuthError(state));

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [localErrors, setLocalErrors] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalErrors("");
    dispatch(clearError());

    // Validate form
    if (!formData.email || !formData.password) {
      setLocalErrors("Please fill in all fields");
      return;
    }

    try {
      // Dispatch login action
      const result = await dispatch(login(formData)).unwrap();
      console.log("✅ Login successful:", result);

      // Close modal on success
      onClose();
    } catch (error: any) {
      console.error("❌ Login error:", error);
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
        <h2 className="text-2xl font-bold text-gray-800">התחברות</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            placeholder="••••••••"
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
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              מתחבר...
            </div>
          ) : (
            "התחבר"
          )}
        </button>

        {/* Switch to Register */}
        <div className="text-center text-sm text-gray-600">
          עדיין אין לך חשבון?{" "}
          <button
            type="button"
            onClick={onSwitch}
            className="text-blue-600 hover:text-blue-800 font-medium"
            disabled={isLoading}
          >
            הרשם כאן
          </button>
        </div>
      </form>
    </div>
  );
};
