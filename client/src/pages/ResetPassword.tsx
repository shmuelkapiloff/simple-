import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, Link } from "react-router-dom";
import { resetPassword, selectAuthLoading, selectAuthError } from "../app/authSlice";
import type { RootState, AppDispatch } from "../app/store";

const ResetPassword: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const isLoading = useSelector((state: RootState) => selectAuthLoading(state));
  const error = useSelector((state: RootState) => selectAuthError(state));

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");

  if (!token) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">❌ קישור לא תקין</h1>
          <p className="text-gray-600 mb-6">קישור איפוס הסיסמה אינו תקין או פג תוקף.</p>
          <Link to="/forgot-password" className="text-blue-600 hover:text-blue-800 font-medium">
            ← בקש קישור חדש
          </Link>
        </div>
      </main>
    );
  }

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.newPassword) {
      errors.newPassword = "סיסמה חדשה נדרשת";
    } else if (formData.newPassword.length < 6) {
      errors.newPassword = "הסיסמה חייבת להיות לפחות 6 תווים";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "אימות סיסמה נדרש";
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = "הסיסמאות אינן תואמות";
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
      resetPassword({
        token,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      })
    );

    if (result.type === "auth/resetPassword/fulfilled") {
      setSuccessMessage("✅ הסיסמה שוחזרה בהצלחה! מפנה אותך להתחברות...");
      setFormData({
        newPassword: "",
        confirmPassword: "",
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/");
      }, 2000);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error for this field when user starts typing
    if (localErrors[name]) {
      setLocalErrors({
        ...localErrors,
        [name]: "",
      });
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔑 איפוס סיסמה</h1>
          <p className="text-gray-600">הכנס סיסמה חדשה</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
            <p className="font-medium">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
              סיסמה חדשה
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              disabled={isLoading}
              className={`w-full px-4 py-2 border rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                localErrors.newPassword ? "border-red-500" : "border-gray-300"
              } disabled:bg-gray-100`}
              placeholder="הקלד סיסמה חדשה"
            />
            {localErrors.newPassword && (
              <p className="text-red-600 text-sm mt-1">{localErrors.newPassword}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              אימות סיסמה
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              disabled={isLoading}
              className={`w-full px-4 py-2 border rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                localErrors.confirmPassword ? "border-red-500" : "border-gray-300"
              } disabled:bg-gray-100`}
              placeholder="אשר את הסיסמה"
            />
            {localErrors.confirmPassword && (
              <p className="text-red-600 text-sm mt-1">{localErrors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isLoading ? "⏳ משנה סיסמה..." : "💾 שנה סיסמה"}
          </button>
        </form>

        {/* Links */}
        <div className="mt-6 text-center">
          <Link to="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            ← חזור לבית
          </Link>
        </div>
      </div>
    </main>
  );
};

export default ResetPassword;
