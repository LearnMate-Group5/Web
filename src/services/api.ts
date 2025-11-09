import api from './axios';
import type { 
  LoginResponse, 
  ApiResponse, 
  UserListResponse,
  Book,
  BookListResponse,
  BookListParams,
  CreateBookRequest,
  UpdateBookRequest,
  Chapter,
  CreateChapterRequest,
  UpdateChapterRequest,
  Category,
  SubscriptionPlan,
  CreateSubscriptionPlanRequest,
  UpdateSubscriptionPlanRequest
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

// Book management services
export const bookService = {
  // Get book list with filters
  getBookList: async (params?: BookListParams): Promise<ApiResponse<BookListResponse>> => {
    try {
      const response = await api.get<any>('/Book', {
        params: {
          onlyActive: params?.onlyActive ?? false,
          categoryId: params?.categoryId,
          categoryName: params?.categoryName
        }
      });
      
      // Check if response is a direct array (API returns [...])
      if (Array.isArray(response.data)) {
        // Wrap array in ApiResponse format
        return {
          value: { books: response.data } as BookListResponse,
          isSuccess: true,
          isFailure: false
        } as ApiResponse<BookListResponse>;
      }
      
      // If response is already ApiResponse format, return as is
      if (response.data && typeof response.data === 'object' && 'isSuccess' in response.data) {
        return response.data;
      }
      
      // If response has a value property that might contain books
      if (response.data && response.data.value) {
        const value = response.data.value;
        if (Array.isArray(value)) {
          return {
            value: { books: value } as BookListResponse,
            isSuccess: true,
            isFailure: false
          } as ApiResponse<BookListResponse>;
        }
        if (value && typeof value === 'object' && 'books' in value) {
          return {
            value: value as BookListResponse,
            isSuccess: true,
            isFailure: false
          } as ApiResponse<BookListResponse>;
        }
      }
      
      // Fallback: empty books array
      return {
        value: { books: [] } as BookListResponse,
        isSuccess: true,
        isFailure: false
      } as ApiResponse<BookListResponse>;
    } catch (error: any) {
      // Handle axios errors
      if (error.response) {
        // Server responded with error status
        return {
          value: { books: [] } as BookListResponse,
          isSuccess: false,
          isFailure: true,
          error: {
            code: error.response.status?.toString() || 'UNKNOWN',
            description: error.response.data?.error?.description || error.response.data?.message || 'Không thể tải danh sách sách'
          }
        };
      } else if (error.request) {
        // Request made but no response received
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        throw error;
      }
    }
  },

  // Get book by ID
  getBookById: async (bookId: string): Promise<ApiResponse<Book>> => {
    const response = await api.get<ApiResponse<Book>>(`/Book/${bookId}`);
    return response.data;
  },

  // Create new book
  createBook: async (bookData: CreateBookRequest): Promise<ApiResponse<Book>> => {
    try {
      const formData = new FormData();
      formData.append('Title', bookData.title);
      formData.append('Author', bookData.author);
      formData.append('Description', bookData.description);
      
      if (bookData.imageFile) {
        formData.append('ImageFile', bookData.imageFile);
      }
      
      // Append categories array
      bookData.categories.forEach((category, index) => {
        formData.append(`Categories[${index}]`, category);
      });

      console.log('Creating book with data:', {
        title: bookData.title,
        author: bookData.author,
        categories: bookData.categories,
        hasImage: !!bookData.imageFile
      });

      const response = await api.post<any>('/Book', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Create book response:', response);
      console.log('Create book response.data:', response.data);
      console.log('Create book response.status:', response.status);
      
      // Check if response is already ApiResponse format
      if (response.data && typeof response.data === 'object' && 'isSuccess' in response.data) {
        return response.data;
      }
      
      // If response is a direct Book object
      if (response.data && response.data.bookId) {
        return {
          value: response.data,
          isSuccess: true,
          isFailure: false
        } as ApiResponse<Book>;
      }
      
      // If response has a value property
      if (response.data && response.data.value) {
        return {
          value: response.data.value,
          isSuccess: true,
          isFailure: false
        } as ApiResponse<Book>;
      }
      
      // Default: success if status is 200/201
      if (response.status === 200 || response.status === 201) {
        return {
          value: response.data || {} as Book,
          isSuccess: true,
          isFailure: false
        } as ApiResponse<Book>;
      }
      
      throw new Error('Invalid response format');
    } catch (error: any) {
      console.error('Error in createBook:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        
        // Handle 409 Conflict specifically
        if (error.response.status === 409) {
          const errorMessage = error.response.data?.error?.description 
            || error.response.data?.message 
            || error.response.data?.title?.[0] // Validation error from ASP.NET
            || 'Sách này đã tồn tại. Vui lòng kiểm tra tên sách hoặc tác giả.';
          
          return {
            value: {} as Book,
            isSuccess: false,
            isFailure: true,
            error: {
              code: '409',
              description: errorMessage
            }
          };
        }
        
        return {
          value: {} as Book,
          isSuccess: false,
          isFailure: true,
          error: {
            code: error.response.status?.toString() || 'UNKNOWN',
            description: error.response.data?.error?.description 
              || error.response.data?.message 
              || error.response.data?.title?.[0] // Validation error
              || 'Không thể thêm sách'
          }
        };
      } else if (error.request) {
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        throw error;
      }
    }
  },

  // Update book
  updateBook: async (bookId: string, bookData: UpdateBookRequest): Promise<ApiResponse<Book>> => {
    try {
      const formData = new FormData();
      formData.append('Title', bookData.title);
      formData.append('Author', bookData.author);
      formData.append('Description', bookData.description);
      formData.append('IsActive', bookData.isActive.toString());
      formData.append('ClearImage', bookData.clearImage.toString());
      
      if (bookData.imageFile) {
        formData.append('ImageFile', bookData.imageFile);
      }
      
      // Append categories array
      bookData.categories.forEach((category, index) => {
        formData.append(`Categories[${index}]`, category);
      });

      console.log('Updating book with data:', {
        bookId,
        title: bookData.title,
        author: bookData.author,
        categories: bookData.categories,
        isActive: bookData.isActive,
        hasImage: !!bookData.imageFile
      });

      const response = await api.put<any>(`/Book/${bookId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Update book response:', response);
      console.log('Update book response.data:', response.data);
      console.log('Update book response.status:', response.status);
      
      // Check if response is already ApiResponse format
      if (response.data && typeof response.data === 'object' && 'isSuccess' in response.data) {
        return response.data;
      }
      
      // If response is a direct Book object
      if (response.data && response.data.bookId) {
        return {
          value: response.data,
          isSuccess: true,
          isFailure: false
        } as ApiResponse<Book>;
      }
      
      // If response has a value property
      if (response.data && response.data.value) {
        return {
          value: response.data.value,
          isSuccess: true,
          isFailure: false
        } as ApiResponse<Book>;
      }
      
      // Default: success if status is 200
      if (response.status === 200) {
        return {
          value: response.data || {} as Book,
          isSuccess: true,
          isFailure: false
        } as ApiResponse<Book>;
      }
      
      throw new Error('Invalid response format');
    } catch (error: any) {
      console.error('Error in updateBook:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        
        // Handle 409 Conflict specifically
        if (error.response.status === 409) {
          const errorMessage = error.response.data?.error?.description 
            || error.response.data?.message 
            || error.response.data?.title?.[0] // Validation error from ASP.NET
            || 'Sách này đã tồn tại. Vui lòng kiểm tra tên sách hoặc tác giả.';
          
          return {
            value: {} as Book,
            isSuccess: false,
            isFailure: true,
            error: {
              code: '409',
              description: errorMessage
            }
          };
        }
        
        return {
          value: {} as Book,
          isSuccess: false,
          isFailure: true,
          error: {
            code: error.response.status?.toString() || 'UNKNOWN',
            description: error.response.data?.error?.description 
              || error.response.data?.message 
              || error.response.data?.title?.[0] // Validation error
              || 'Không thể cập nhật sách'
          }
        };
      } else if (error.request) {
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        throw error;
      }
    }
  },

  // Delete book
  deleteBook: async (bookId: string): Promise<ApiResponse<any>> => {
    try {
      const response = await api.delete<any>(`/Book/${bookId}`);
      
      console.log('Delete book response:', response);
      console.log('Delete book response.data:', response.data);
      console.log('Delete book response.status:', response.status);
      
      // If status is 200/204 and no error, consider it success
      if (response.status === 200 || response.status === 204) {
        // Check if response is already ApiResponse format
        if (response.data && typeof response.data === 'object' && 'isSuccess' in response.data) {
          return response.data;
        }
        
        // If response is empty or null, consider it success (common for DELETE)
        if (!response.data || response.data === null || response.data === '') {
          return {
            value: {},
            isSuccess: true,
            isFailure: false
          } as ApiResponse<any>;
        }
        
        // If response has a value property
        if (response.data && response.data.value !== undefined) {
          return {
            value: response.data.value,
            isSuccess: true,
            isFailure: false
          } as ApiResponse<any>;
        }
        
        // Default: success if status is 200/204
        return {
          value: {},
          isSuccess: true,
          isFailure: false
        } as ApiResponse<any>;
      }
      
      // If status is not 200/204, treat as error
      return {
        value: {},
        isSuccess: false,
        isFailure: true,
        error: {
          code: response.status?.toString() || 'UNKNOWN',
          description: response.data?.error?.description || response.data?.message || 'Không thể xóa sách'
        }
      };
    } catch (error: any) {
      console.error('Error in deleteBook:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        
        // If status is 200/204, consider it success even if caught as error
        if (error.response.status === 200 || error.response.status === 204) {
          return {
            value: {},
            isSuccess: true,
            isFailure: false
          } as ApiResponse<any>;
        }
        
        return {
          value: {},
          isSuccess: false,
          isFailure: true,
          error: {
            code: error.response.status?.toString() || 'UNKNOWN',
            description: error.response.data?.error?.description || error.response.data?.message || 'Không thể xóa sách'
          }
        };
      } else if (error.request) {
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        throw error;
      }
    }
  }
};

// Chapter management services
export const chapterService = {
  // Get chapters for a book
  getChaptersByBookId: async (bookId: string): Promise<ApiResponse<Chapter[]>> => {
    try {
      const response = await api.get<any>(`/Book/${bookId}/chapters`);
      
      // Debug: log response to check structure
      console.log('Chapter API Response:', response.data);
      console.log('Response type:', typeof response.data);
      console.log('Is array:', Array.isArray(response.data));
      
      // Check if response is a direct array (API returns [...])
      if (Array.isArray(response.data)) {
        console.log('Returning direct array with', response.data.length, 'chapters');
        return {
          value: response.data,
          isSuccess: true,
          isFailure: false
        } as ApiResponse<Chapter[]>;
      }
      
      // If response is already ApiResponse format, return as is
      if (response.data && typeof response.data === 'object' && 'isSuccess' in response.data) {
        console.log('Returning ApiResponse format');
        return response.data;
      }
      
      // If response has a value property
      if (response.data && response.data.value) {
        const value = response.data.value;
        if (Array.isArray(value)) {
          console.log('Returning value array with', value.length, 'chapters');
          return {
            value: value,
            isSuccess: true,
            isFailure: false
          } as ApiResponse<Chapter[]>;
        }
      }
      
      // Fallback: empty chapters array
      console.warn('Unexpected response format, returning empty array. Response:', response.data);
      return {
        value: [],
        isSuccess: true,
        isFailure: false
      } as ApiResponse<Chapter[]>;
    } catch (error: any) {
      console.error('Error in getChaptersByBookId:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        return {
          value: [],
          isSuccess: false,
          isFailure: true,
          error: {
            code: error.response.status?.toString() || 'UNKNOWN',
            description: error.response.data?.error?.description || error.response.data?.message || 'Không thể tải danh sách chương'
          }
        };
      } else if (error.request) {
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        throw error;
      }
    }
  },

  // Get chapter by ID
  getChapterById: async (bookId: string, chapterId: string): Promise<ApiResponse<Chapter>> => {
    try {
      const response = await api.get<any>(`/Book/${bookId}/chapters/${chapterId}`);
      
      // Check if response is already ApiResponse format
      if (response.data && typeof response.data === 'object' && 'isSuccess' in response.data) {
        return response.data;
      }
      
      // If response is a direct Chapter object
      if (response.data && response.data.chapterId) {
        return {
          value: response.data,
          isSuccess: true,
          isFailure: false
        } as ApiResponse<Chapter>;
      }
      
      // If response has a value property
      if (response.data && response.data.value) {
        return {
          value: response.data.value,
          isSuccess: true,
          isFailure: false
        } as ApiResponse<Chapter>;
      }
      
      throw new Error('Invalid response format');
    } catch (error: any) {
      if (error.response) {
        return {
          value: {} as Chapter,
          isSuccess: false,
          isFailure: true,
          error: {
            code: error.response.status?.toString() || 'UNKNOWN',
            description: error.response.data?.error?.description || error.response.data?.message || 'Không thể tải chương'
          }
        };
      } else if (error.request) {
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        throw error;
      }
    }
  },

  // Create new chapter
  createChapter: async (bookId: string, chapterData: CreateChapterRequest): Promise<ApiResponse<Chapter>> => {
    try {
      const response = await api.post<any>(`/Book/${bookId}/chapters`, {
        pageIndex: chapterData.pageIndex,
        title: chapterData.title,
        content: chapterData.content
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Check if response is already ApiResponse format
      if (response.data && typeof response.data === 'object' && 'isSuccess' in response.data) {
        return response.data;
      }
      
      // If response is a direct Chapter object
      if (response.data && response.data.chapterId) {
        return {
          value: response.data,
          isSuccess: true,
          isFailure: false
        } as ApiResponse<Chapter>;
      }
      
      // If response has a value property
      if (response.data && response.data.value) {
        return {
          value: response.data.value,
          isSuccess: true,
          isFailure: false
        } as ApiResponse<Chapter>;
      }
      
      throw new Error('Invalid response format');
    } catch (error: any) {
      if (error.response) {
        return {
          value: {} as Chapter,
          isSuccess: false,
          isFailure: true,
          error: {
            code: error.response.status?.toString() || 'UNKNOWN',
            description: error.response.data?.error?.description || error.response.data?.message || 'Không thể thêm chương'
          }
        };
      } else if (error.request) {
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        throw error;
      }
    }
  },

  // Update chapter
  updateChapter: async (bookId: string, chapterId: string, chapterData: UpdateChapterRequest): Promise<ApiResponse<Chapter>> => {
    try {
      const response = await api.put<any>(`/Book/${bookId}/chapters/${chapterId}`, {
        pageIndex: chapterData.pageIndex,
        title: chapterData.title,
        content: chapterData.content
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Check if response is already ApiResponse format
      if (response.data && typeof response.data === 'object' && 'isSuccess' in response.data) {
        return response.data;
      }
      
      // If response is a direct Chapter object
      if (response.data && response.data.chapterId) {
        return {
          value: response.data,
          isSuccess: true,
          isFailure: false
        } as ApiResponse<Chapter>;
      }
      
      // If response has a value property
      if (response.data && response.data.value) {
        return {
          value: response.data.value,
          isSuccess: true,
          isFailure: false
        } as ApiResponse<Chapter>;
      }
      
      throw new Error('Invalid response format');
    } catch (error: any) {
      if (error.response) {
        return {
          value: {} as Chapter,
          isSuccess: false,
          isFailure: true,
          error: {
            code: error.response.status?.toString() || 'UNKNOWN',
            description: error.response.data?.error?.description || error.response.data?.message || 'Không thể cập nhật chương'
          }
        };
      } else if (error.request) {
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        throw error;
      }
    }
  },

  // Delete chapter
  deleteChapter: async (bookId: string, chapterId: string): Promise<ApiResponse<any>> => {
    try {
      const response = await api.delete<any>(`/Book/${bookId}/chapters/${chapterId}`);
      
      // Check if response is already ApiResponse format
      if (response.data && typeof response.data === 'object' && 'isSuccess' in response.data) {
        return response.data;
      }
      
      // If no response data, assume success
      return {
        value: {},
        isSuccess: true,
        isFailure: false
      } as ApiResponse<any>;
    } catch (error: any) {
      if (error.response) {
        return {
          value: {},
          isSuccess: false,
          isFailure: true,
          error: {
            code: error.response.status?.toString() || 'UNKNOWN',
            description: error.response.data?.error?.description || error.response.data?.message || 'Không thể xóa chương'
          }
        };
      } else if (error.request) {
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        throw error;
      }
    }
  }
};

// Category management services
export const categoryService = {
  // Get all categories
  getAllCategories: async (): Promise<ApiResponse<Category[]>> => {
    try {
      const response = await api.get<any>('/Book/Categories');

      // Check if response is a direct array (API returns [...])
      if (Array.isArray(response.data)) {
        return {
          value: response.data,
          isSuccess: true,
          isFailure: false
        } as ApiResponse<Category[]>;
      }

      // If response is already ApiResponse format, return as is
      if (response.data && typeof response.data === 'object' && 'isSuccess' in response.data) {
        return response.data;
      }

      // If response has a value property
      if (response.data && response.data.value && Array.isArray(response.data.value)) {
        return {
          value: response.data.value,
          isSuccess: true,
          isFailure: false
        } as ApiResponse<Category[]>;
      }

      // Fallback: empty categories array
      return {
        value: [],
        isSuccess: true,
        isFailure: false
      } as ApiResponse<Category[]>;
    } catch (error: any) {
      console.error('Error in getAllCategories:', error);
      if (error.response) {
        return {
          value: [],
          isSuccess: false,
          isFailure: true,
          error: {
            code: error.response.status?.toString() || 'UNKNOWN',
            description: error.response.data?.error?.description || error.response.data?.message || 'Không thể tải danh sách thể loại'
          }
        };
      } else if (error.request) {
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        throw error;
      }
    }
  }
};

// Subscription services
export const subscriptionService = {
  // Get all subscription plans
  getPlans: async (): Promise<ApiResponse<SubscriptionPlan[]>> => {
    try {
      console.log('Fetching subscription plans from /Subscription/plans');
      const response = await api.get<any>('/Subscription/plans');
      console.log('Subscription plans response:', response);
      
      // Check if response is a direct array (API returns [...])
      if (Array.isArray(response.data)) {
        return {
          value: response.data,
          isSuccess: true,
          isFailure: false
        } as ApiResponse<SubscriptionPlan[]>;
      }
      
      // If response is already ApiResponse format, return as is
      if (response.data && typeof response.data === 'object' && 'isSuccess' in response.data) {
        return response.data;
      }
      
      // If response has a value property
      if (response.data && response.data.value && Array.isArray(response.data.value)) {
        return {
          value: response.data.value,
          isSuccess: true,
          isFailure: false
        } as ApiResponse<SubscriptionPlan[]>;
      }
      
      // Fallback: empty plans array
      return {
        value: [],
        isSuccess: true,
        isFailure: false
      } as ApiResponse<SubscriptionPlan[]>;
    } catch (error: any) {
      console.error('Error in getPlans:', error);
      if (error.response) {
        return {
          value: [],
          isSuccess: false,
          isFailure: true,
          error: {
            code: error.response.status?.toString() || 'UNKNOWN',
            description: error.response.data?.error?.description || error.response.data?.message || 'Không thể tải danh sách gói đăng ký'
          }
        };
      } else if (error.request) {
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        throw error;
      }
    }
  },

  // Get subscription plan by ID
  getPlanById: async (subscriptionId: string): Promise<ApiResponse<SubscriptionPlan>> => {
    try {
      console.log('Fetching subscription plan by ID:', subscriptionId);
      const response = await api.get<any>(`/Subscription/plans/${subscriptionId}`);
      console.log('Subscription plan response:', response);
      
      // Check if response is already ApiResponse format
      if (response.data && typeof response.data === 'object' && 'isSuccess' in response.data) {
        return response.data;
      }
      
      // If response is a direct SubscriptionPlan object
      if (response.data && response.data.subscriptionId) {
        return {
          value: response.data,
          isSuccess: true,
          isFailure: false
        } as ApiResponse<SubscriptionPlan>;
      }
      
      // If response has a value property
      if (response.data && response.data.value) {
        return {
          value: response.data.value,
          isSuccess: true,
          isFailure: false
        } as ApiResponse<SubscriptionPlan>;
      }
      
      // Fallback: empty plan object
      return {
        value: {} as SubscriptionPlan,
        isSuccess: true,
        isFailure: false
      } as ApiResponse<SubscriptionPlan>;
    } catch (error: any) {
      console.error('Error in getPlanById:', error);
      if (error.response) {
        return {
          value: {} as SubscriptionPlan,
          isSuccess: false,
          isFailure: true,
          error: {
            code: error.response.status?.toString() || 'UNKNOWN',
            description: error.response.data?.error?.description || error.response.data?.message || 'Không thể tải thông tin gói đăng ký'
          }
        };
      } else if (error.request) {
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        throw error;
      }
    }
  },

  // Create new subscription plan
  createPlan: async (planData: CreateSubscriptionPlanRequest): Promise<ApiResponse<SubscriptionPlan>> => {
    try {
      console.log('Creating subscription plan:', planData);
      const response = await api.post<any>('/Subscription/plans', {
        name: planData.name,
        type: planData.type,
        status: planData.status,
        originalPrice: planData.originalPrice,
        discount: planData.discount
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Create subscription plan response:', response);
      
      // Check if response is already ApiResponse format
      if (response.data && typeof response.data === 'object' && 'isSuccess' in response.data) {
        return response.data;
      }
      
      // If response is a direct SubscriptionPlan object
      if (response.data && response.data.subscriptionId) {
        return {
          value: response.data,
          isSuccess: true,
          isFailure: false
        } as ApiResponse<SubscriptionPlan>;
      }
      
      // If response has a value property
      if (response.data && response.data.value) {
        return {
          value: response.data.value,
          isSuccess: true,
          isFailure: false
        } as ApiResponse<SubscriptionPlan>;
      }
      
      // Default: success if status is 200/201
      if (response.status === 200 || response.status === 201) {
        return {
          value: response.data || {} as SubscriptionPlan,
          isSuccess: true,
          isFailure: false
        } as ApiResponse<SubscriptionPlan>;
      }
      
      throw new Error('Invalid response format');
    } catch (error: any) {
      console.error('Error in createPlan:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        
        return {
          value: {} as SubscriptionPlan,
          isSuccess: false,
          isFailure: true,
          error: {
            code: error.response.status?.toString() || 'UNKNOWN',
            description: error.response.data?.error?.description 
              || error.response.data?.message 
              || error.response.data?.name?.[0] // Validation error
              || 'Không thể tạo gói đăng ký'
          }
        };
      } else if (error.request) {
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        throw error;
      }
    }
  },

  // Update subscription plan
  updatePlan: async (subscriptionId: string, planData: UpdateSubscriptionPlanRequest): Promise<ApiResponse<SubscriptionPlan>> => {
    try {
      console.log('Updating subscription plan:', subscriptionId, planData);
      const response = await api.put<any>(`/Subscription/plans/${subscriptionId}`, {
        name: planData.name,
        type: planData.type,
        status: planData.status,
        originalPrice: planData.originalPrice,
        discount: planData.discount
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Update subscription plan response:', response);
      
      // Check if response is already ApiResponse format
      if (response.data && typeof response.data === 'object' && 'isSuccess' in response.data) {
        return response.data;
      }
      
      // If response is a direct SubscriptionPlan object
      if (response.data && response.data.subscriptionId) {
        return {
          value: response.data,
          isSuccess: true,
          isFailure: false
        } as ApiResponse<SubscriptionPlan>;
      }
      
      // If response has a value property
      if (response.data && response.data.value) {
        return {
          value: response.data.value,
          isSuccess: true,
          isFailure: false
        } as ApiResponse<SubscriptionPlan>;
      }
      
      // Default: success if status is 200
      if (response.status === 200) {
        return {
          value: response.data || {} as SubscriptionPlan,
          isSuccess: true,
          isFailure: false
        } as ApiResponse<SubscriptionPlan>;
      }
      
      throw new Error('Invalid response format');
    } catch (error: any) {
      console.error('Error in updatePlan:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        
        return {
          value: {} as SubscriptionPlan,
          isSuccess: false,
          isFailure: true,
          error: {
            code: error.response.status?.toString() || 'UNKNOWN',
            description: error.response.data?.error?.description 
              || error.response.data?.message 
              || error.response.data?.name?.[0] // Validation error
              || 'Không thể cập nhật gói đăng ký'
          }
        };
      } else if (error.request) {
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        throw error;
      }
    }
  },

  // Delete subscription plan
  deletePlan: async (subscriptionId: string): Promise<ApiResponse<any>> => {
    try {
      console.log('Deleting subscription plan:', subscriptionId);
      const response = await api.delete<any>(`/Subscription/plans/${subscriptionId}`);
      
      console.log('Delete subscription plan response:', response);
      console.log('Delete subscription plan response.data:', response.data);
      console.log('Delete subscription plan response.status:', response.status);
      
      // If status is 200/204 and no error, consider it success
      if (response.status === 200 || response.status === 204) {
        // Check if response is already ApiResponse format
        if (response.data && typeof response.data === 'object' && 'isSuccess' in response.data) {
          return response.data;
        }
        
        // If response is empty or null, consider it success (common for DELETE)
        if (!response.data || response.data === null || response.data === '') {
          return {
            value: {},
            isSuccess: true,
            isFailure: false
          } as ApiResponse<any>;
        }
        
        // If response has a value property
        if (response.data && response.data.value !== undefined) {
          return {
            value: response.data.value,
            isSuccess: true,
            isFailure: false
          } as ApiResponse<any>;
        }
        
        // Default: success if status is 200/204
        return {
          value: {},
          isSuccess: true,
          isFailure: false
        } as ApiResponse<any>;
      }
      
      // If status is not 200/204, treat as error
      return {
        value: {},
        isSuccess: false,
        isFailure: true,
        error: {
          code: response.status?.toString() || 'UNKNOWN',
          description: response.data?.error?.description || response.data?.message || 'Không thể xóa gói đăng ký'
        }
      };
    } catch (error: any) {
      console.error('Error in deletePlan:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        
        // If status is 200/204, consider it success even if caught as error
        if (error.response.status === 200 || error.response.status === 204) {
          return {
            value: {},
            isSuccess: true,
            isFailure: false
          } as ApiResponse<any>;
        }
        
        return {
          value: {},
          isSuccess: false,
          isFailure: true,
          error: {
            code: error.response.status?.toString() || 'UNKNOWN',
            description: error.response.data?.error?.description || error.response.data?.message || 'Không thể xóa gói đăng ký'
          }
        };
      } else if (error.request) {
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        throw error;
      }
    }
  }
};

// Storage utilities
export const storageService = {
  // Save auth data to localStorage
  saveAuthData: (loginResponse: LoginResponse) => {
    console.log('Saving auth data to localStorage');
    console.log('Access token:', loginResponse.value.accessToken ? loginResponse.value.accessToken.substring(0, 20) + '...' : 'null');
    localStorage.setItem('token', loginResponse.value.accessToken);
    localStorage.setItem('refreshToken', loginResponse.value.refreshToken);
    localStorage.setItem('user', JSON.stringify(loginResponse.value.user));
    localStorage.setItem('expiresAt', loginResponse.value.expiresAt);
    console.log('Token saved to localStorage:', !!localStorage.getItem('token'));
    console.log('Token value in localStorage:', localStorage.getItem('token') ? localStorage.getItem('token')?.substring(0, 20) + '...' : 'null');
  },

  // Get auth data from localStorage
  getAuthData: () => {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    const userStr = localStorage.getItem('user');
    const expiresAt = localStorage.getItem('expiresAt');
    
    console.log('Getting auth data from localStorage');
    console.log('Token exists:', !!token);
    console.log('Token value:', token ? token.substring(0, 20) + '...' : 'null');
    console.log('All localStorage keys:', Object.keys(localStorage));
    
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
