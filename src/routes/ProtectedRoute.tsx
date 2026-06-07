import { Navigate } from "react-router-dom";

import { useAuth, type UserRole } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

// A component that protects routes based on authentication and user roles.
const ProtectedRoute = ({ children, requiredRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
