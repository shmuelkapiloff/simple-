import { useState } from "react";
import { useLoginMutation, useRegisterMutation } from "../api";

// Eye icons for show/hide password
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const EyeSlashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

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
  const [showPassword, setShowPassword] = useState(false);
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                dir="ltr"
                minLength={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-10 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
              </button>
            </div>
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
