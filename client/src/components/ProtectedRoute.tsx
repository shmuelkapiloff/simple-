import { Navigate, useOutletContext } from "react-router-dom";
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // If we have the modal context, open it — otherwise redirect
    if (authModal) {
      authModal.openLogin("יש להתחבר כדי לגשת לעמוד זה");
    }
    return <Navigate to="/" replace />;
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
