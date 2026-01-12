import React, { useState } from "react";
import { Login } from "./Login";
import { Register } from "./Register";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: "login" | "register";
  message?: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialView = "login",
  message,
}) => {
  const [currentView, setCurrentView] = useState<"login" | "register">(
    initialView
  );

  // Sync view when caller changes initialView (e.g., 401 → login)
  React.useEffect(() => {
    setCurrentView(initialView);
  }, [initialView]);

  if (!isOpen) return null;

  const switchToLogin = () => setCurrentView("login");
  const switchToRegister = () => setCurrentView("register");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md space-y-3">
        {message && (
          <div className="p-3 rounded-md bg-yellow-50 border border-yellow-200 text-sm text-yellow-900">
            {message}
          </div>
        )}
        {currentView === "login" ? (
          <Login onSwitch={switchToRegister} onClose={onClose} />
        ) : (
          <Register onSwitch={switchToLogin} onClose={onClose} />
        )}
      </div>
    </div>
  );
};
