/**
 * Project models và review service types
 * Định nghĩa các types liên quan đến đồ án, danh mục và đánh giá
 */

import type { BaseDocument, ObjectId } from './common';
import type { User } from './user';

/**
 * Category - Danh mục đồ án
 * ⚠️ Backend LoaiSanPham schema không có timestamps, nên không extend BaseDocument
 */
export interface Category {
  _id: ObjectId;           // ✅ Luôn có trong MongoDB
  TenLoaiSanPham: string;  // Tên loại đồ án
  // ❌ Không có createdAt, updatedAt (backend không có timestamps)
}

/**
 * Project - Đồ án trong hệ thống
 */
export interface ProjectIncludesOption {
  value: number;
  label: string;
  priceDiff?: number;
  stockDiff?: number;
  sku?: string;
  isDefault?: boolean;
}

export interface Project extends BaseDocument {
  TenSanPham: string;              // Tên đồ án
  MaLoaiSanPham: Category | ObjectId; // ID danh mục
  Gia: number;                      // Giá gốc
  KhuyenMai: number;                // Phần trăm giảm giá (0-100)
  DungTich?: number;                // Bao gồm mặc định (ml) - giữ để tương thích
  DungTichOptions?: ProjectIncludesOption[]; // Danh sách bao gồm
  MoTa: string;                     // Mô tả đồ án
  SoLuong: number;                  // Số lượng tồn kho
  DaBan: number;                    // Số lượng đã bán
  IdTepAnh?: ObjectId | null;       // ID file ảnh (nếu có)
  HinhAnhChinh: string;             // URL ảnh chính (Cloudinary public_id)
  HinhAnhPhu: string[];             // Danh sách URL ảnh phụ
  GiaSauKhuyenMai?: number;         // Giá sau khi giảm (tính toán)
  ConHang?: boolean;                // Còn hàng hay không (tính toán)
  // Legacy/compatibility fields from older API responses
  id?: ObjectId;
  MaSanPham?: string | ObjectId;
  tenSP?: string;
  gia?: number;
  giamGia?: number;
  loaiSP?: string;
  hinhAnh?: string;
  hinhAnhChinh?: string;
  hinhAnhPhu?: string[];
  dungTich?: number;
  dungTichOptions?: ProjectIncludesOption[];
  soLuong?: number;
  moTa?: string;
  LoSanXuat?: string;
}

/**
 * Review - Đánh giá đồ án từ khách hàng
 */
export interface Review extends BaseDocument {
  IdSanPham: ObjectId | Project;    // ID đồ án
  IdKhachHang: ObjectId | User;     // ID khách hàng
  NoiDung: string;                  // Nội dung đánh giá
  SoSao: number;                    // Số sao (1-5)
}

/**
 * ReviewStats - Thống kê đánh giá đồ án
 * Dùng cho trang admin và trang chi tiết đồ án
 */
export interface ReviewStats {
  summary: {
    totalReviews: number;            // Tổng số đánh giá
    avgRating: number;               // Điểm trung bình
    distribution: {                  // Phân bố số sao
      star5: number;                 // Số đánh giá 5 sao
      star4: number;                 // Số đánh giá 4 sao
      star3: number;                 // Số đánh giá 3 sao
      star2: number;                 // Số đánh giá 2 sao
      star1: number;                 // Số đánh giá 1 sao
    };
  };
  topReviewedProjects: Array<{      // Top đồ án được đánh giá nhiều nhất
    projectId: string;
    projectName: string;
    reviewCount: number;
    avgRating: number;
  }>;
  monthlyStats: Array<{             // Thống kê theo tháng
    year: number;
    month: number;
    reviewCount: number;
    avgRating: number;
  }>;
}

// ==========================
// REVIEW SERVICE TYPES
// ==========================

/**
 * RatingStats - Thống kê rating đơn giản của đồ án
 * Dùng cho API GET /api/reviews/project/:projectId/stats
 */
export interface RatingStats {
  avgRating: number;    // Điểm trung bình
  totalReviews: number; // Tổng số đánh giá
  star5: number;        // Số đánh giá 5 sao
  star4: number;        // Số đánh giá 4 sao
  star3: number;        // Số đánh giá 3 sao
  star2: number;        // Số đánh giá 2 sao
  star1: number;        // Số đánh giá 1 sao
}

/**
 * CreateReviewData - Dữ liệu tạo đánh giá mới
 * Dùng cho API POST /api/reviews
 */
export interface CreateReviewData {
  IdSanPham: string;  // ID đồ án
  NoiDung: string;    // Nội dung đánh giá
  SoSao: number;      // Số sao (1-5)
}


