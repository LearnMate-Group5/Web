import React, { ErrorInfo, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import StaffDashboard from './components/StaffDashboard';
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
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Đã xảy ra lỗi</h2>
          <p>{this.state.error?.message || 'Có lỗi xảy ra trong ứng dụng'}</p>
          <button onClick={() => window.location.reload()}>Tải lại trang</button>
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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div>Đang tải...</div>
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
              <Navigate to={user?.roles.includes('Admin') ? '/admin' : '/staff'} replace />
            ) : (
              <Login />
            )
          } 
        />
        
        {/* Protected routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requiredRole="Admin">
              <Layout>
                <AdminDashboard />
              </Layout>
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
            <Navigate to={isAuthenticated ? (user?.roles.includes('Admin') ? '/admin' : '/staff') : '/login'} replace />
          } 
        />
        
        {/* 404 page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  } catch (error) {
    console.error('Error in AppContent:', error);
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Lỗi xác thực</h2>
        <p>Vui lòng đăng nhập lại.</p>
        <button onClick={() => window.location.href = '/login'}>Đăng nhập</button>
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
