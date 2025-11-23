/**
 * Common types và interfaces dùng chung cho toàn bộ ứng dụng
 */

/**
 * ObjectId type - đại diện cho MongoDB ObjectId dưới dạng string
 */
export type ObjectId = string;

/**
 * BaseDocument - Interface cơ bản cho tất cả documents trong database
 * Tất cả models đều extend từ interface này
 */
export interface BaseDocument {
  _id: ObjectId;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Pagination - Thông tin phân trang cho danh sách dữ liệu
 */
export interface Pagination {
  page: number;        // Trang hiện tại
  limit: number;       // Số lượng items mỗi trang
  total: number;       // Tổng số items
  totalPages: number;  // Tổng số trang
}

/**
 * ApiSuccess - Response thành công từ API
 * @template T - Type của data trả về
 */
export interface ApiSuccess<T> {
  success: true;
  message?: string;
  data: T;
  pagination?: Pagination;
  [key: string]: unknown;
}

/**
 * ApiError - Response lỗi từ API
 */
export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, unknown>;
  data?: null;
  [key: string]: unknown;
}

/**
 * ApiResponse - Union type cho response từ API (success hoặc error)
 * @template T - Type của data trả về
 */
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/**
 * ApiListResponse - Response cho danh sách dữ liệu
 * @template T - Type của item trong danh sách
 */
export type ApiListResponse<T> = ApiResponse<T[]>;

/**
 * ApiItemResponse - Response cho một item đơn lẻ
 * @template T - Type của item
 */
export type ApiItemResponse<T> = ApiResponse<T>;

/**
 * ChartItem - Dữ liệu cho biểu đồ/chart
 */
export interface ChartItem {
  name: string;
  count?: number;      // Số lượng
  sold?: number;       // Số lượng đã bán
  revenue?: number;    // Doanh thu
}

/**
 * SummaryStats - Thống kê tổng quan cho dashboard
 */
export interface SummaryStats {
  totalRevenue?: number;     // Tổng doanh thu
  totalOrders?: number;      // Tổng số đơn hàng
  totalProducts?: number;    // Tổng số sản phẩm
  totalUsers?: number;       // Tổng số người dùng
  totalCategories?: number;   // Tổng số danh mục
}


