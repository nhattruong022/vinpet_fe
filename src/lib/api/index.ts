import axiosInstance from './axiosInstance';
import { API_ENDPOINTS, STORAGE_KEYS } from '../config/constants';

// Types for API responses
export interface User {
  _id: string;
  email: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

// Post interface based on API response
export interface Post {
  _id: string;
  title: string;
  content: string;
  excerpt: string;
  status: 'published' | 'draft';
  publishDate: string;
  lockModifiedDate: boolean;
  seoTitle: string;
  permalink: string;
  metaDescription: string;
  featuredImageUrl: string;
  featuredImageId: string;
  seoScore: number;
  robotsMeta: {
    index: boolean;
    nofollow: boolean;
    noimageindex: boolean;
    noarchive: boolean;
    nosnippet: boolean;
  };
  advancedRobotMeta: {
    maxSnippet: number;
    maxVideoPreview: number;
    maxImagePreview: string;
  };
  canonicalUrl: string;
  breadcrumbTitle: string;
  redirectEnabled: boolean;
  author: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  categories: Array<{
    _id: string;
    name: string;
    slug: string;
  }>;
  tags: string[];
  images?: Array<{
    url?: string;
    image?: string; // Base64 image data
    id: string;
    position: number;
    postId?: string;
  }>;
  schemaData: {
    type: string;
    data: Record<string, unknown>;
  };
  createdAt: string;
  updatedAt: string;
}

// API Response interface
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  result?: T; // Some APIs use 'result' instead of 'data'
  returnCode?: number;
}

// Posts Response interface
interface PostsResponse {
  posts: Post[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

// SEO Preview interface
interface SeoPreview {
  title: string;
  url: string;
  description: string;
  siteName: string;
}

// Media Upload interface
interface MediaUploadResponse {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  base64?: string;
  postId?: string;
  position?: number;
  photoId?: string;
  // Construct URL from filename if not provided
  url?: string;
}

// Category Tree interface
export interface CategoryTreeNode {
  _id: string;
  slug: string;
  parent: string | null;
  isActive: boolean;
  sortOrder: number;
  name?: string;
  name_vi?: string;
  name_en?: string;
  name_ko?: string;
  description?: string;
  key?: string; // Translation key cho frontend (ví dụ: "about_us")
  children: CategoryTreeNode[];
}

// API Service Class - Simplified for login and posts
class ApiService {
  // Authentication methods
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.LOGIN, {
      email,
      password,
    });
    return response.data;
  }

  async logout(): Promise<void> {
    await axiosInstance.post(API_ENDPOINTS.AUTH.LOGOUT);
  }

  // Posts methods
  async getPosts(page: number = 1, limit: number = 10, filters?: Record<string, unknown>): Promise<PostsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });

    const response = await axiosInstance.get<ApiResponse<PostsResponse>>(`${API_ENDPOINTS.POSTS.LIST}?${params}`);
    if (!response.data.data) {
      throw new Error('Invalid response: data is missing');
    }
    return response.data.data;
  }

  async getPost(id: string): Promise<Post> {
    // Sử dụng endpoint /admin/post/{id} để lấy đầy đủ dữ liệu đa ngôn ngữ
    const response = await axiosInstance.get<ApiResponse<Post>>(`/admin/post/${id}`);
    const result = response.data.result || response.data.data;
    if (!result) {
      throw new Error('Invalid response: data is missing');
    }
    return result;
  }

  // Get full post data with all multilingual fields (for edit)
  async getPostFull(id: string): Promise<Post> {
    // Sử dụng endpoint /admin/post/{id} để lấy đầy đủ dữ liệu đa ngôn ngữ
    const response = await axiosInstance.get<ApiResponse<Post>>(`/admin/post/${id}`);
    const result = response.data.result || response.data.data;
    if (!result) {
      throw new Error('Invalid response: data is missing');
    }
    return result;
  }

  // Get post by slug
  async getPostBySlug(slug: string): Promise<Post> {
    const response = await axiosInstance.get<ApiResponse<Post>>(`${API_ENDPOINTS.POSTS.LIST}/slug/${slug}`);
    const result = response.data.result || response.data.data;
    if (!result) {
      throw new Error('Invalid response: data is missing');
    }
    return result;
  }

  // Get posts by category slug
  async getPostsByCategory(categorySlug: string, page: number = 1, limit: number = 10): Promise<PostsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      category: categorySlug,
    });

    const response = await axiosInstance.get<ApiResponse<PostsResponse>>(`${API_ENDPOINTS.POSTS.LIST}?${params}`);
    const result = response.data.result || response.data.data;
    if (!result) {
      throw new Error('Invalid response: data is missing');
    }
    return result;
  }

  async createPost(postData: Record<string, unknown>): Promise<Post> {
    const response = await axiosInstance.post<ApiResponse<Post>>(API_ENDPOINTS.POSTS.CREATE, postData);
    const result = response.data.result || response.data.data;
    if (!result) {
      throw new Error('Invalid response: data is missing');
    }
    return result;
  }

  async updatePost(id: string, postData: Record<string, unknown>): Promise<Post> {
    const response = await axiosInstance.put<ApiResponse<Post>>(`${API_ENDPOINTS.POSTS.UPDATE}/${id}`, postData);
    const result = response.data.result || response.data.data;
    if (!result) {
      throw new Error('Invalid response: data is missing');
    }
    return result;
  }

  async deletePost(id: string): Promise<void> {
    await axiosInstance.delete(`${API_ENDPOINTS.POSTS.DELETE}/${id}`);
  }

  // SEO Preview method
  async getSeoPreview(data: {
    title: string;
    permalink: string;
    metaDescription: string;
    siteName: string;
  }): Promise<SeoPreview> {
    const response = await axiosInstance.post<ApiResponse<SeoPreview>>('/api/posts/seo-preview', data);
    if (!response.data.data) {
      throw new Error('Invalid response: data is missing');
    }
    return response.data.data;
  }

  // Media Upload method
  async uploadMedia(file: File, postId?: string, position?: number): Promise<MediaUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    // Add postId if provided
    if (postId) {
      formData.append('postId', postId);
    }

    // Add position if provided
    if (position !== undefined) {
      formData.append('position', position.toString());
    }

    const response = await axiosInstance.post<ApiResponse<MediaUploadResponse>>('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = response.data.result || response.data.data;
    if (!data) {
      throw new Error('Invalid response: data is missing');
    }

    // Construct URL if not provided by API
    if (!data.url && data.filename) {
      data.url = `/uploads/media/${data.filename}`;
    }

    return data;
  }

  // Upload multiple images for a post
  async uploadPostImages(files: File[], postId: string): Promise<MediaUploadResponse[]> {
    const uploadPromises = files.map((file, index) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('postId', postId);
      formData.append('position', index.toString());

      return axiosInstance.post<ApiResponse<MediaUploadResponse>>('/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    });

    const responses = await Promise.all(uploadPromises);
    return responses.map(response => {
      const data = response.data.result || response.data.data;
      if (!data) {
        throw new Error('Invalid response: data is missing');
      }
      return data;
    });
  }

  async getCategoryTree(params: {
    rootOnly?: boolean;
    includeInactive?: boolean;
  } = {}): Promise<CategoryTreeNode[]> {
    const response = await axiosInstance.get<ApiResponse<CategoryTreeNode[]>>(
      API_ENDPOINTS.CATEGORIES.TREE,
      {
        params: {
          rootOnly: params.rootOnly ?? false,
          includeInactive: params.includeInactive ?? false,
        },
      }
    );

    // Support both 'result' and 'data' fields
    return response.data.result || response.data.data || [];
  }

  async createCategory(categoryData: {
    menuName: string;
    description?: string;
    status?: 'active' | 'inactive';
    sortOrder?: number;
    parent?: string | null;
    metaTitle?: string;
    metaDescription?: string;
    color?: string;
    icon?: string;
  }): Promise<CategoryTreeNode> {
    const response = await axiosInstance.post<ApiResponse<CategoryTreeNode>>(
      API_ENDPOINTS.CATEGORIES.CREATE,
      categoryData
    );
    const result = response.data.result || response.data.data;
    if (!result) {
      throw new Error('Invalid response: data is missing');
    }
    return result;
  }

  async updateCategory(id: string, categoryData: {
    menuName?: string;
    description?: string;
    status?: 'active' | 'inactive';
    sortOrder?: number;
    parent?: string | null;
    metaTitle?: string;
    metaDescription?: string;
    color?: string;
    icon?: string;
  }): Promise<CategoryTreeNode> {
    const response = await axiosInstance.put<ApiResponse<CategoryTreeNode>>(
      `${API_ENDPOINTS.CATEGORIES.UPDATE}/${id}`,
      categoryData
    );
    const result = response.data.result || response.data.data;
    if (!result) {
      throw new Error('Invalid response: data is missing');
    }
    return result;
  }

  async deleteCategory(id: string): Promise<void> {
    await axiosInstance.delete(`${API_ENDPOINTS.CATEGORIES.DELETE}/${id}`);
  }

  // Utility methods for token management
  setAuthToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    }
  }

  getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    }
    return null;
  }

  removeAuthToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    }
  }

  setUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    }
  }

  getUser(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (!userStr) return null;

      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  removeUser(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getAuthToken();
    if (!token) return false;

    try {
      // Basic JWT token validation (check if it's expired)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  // Clear all authentication data
  async clearAuth(): Promise<void> {
    try {
      // Call logout API to invalidate token on server
      await this.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local cleanup even if API call fails
    } finally {
      // Always clear local storage
      this.removeAuthToken();
      this.removeUser();
    }
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();

// Export the class for custom instances if needed
export default ApiService;
