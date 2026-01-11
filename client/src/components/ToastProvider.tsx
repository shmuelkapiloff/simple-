import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type ToastType = "success" | "error" | "info";
export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number; // ms
}

interface ToastContextValue {
  addToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, number>>({});

  const addToast = useCallback(
    (message: string, type: ToastType = "info", duration = 4000) => {
      const id = Math.random().toString(36).slice(2);
      const toast: ToastItem = { id, type, message, duration };
      setToasts((prev) => [...prev, toast]);
      timers.current[id] = window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        delete timers.current[id];
      }, duration);
    },
    []
  );

  useEffect(
    () => () => {
      Object.values(timers.current).forEach((t) => clearTimeout(t));
    },
    []
  );

  const value = useMemo(() => ({ addToast }), [addToast]);

  const typeClasses = (type: ToastType) => {
    switch (type) {
      case "success":
        return "bg-green-600 text-white";
      case "error":
        return "bg-red-600 text-white";
      default:
        return "bg-gray-800 text-white";
    }
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Container */}
      <div
        className="fixed bottom-4 right-4 z-50 space-y-2"
        role="region"
        aria-label="התראות מערכת"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`min-w-[240px] max-w-[360px] px-4 py-3 rounded shadow-lg flex items-start gap-3 ${typeClasses(
              t.type
            )}`}
            role="alert"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="mt-0.5">
              {t.type === "success" ? "✅" : t.type === "error" ? "❌" : "ℹ️"}
            </span>
            <span className="text-sm">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
