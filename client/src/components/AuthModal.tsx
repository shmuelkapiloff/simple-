import { useState, useEffect, useRef, useCallback } from "react";
import {
  useLoginMutation,
  useRegisterMutation,
  useForgotPasswordMutation,
  useGoogleLoginMutation,
} from "../api";
import { GOOGLE_CLIENT_ID } from "../constants";

// Eye icons for show/hide password

// Add Google type to window
declare global {
  interface Window {
    google?: any;
  }
}

const EyeIcon = () => (
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
      d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
    />
  </svg>
);

const EyeSlashIcon = () => (
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
      d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
    />
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
  if (!isOpen) return null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [login, { isLoading: loginLoading }] = useLoginMutation();
  const [register, { isLoading: regLoading }] = useRegisterMutation();
  const [forgotPassword, { isLoading: forgotLoading }] =
    useForgotPasswordMutation();
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");
  const [googleLogin, { isLoading: googleLoading }] = useGoogleLoginMutation();
  const isLoading = loginLoading || regLoading || forgotLoading || googleLoading;
  const modalRef = useRef<HTMLDivElement>(null);




  // Only declare reset ONCE, before use
  const reset = useCallback(() => {
    setEmail("");
    setPassword("");
    setName("");
    setError("");
    setShowPassword(false);
  }, []);

  // Google login handler (now after reset)
  const handleGoogleLogin = useCallback(() => {
    if (!window.google || !GOOGLE_CLIENT_ID) {
      setError("Google login לא זמין כרגע");
      return;
    }
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response: any) => {
        setError("");
        try {
          const result = await googleLogin({ idToken: response.credential }).unwrap();
          if (result.data) {
            localStorage.setItem("token", result.data.token);
            localStorage.setItem("refreshToken", result.data.refreshToken);
          }
          reset();
          close();
        } catch (err: any) {
          setError(err?.data?.message || "אירעה שגיאה, נסה שוב");
        }
      },
    });
    window.google.accounts.id.prompt();
  }, [googleLogin, close, reset]);

  // Reset form when switching views
  useEffect(() => {
    reset();
  }, [view, reset]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, close]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;
    const modal = modalRef.current;
    const focusable = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length > 0) focusable[0].focus();

    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => document.removeEventListener("keydown", trap);
  }, [isOpen, view]);

  // Forgot password submit
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg("");
    try {
      await forgotPassword({ email: forgotEmail }).unwrap();
      setForgotMsg("קישור לאיפוס סיסמה נשלח לאימייל (אם קיים במערכת)");
    } catch (err) {
      setForgotMsg("אירעה שגיאה, נסה שוב");
    }
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

  // Load Google Identity Services script
  useEffect(() => {
    if (!isOpen) return;
    if (document.getElementById("google-identity-script")) return;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.id = "google-identity-script";
    document.body.appendChild(script);
    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [isOpen]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={close}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6"
      >
        {/* Close button */}
        <button
          onClick={close}
          className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 text-xl"
          aria-label="סגור"
        >
          ✕
        </button>

        <h2
          id="auth-modal-title"
          className="text-2xl font-bold text-gray-900 mb-1"
        >
          {showForgot ? "שחזור סיסמה" : view === "login" ? "התחברות" : "הרשמה"}
        </h2>
        {message && !showForgot && (
          <p className="text-sm text-primary-600 mb-4">{message}</p>
        )}

        {error && !showForgot && (
          <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        {!showForgot ? (
          <>
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
          {/* Google Login Button */}
          {view === "login" && (
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2.5 mt-2 bg-white hover:bg-gray-50 transition disabled:opacity-50"
            >
              <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" className="w-5 h-5" />
              <span>התחבר עם Google</span>
            </button>
          )}
          </>
        ) : (
          <form onSubmit={handleForgot} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                אימייל לשחזור סיסמה
              </label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                dir="ltr"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="email@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={forgotLoading}
              className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50"
            >
              {forgotLoading ? "..." : "שלח קישור לאיפוס"}
            </button>
            {forgotMsg && (
              <div className="text-center text-green-600 text-sm">
                {forgotMsg}
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowForgot(false)}
              className="block mx-auto mt-2 text-primary-600 text-xs hover:underline"
            >
              חזרה להתחברות
            </button>
          </form>
        )}

        {!showForgot && (
          <p className="text-center text-sm text-gray-500 mt-4">
            {view === "login" ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs text-primary-600 hover:underline mb-2 block"
                >
                  שכחתי סיסמה
                </button>
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
        )}
      </div>
    </div>
  );
}
