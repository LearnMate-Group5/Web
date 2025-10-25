import api from './axios';
import { 
  LoginRequest, 
  LoginResponse, 
  ApiResponse, 
  UserListResponse, 
  RoleUpdateRequest, 
  ActivationRequest 
} from '../types';

// Auth services
export const authService = {
  // Login user
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/User/login', {
      email,
      password
    });
    return response.data;
  },

  // Logout (clear local storage)
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
  }
};

// User management services
export const userService = {
  // Get user list with pagination
  getUserList: async (pageNumber: number = 1, pageSize: number = 20): Promise<ApiResponse<UserListResponse>> => {
    const response = await api.get<ApiResponse<UserListResponse>>('/User/read', {
      params: {
        pageNumber,
        pageSize
      }
    });
    return response.data;
  },

  // Update user role
  updateUserRole: async (userId: string, roleName: string): Promise<ApiResponse<any>> => {
    const response = await api.put<ApiResponse<any>>('/User/role', null, {
      params: {
        userId,
        roleName
      }
    });
    return response.data;
  },

  // Toggle user activation status
  toggleUserActivation: async (userId: string, isActive: boolean): Promise<ApiResponse<any>> => {
    const response = await api.put<ApiResponse<any>>(`/User/${userId}/activation`, null, {
      params: {
        isActive
      }
    });
    return response.data;
  }
};

// Storage utilities
export const storageService = {
  // Save auth data to localStorage
  saveAuthData: (loginResponse: LoginResponse) => {
    localStorage.setItem('token', loginResponse.value.accessToken);
    localStorage.setItem('refreshToken', loginResponse.value.refreshToken);
    localStorage.setItem('user', JSON.stringify(loginResponse.value.user));
    localStorage.setItem('expiresAt', loginResponse.value.expiresAt);
  },

  // Get auth data from localStorage
  getAuthData: () => {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    const userStr = localStorage.getItem('user');
    const expiresAt = localStorage.getItem('expiresAt');
    
    const user = userStr ? JSON.parse(userStr) : null;
    
    return {
      token,
      refreshToken,
      user,
      expiresAt
    };
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const { token, user } = storageService.getAuthData();
    return !!(token && user);
  },

  // Clear all auth data
  clearAuthData: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('expiresAt');
  }
};
