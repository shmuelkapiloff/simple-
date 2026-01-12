import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { forgotPassword, selectAuthLoading, selectAuthError } from "../app/authSlice";
import type { RootState, AppDispatch } from "../app/store";

const ForgotPassword: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const isLoading = useSelector((state: RootState) => selectAuthLoading(state));
  const error = useSelector((state: RootState) => selectAuthError(state));

  const [email, setEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [emailError, setEmailError] = useState("");

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setSuccessMessage("");

    if (!email.trim()) {
      setEmailError("אימייל נדרש");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("אימייל לא תקין");
      return;
    }

    const result = await dispatch(forgotPassword(email));

    if (result.type === "auth/forgotPassword/fulfilled") {
      setSuccessMessage(
        "✅ בדוק את תיבת הדוא״ל שלך! קישור איפוס הסיסמה נשלח אליך."
      );
      setEmail("");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔐 שיחזור סיסמה</h1>
          <p className="text-gray-600">הכנס את כתובת הדוא״ל שלך ונשלח לך קישור לאיפוס הסיסמה</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
            <p className="font-medium">{successMessage}</p>
            <p className="text-sm mt-2">אם לא קיבלת את הדוא״ל, בדוק את תיקיית הספאם.</p>
          </div>
        )}

        {/* Error Message */}
        {(error || emailError) && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            <p className="font-medium">{error || emailError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              כתובת דוא״ל
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError("");
              }}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="your@email.com"
              autoComplete="email"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isLoading ? "⏳ שולח..." : "🔗 שלח קישור איפוס"}
          </button>
        </form>

        {/* Links */}
        <div className="mt-6 space-y-3 text-center">
          <div>
            <Link to="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              ← חזור לבית
            </Link>
          </div>
          <div className="text-gray-600 text-sm">
            זוכר את הסיסמה?{" "}
            <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
              התחבר
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ForgotPassword;
