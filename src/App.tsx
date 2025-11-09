import React from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import UserManagementDashboard from './components/UserManagementDashboard';
import StaffManagementDashboard from './components/StaffManagementDashboard';
import StaffDashboard from './components/StaffDashboard';
import SubscriptionPlansDashboard from './components/SubscriptionPlansDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './components/NotFound';
import Layout from './components/Layout';
import './App.css';

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="text-center space-y-4 max-w-md">
            <h2 className="text-2xl font-bold text-destructive">Đã xảy ra lỗi</h2>
            <p className="text-muted-foreground">{this.state.error?.message || 'Có lỗi xảy ra trong ứng dụng'}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  try {
    const { isAuthenticated, user, isLoading } = useAuth();

    // Show loading state while auth is being checked
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        </div>
      );
    }

    return (
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? (
              <Navigate to={user?.roles.includes('Admin') ? '/admin/users' : '/staff'} replace />
            ) : (
              <Login />
            )
          } 
        />
        
        {/* Protected routes */}
        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute requiredRole="Admin">
              <Layout>
                <UserManagementDashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/staff" 
          element={
            <ProtectedRoute requiredRole="Admin">
              <Layout>
                <StaffManagementDashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/subscriptions" 
          element={
            <ProtectedRoute requiredRole="Admin">
              <Layout>
                <SubscriptionPlansDashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        {/* Legacy admin route - redirect to users */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requiredRole="Admin">
              <Navigate to="/admin/users" replace />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/staff" 
          element={
            <ProtectedRoute requiredRole="Staff">
              <Layout>
                <StaffDashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        {/* Default redirect */}
        <Route 
          path="/" 
          element={
            <Navigate to={isAuthenticated ? (user?.roles.includes('Admin') ? '/admin/users' : '/staff') : '/login'} replace />
          } 
        />
        
        {/* 404 page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  } catch (error) {
    console.error('Error in AppContent:', error);
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold text-destructive">Lỗi xác thực</h2>
          <p className="text-muted-foreground">Vui lòng đăng nhập lại.</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
