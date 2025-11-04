import { Navigate } from "react-router-dom";
import { useUser } from "@/hooks/useUser";

interface ProtectedRouteProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export const ProtectedRoute = ({ allowedRoles, children }: ProtectedRouteProps) => {
  const { user, loading } = useUser();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    if (user.role === "customer") return <Navigate to="/customer" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
//
//  ProtectedRoute.tsx
//  
//
//  Created by Ryan Lewis on 11/3/25.
//

