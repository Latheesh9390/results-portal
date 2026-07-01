import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

/**
 * Wraps every /admin/* page except the login screen. Anyone without a
 * valid admin token - which means every regular student, since they never
 * log in - is bounced straight to /admin/login instead of seeing any
 * dashboard content.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAdminAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return children;
}
