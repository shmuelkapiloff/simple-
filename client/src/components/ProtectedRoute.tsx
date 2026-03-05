import { useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../hooks";

interface Props {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly }: Props) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const authModal = useOutletContext<
    { openLogin: (msg?: string) => void } | undefined
  >();

  // Open modal when unauthenticated (after loading finishes)
  useEffect(() => {
    if (!isLoading && !isAuthenticated && authModal) {
      authModal.openLogin("יש להתחבר כדי לגשת לעמוד זה");
    }
  }, [isLoading, isAuthenticated, authModal]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Show a message while modal is open — don't navigate away
    return (
      <div className="max-w-lg mx-auto mt-20 text-center">
        <p className="text-6xl mb-4">🔒</p>
        <h1 className="text-2xl font-bold mb-2">נדרשת התחברות</h1>
        <p className="text-gray-500">יש להתחבר כדי לגשת לעמוד זה</p>
      </div>
    );
  }

  if (adminOnly && !isAdmin) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-2">אין גישה</h1>
        <p className="text-gray-600">עמוד זה מיועד למנהלים בלבד</p>
      </div>
    );
  }

  return <>{children}</>;
}
