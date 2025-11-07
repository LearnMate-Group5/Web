import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthContextType, LoginResponse } from '../types';
import { authService, storageService } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<LoginResponse['value']['user'] | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing auth data on mount
  useEffect(() => {
    try {
      const authData = storageService.getAuthData();
      if (authData.token && authData.user) {
        setToken(authData.token);
        setUser(authData.user);
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authService.login(email, password);
      
      if (response.isSuccess) {
        // Save auth data to localStorage
        storageService.saveAuthData(response);
        
        // Update state
        setToken(response.value.accessToken);
        setUser(response.value.user);
      } else {
        throw new Error(response.error?.description || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    authService.logout();
    storageService.clearAuthData();
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!(token && user);

  // Always provide a valid context value, even during loading
  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    isLoading
  };

  // Ensure context is always provided
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
