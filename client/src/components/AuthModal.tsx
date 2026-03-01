import { useState } from "react";
import { useLoginMutation, useRegisterMutation } from "../api";

interface Props {
  isOpen: boolean;
  view: "login" | "register";
  message: string;
  close: () => void;
  setView: (v: "login" | "register") => void;
}

export default function AuthModal({
  isOpen,
  view,
  message,
  close,
  setView,
}: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [login, { isLoading: loginLoading }] = useLoginMutation();
  const [register, { isLoading: regLoading }] = useRegisterMutation();
  const isLoading = loginLoading || regLoading;

  if (!isOpen) return null;

  const reset = () => {
    setEmail("");
    setPassword("");
    setName("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      let result;
      if (view === "login") {
        result = await login({ email, password }).unwrap();
      } else {
        result = await register({ name, email, password }).unwrap();
      }
      if (result.data) {
        // Server returns 'token' not 'accessToken'
        localStorage.setItem("token", result.data.token);
        localStorage.setItem("refreshToken", result.data.refreshToken);
      }
      reset();
      close();
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } };
      setError(apiErr.data?.message || "אירעה שגיאה, נסה שוב");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={close} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        {/* Close button */}
        <button
          onClick={close}
          className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 text-xl"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          {view === "login" ? "התחברות" : "הרשמה"}
        </h2>
        {message && <p className="text-sm text-primary-600 mb-4">{message}</p>}

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {view === "register" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                שם
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="השם שלך"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              אימייל
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir="ltr"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              סיסמה
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              dir="ltr"
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
            {isLoading ? "..." : view === "login" ? "התחבר" : "הירשם"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          {view === "login" ? (
            <>
              אין לך חשבון?{" "}
              <button
                onClick={() => {
                  setView("register");
                  setError("");
                }}
                className="text-primary-600 font-medium hover:underline"
              >
                הירשם
              </button>
            </>
          ) : (
            <>
              כבר יש לך חשבון?{" "}
              <button
                onClick={() => {
                  setView("login");
                  setError("");
                }}
                className="text-primary-600 font-medium hover:underline"
              >
                התחבר
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
