// API Base URL - Lấy từ biến môi trường hoặc dùng mặc định
// Ưu tiên: VITE_API_URL > localhost
const getApiBaseUrl = () => {
  const viteApiUrl = import.meta.env.VITE_API_URL;
  
  // Nếu VITE_API_URL là empty string, dùng relative URL
  if (viteApiUrl === '') return '';
  
  // Nếu có VITE_API_URL, dùng nó
  if (viteApiUrl) {
    return viteApiUrl;
  }
  
  // Development: localhost
  return 'http://localhost:3001';
};

export const API_BASE_URL = getApiBaseUrl();

// Kiểm tra xem API URL có đúng không
console.log('🔗 API Base URL:', API_BASE_URL);
console.log('🔗 VITE_API_URL env:', import.meta.env.VITE_API_URL);
console.log('🔗 NODE_ENV:', import.meta.env.MODE);

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh-token',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  
  // User
  PROFILE: '/user/me',
  UPDATE_PROFILE: '/user/me',
  CHANGE_PASSWORD: '/user/changepassword',
  ORDERS: '/user/orderUser',
  // Products
  PRODUCTS: '/api/products',
  // PRODUCT_DETAIL: (id: string) => `/api/products/${id}`,
  // PRODUCTS_BY_CATEGORY: (category: string) => `/api/products?loaiSP=${category}`,
  // PRODUCTS_SEARCH: (keyword: string) => `/api/products/search?q=${keyword}`,
} as const;

// Helper function để build full URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

// API Messages - Đồng bộ với backend constants
export const API_MESSAGES = {
  SUCCESS: 'Thành công',
  ERROR: 'Có lỗi xảy ra',
  UNAUTHORIZED: 'Không có quyền truy cập',
  NOT_FOUND: 'Không tìm thấy',
  INVALID_CREDENTIALS: 'Thông tin đăng nhập không đúng',
  USER_EXISTS: 'Email đã được sử dụng',
  USER_NOT_FOUND: 'Người dùng không tồn tại',
  PRODUCT_NOT_FOUND: 'Sản phẩm không tồn tại',
  ORDER_NOT_FOUND: 'Đơn hàng không tồn tại',
  CART_EMPTY: 'Giỏ hàng trống',
  INSUFFICIENT_STOCK: 'Không đủ hàng trong kho',
} as const;

