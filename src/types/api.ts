// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    type: string;
    details?: any;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}


export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Business types
export interface BusinessFilters {
  status?: string | string[];
  type?: string;
  category?: string;
  search?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface CreateBusinessRequest {
  name: string;
  description?: string;
  type?: 'services' | 'products' | 'both';
  services?: string[];
  categories?: string[];
  website?: string;
  location?: {
    country?: string;
    state?: string;
    city?: string;
    address?: string;
    postalCode?: string;
    timezone?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
    website?: string;
    socialMedia?: string[];
  };
}

// User types
export interface UserFilters {
  status?: string;
  role?: string;
  search?: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profileImage?: string;
}

export interface UpdateUserStatusRequest {
  status: 'active' | 'inactive' | 'suspended' | 'pending';
}

export interface UpdateUserRoleRequest {
  role: 'user' | 'admin' | 'super_admin';
}

// File upload types
export interface FileUploadResponse {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

// Pagination query
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

// Common request/response patterns
export interface IdParam {
  id: string;
}

export interface TokenParam {
  token: string;
}

export interface EmailParam {
  email: string;
}

// Error types
export interface AppErrorResponse {
  success: false;
  message: string;
  error: {
    type: string;
    details?: any;
  };
  timestamp: string;
}
