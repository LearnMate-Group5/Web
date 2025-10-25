import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Đang tải...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role if required
  if (requiredRole && !user.roles.includes(requiredRole)) {
    return (
      <div className="unauthorized-container">
        <h2>Không có quyền truy cập</h2>
        <p>Bạn không có quyền truy cập vào trang này.</p>
        <p>Vui lòng liên hệ quản trị viên để được cấp quyền.</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
