import { useState } from "react";
import { useResetPasswordMutation } from "../api";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const { token: tokenFromPath } = useParams();
  const navigate = useNavigate();
  // Prefer path param, fallback to query param
  const token = tokenFromPath || searchParams.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!token) {
      setError("קישור לא תקין או חסר טוקן");
      return;
    }
    if (newPassword.length < 6) {
      setError("הסיסמה חייבת להיות לפחות 6 תווים");
      return;
    }
    if (newPassword !== confirm) {
      setError("הסיסמאות לא תואמות");
      return;
    }
    try {
      await resetPassword({
        token,
        newPassword,
        confirmPassword: confirm,
      }).unwrap();
      setSuccess("הסיסמה אופסה בהצלחה! אפשר להתחבר עם הסיסמה החדשה.");
      setTimeout(() => navigate("/"), 2500);
    } catch (err: any) {
      setError(err?.data?.message || "אירעה שגיאה, נסה שוב");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-white rounded-xl shadow-lg p-8">
      <h1 className="text-2xl font-bold mb-4 text-center">איפוס סיסמה</h1>
      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-700 text-sm rounded-lg p-3 mb-4">
          {success}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            סיסמה חדשה
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="••••••••"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            אימות סיסמה
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={6}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50"
        >
          {isLoading ? "..." : "אפס סיסמה"}
        </button>
      </form>
    </div>
  );
}
