import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../features/auth/context/AuthContext';
import type { Role } from '../types';
import { Loader } from '../components/Loader/Loader';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Loader fullPage />;
  }

  if (!isAuthenticated || !user) {
    // Redirect to login but save current path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to unauthorized if user doesn't have permissions
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
export default ProtectedRoute;
