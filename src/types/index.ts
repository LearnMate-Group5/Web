// User types
export interface User {
  userId: string;
  name: string;
  email: string;
  isVerified: boolean;
  isActive: boolean;
  avatarUrl: string | null;
  isPremium: boolean | null;
  providerName: string | null;
  createdAt: string;
  updatedAt: string | null;
}

// Login types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  value: {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
    user: {
      userId: string;
      name: string;
      email: string;
      roles: string[];
    };
  };
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
  };
}

// API Response types
export interface ApiResponse<T> {
  value: T;
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    description: string;
  };
}

export interface UserListResponse {
  users: User[];
}

// Role update types
export interface RoleUpdateRequest {
  userId: string;
  roleName: string;
}

// Activation types
export interface ActivationRequest {
  userId: string;
  isActive: boolean;
}

// Auth context types
export interface AuthContextType {
  user: LoginResponse['value']['user'] | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}
