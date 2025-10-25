import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import StaffDashboard from './components/StaffDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './components/NotFound';
import Layout from './components/Layout';
import './App.css';

const AppContent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

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
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
