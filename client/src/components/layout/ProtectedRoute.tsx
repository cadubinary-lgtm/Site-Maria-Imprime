import { ReactNode } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "admin" | "production" | "user";
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
      return;
    }

    if (requiredRole && user && user.role !== requiredRole && user.role !== "admin") {
      setLocation("/");
    }
  }, [user, loading, requiredRole, setLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRole && user.role !== requiredRole && user.role !== "admin") {
    return null;
  }

  return <>{children}</>;
}
