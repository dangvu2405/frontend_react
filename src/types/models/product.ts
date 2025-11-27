/**
 * Product models và review service types
 * Định nghĩa các types liên quan đến sản phẩm, danh mục và đánh giá
 */

import type { BaseDocument, ObjectId } from './common';
import type { User } from './user';

/**
 * Category - Danh mục sản phẩm
 * ⚠️ Backend LoaiSanPham schema không có timestamps, nên không extend BaseDocument
 */
export interface Category {
  _id: ObjectId;           // ✅ Luôn có trong MongoDB
  TenLoaiSanPham: string;  // Tên loại sản phẩm
  // ❌ Không có createdAt, updatedAt (backend không có timestamps)
}

/**
 * Product - Sản phẩm trong hệ thống
 */
export interface ProductVolumeOption {
  value: number;
  label: string;
  priceDiff?: number;
  stockDiff?: number;
  sku?: string;
  isDefault?: boolean;
}

export interface Product extends BaseDocument {
  TenSanPham: string;              // Tên sản phẩm
  MaLoaiSanPham: Category | ObjectId; // ID danh mục
  Gia: number;                      // Giá gốc
  KhuyenMai: number;                // Phần trăm giảm giá (0-100)
  DungTich?: number;                // Dung tích mặc định (ml) - giữ để tương thích
  DungTichOptions?: ProductVolumeOption[]; // Danh sách dung tích
  MoTa: string;                     // Mô tả sản phẩm
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
  dungTichOptions?: ProductVolumeOption[];
  soLuong?: number;
  moTa?: string;
  LoSanXuat?: string;
}

/**
 * Review - Đánh giá sản phẩm từ khách hàng
 */
export interface Review extends BaseDocument {
  IdSanPham: ObjectId | Product;    // ID sản phẩm
  IdKhachHang: ObjectId | User;     // ID khách hàng
  NoiDung: string;                  // Nội dung đánh giá
  SoSao: number;                    // Số sao (1-5)
}

/**
 * ReviewStats - Thống kê đánh giá sản phẩm
 * Dùng cho trang admin và trang chi tiết sản phẩm
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
  topReviewedProducts: Array<{      // Top sản phẩm được đánh giá nhiều nhất
    productId: string;
    productName: string;
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
 * RatingStats - Thống kê rating đơn giản của sản phẩm
 * Dùng cho API GET /api/reviews/product/:productId/stats
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
  IdSanPham: string;  // ID sản phẩm
  NoiDung: string;    // Nội dung đánh giá
  SoSao: number;      // Số sao (1-5)
}


