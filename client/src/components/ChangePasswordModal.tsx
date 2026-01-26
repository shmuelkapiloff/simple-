import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  changePassword,
  selectAuthLoading,
  selectAuthError,
} from "../app/authSlice";
import type { RootState } from "../app/store";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state: RootState) => selectAuthLoading(state));
  const error = useSelector((state: RootState) => selectAuthError(state));

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    label: string;
    color: string;
  }>({ score: 0, label: "", color: "" });

  const calculatePasswordStrength = (password: string) => {
    if (!password) {
      return { score: 0, label: "", color: "" };
    }

    let score = 0;
    
    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Character variety checks
    if (/[a-z]/.test(password)) score += 1; // lowercase
    if (/[A-Z]/.test(password)) score += 1; // uppercase
    if (/[0-9]/.test(password)) score += 1; // numbers
    if (/[^A-Za-z0-9]/.test(password)) score += 1; // special chars

    // Define strength levels
    if (score <= 2) {
      return { score, label: "חלשה", color: "bg-red-500" };
    } else if (score <= 4) {
      return { score, label: "בינונית", color: "bg-yellow-500" };
    } else {
      return { score, label: "חזקה", color: "bg-green-500" };
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.currentPassword) {
      errors.currentPassword = "Current password is required";
    }

    if (!formData.newPassword) {
      errors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Confirm password is required";
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords don't match";
    }

    if (formData.currentPassword === formData.newPassword) {
      errors.newPassword =
        "New password must be different from current password";
    }

    setLocalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const result = await dispatch(
      changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      }) as any
    );

    if (result.type === "auth/changePassword/fulfilled") {
      setSuccessMessage("🎉 Password changed successfully!");
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setLocalErrors({});

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
        setSuccessMessage("");
      }, 2000);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Calculate password strength for new password field
    if (name === "newPassword") {
      setPasswordStrength(calculatePasswordStrength(value));
    }
    // Clear error for this field when user starts typing
    if (localErrors[name]) {
      setLocalErrors({
        ...localErrors,
        [name]: "",
      });
    }
  };

  const handleClose = () => {
    setFormData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setLocalErrors({});
    setSuccessMessage("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      dir="rtl"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          🔐 שינוי סיסמה
        </h2>

        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 text-green-800">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              סיסמה נוכחית
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`w-full px-4 py-2 pl-10 border rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  localErrors.currentPassword
                    ? "border-red-500"
                    : "border-gray-300"
                } disabled:bg-gray-100`}
                placeholder="הקלד סיסמה נוכחית"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showCurrentPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {localErrors.currentPassword && (
              <p className="text-red-600 text-sm mt-1">
                {localErrors.currentPassword}
              </p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              סיסמה חדשה
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`w-full px-4 py-2 pl-10 border rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  localErrors.newPassword ? "border-red-500" : "border-gray-300"
                } disabled:bg-gray-100`}
                placeholder="הקלד סיסמה חדשה"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showNewPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {localErrors.newPassword && (
              <p className="text-red-600 text-sm mt-1">
                {localErrors.newPassword}
            
                          {/* Password Strength Indicator */}
                          {formData.newPassword && (
                            <div className="mt-2">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm text-gray-600">חוזק סיסמה:</span>
                                <span className={`text-sm font-semibold ${
                                  passwordStrength.score <= 2 
                                    ? "text-red-600" 
                                    : passwordStrength.score <= 4 
                                      ? "text-yellow-600" 
                                      : "text-green-600"
                                }`}>
                                  {passwordStrength.label}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                                  style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                                ></div>
                              </div>
                              <div className="mt-2 text-xs text-gray-500 space-y-1">
                                <p className={formData.newPassword.length >= 8 ? "text-green-600" : ""}>
                                  {formData.newPassword.length >= 8 ? "✓" : "○"} לפחות 8 תווים
                                </p>
                                <p className={/[A-Z]/.test(formData.newPassword) && /[a-z]/.test(formData.newPassword) ? "text-green-600" : ""}>
                                  {/[A-Z]/.test(formData.newPassword) && /[a-z]/.test(formData.newPassword) ? "✓" : "○"} אותיות גדולות וקטנות
                                </p>
                                <p className={/[0-9]/.test(formData.newPassword) ? "text-green-600" : ""}>
                                  {/[0-9]/.test(formData.newPassword) ? "✓" : "○"} לפחות מספר אחד
                                </p>
                                <p className={/[^A-Za-z0-9]/.test(formData.newPassword) ? "text-green-600" : ""}>
                                  {/[^A-Za-z0-9]/.test(formData.newPassword) ? "✓" : "○"} תו מיוחד (@, #, $, וכו')
                                </p>
                              </div>
                            </div>
                          )}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              אימות סיסמה
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`w-full px-4 py-2 pl-10 border rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  localErrors.confirmPassword
                    ? "border-red-500"
                    : "border-gray-300"
                } disabled:bg-gray-100`}
                placeholder="אשר סיסמה חדשה"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {localErrors.confirmPassword && (
              <p className="text-red-600 text-sm mt-1">
                {localErrors.confirmPassword}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition disabled:opacity-50"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isLoading ? "⏳ משנה..." : "💾 שנה סיסמה"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
