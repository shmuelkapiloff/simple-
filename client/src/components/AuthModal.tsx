import React, { useState } from "react";
import { Login } from "./Login";
import { Register } from "./Register";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: "login" | "register";
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialView = "login",
}) => {
  const [currentView, setCurrentView] = useState<"login" | "register">(
    initialView
  );

  if (!isOpen) return null;

  const switchToLogin = () => setCurrentView("login");
  const switchToRegister = () => setCurrentView("register");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md">
        {currentView === "login" ? (
          <Login onSwitch={switchToRegister} onClose={onClose} />
        ) : (
          <Register onSwitch={switchToLogin} onClose={onClose} />
        )}
      </div>
    </div>
  );
};
