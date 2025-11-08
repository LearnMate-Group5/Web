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
  role: string | null;
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

// Book types
export interface Book {
  bookId: string;
  title: string;
  author: string;
  description: string;
  imageUrl: string | null;
  imageBase64: string | null; // Base64 encoded image
  categories: Category[] | string[];
  isActive: boolean;
  views: number;
  likes: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface Category {
  categoryId: string;
  name: string;
}

export interface BookListResponse {
  books: Book[];
  totalCount?: number;
}

export interface BookListParams {
  onlyActive?: boolean;
  categoryId?: string;
  categoryName?: string;
}

export interface CreateBookRequest {
  title: string;
  author: string;
  description: string;
  imageFile: File | null;
  categories: string[]; // Array of category IDs or names
}

export interface UpdateBookRequest {
  title: string;
  author: string;
  description: string;
  imageFile: File | null;
  categories: string[];
  isActive: boolean;
  clearImage: boolean;
}

// Chapter types
export interface Chapter {
  chapterId: string;
  bookId: string;
  pageIndex: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string;
  updatedBy: string | null;
}

export interface CreateChapterRequest {
  pageIndex: number;
  title: string;
  content: string;
}

export interface UpdateChapterRequest {
  pageIndex: number;
  title: string;
  content: string;
}