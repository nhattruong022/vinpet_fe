// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8080/api',
  TIMEOUT: 10000, // 10 seconds
};

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
  },
  POSTS: {
    LIST: '/posts',
    CREATE: '/posts',
    UPDATE: '/posts',
    DELETE: '/posts',
  },
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'user',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful! Redirecting...',
  POST_CREATED: 'Bài viết đã được tạo thành công!',
  POST_UPDATED: 'Bài viết đã được cập nhật thành công!',
  POST_DELETED: 'Bài viết đã được xóa thành công!',
};

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MESSAGE: 'Please enter a valid email address',
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MESSAGE: 'Password must be at least 6 characters long',
  },
  TITLE: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 200,
    MESSAGE: 'Tiêu đề phải có từ 5 đến 200 ký tự',
  },
  CONTENT: {
    MIN_LENGTH: 50,
    MESSAGE: 'Nội dung phải có ít nhất 50 ký tự',
  },
};
