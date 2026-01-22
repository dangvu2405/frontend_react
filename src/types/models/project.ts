/**
 * Project models - Đồ án/Academic Projects
 * Định nghĩa các types liên quan đến đồ án, source code, báo cáo
 */

import type { BaseDocument, ObjectId } from './common';
import type { User } from './user';

/**
 * Project Category - Danh mục đồ án
 * Theo môn học hoặc loại đồ án
 */
export interface ProjectCategory {
  _id: ObjectId;
  TenLoai: string;              // Tên loại (Web Development, Mobile App, etc.)
  MoTa?: string;                // Mô tả loại
  Icon?: string;                // Icon cho category
}

/**
 * Project Level - Cấp độ đồ án
 */
export type ProjectLevel = 'Cao đẳng' | 'Đại học' | 'Thạc sĩ' | 'Tiến sĩ';

/**
 * Project Type - Loại đồ án
 */
export type ProjectType = 
  | 'Source Code Full' 
  | 'Báo cáo/Luận văn' 
  | 'Slide thuyết trình' 
  | 'Tài liệu tham khảo'
  | 'Full Package'; // Bao gồm tất cả

/**
 * Project Status - Trạng thái đồ án
 */
export type ProjectStatus = 'available' | 'out_of_stock' | 'archived';

/**
 * Project - Đồ án trong hệ thống
 */
export interface Project extends BaseDocument {
  // Basic Info
  title: string;                    // Tên đồ án
  subject: string;                 // Môn học (Web Dev, Mobile, AI, etc.)
  category: string;                 // Loại (Source Code, Báo cáo, etc.)
  level: ProjectLevel;              // Cấp độ (Cao đẳng, Đại học, etc.)
  
  // Pricing
  price: number;                    // Giá
  originalPrice?: number;           // Giá gốc (nếu có khuyến mãi)
  discount?: number;                // Phần trăm giảm giá (0-100)
  
  // Description
  description: string;              // Mô tả chi tiết
  shortDescription?: string;        // Mô tả ngắn
  
  // Technical Info
  tech_stack: string[];             // Công nghệ sử dụng (React, Node.js, etc.)
  features: string[];               // Tính năng chính
  includes: string[];               // Bao gồm (Source, DB, Docs, etc.)
  
  // Media
  preview_images: string[];         // Ảnh preview
  thumbnail?: string;               // Ảnh thumbnail chính
  demo_url?: string;                // Link demo (nếu có)
  video_url?: string;               // Link video demo (nếu có)
  
  // Academic Info
  grade?: string;                   // Điểm số (nếu có)
  year?: number;                    // Năm thực hiện
  university?: string;              // Trường
  semester?: string;                // Học kỳ
  
  // Metadata
  tags: string[];                   // Tags để tìm kiếm
  downloads: number;                // Lượt tải
  views: number;                    // Lượt xem
  rating: number;                   // Điểm đánh giá (0-5)
  totalReviews?: number;            // Tổng số đánh giá
  
  // Status
  status: ProjectStatus;            // Trạng thái
  isFeatured?: boolean;             // Đồ án nổi bật
  
  // Relations
  MaLoaiSanPham?: ObjectId | ProjectCategory; // ID danh mục (tương thích với Project)
  IdTepAnh?: ObjectId | null;       // ID file ảnh (nếu có)
  
  // Legacy/compatibility fields (để tương thích với Project model)
  id?: ObjectId;
  MaSanPham?: string | ObjectId;
  TenSanPham?: string;              // Tên đồ án (tương thích)
  Gia?: number;                     // Giá (tương thích)
  KhuyenMai?: number;               // Khuyến mãi (tương thích)
  MoTa?: string;                    // Mô tả (tương thích)
  SoLuong?: number;                 // Số lượng (tương thích)
  HinhAnhChinh?: string;            // Ảnh chính (tương thích)
  HinhAnhPhu?: string[];            // Ảnh phụ (tương thích)
  ConHang?: boolean;                // Còn hàng (tương thích)
}

/**
 * Project Review - Đánh giá đồ án
 */
export interface ProjectReview extends BaseDocument {
  IdSanPham: ObjectId | Project;   // ID đồ án (dùng IdSanPham để tương thích)
  IdKhachHang: ObjectId | User;     // ID khách hàng
  NoiDung: string;                  // Nội dung đánh giá
  SoSao: number;                    // Số sao (1-5)
  helpful?: number;                 // Số người thấy hữu ích
}

/**
 * ProjectStats - Thống kê đồ án
 */
export interface ProjectStats {
  summary: {
    totalProjects: number;          // Tổng số đồ án
    totalDownloads: number;         // Tổng lượt tải
    avgRating: number;              // Điểm trung bình
    bySubject: Record<string, number>; // Số lượng theo môn học
    byLevel: Record<ProjectLevel, number>; // Số lượng theo cấp độ
  };
  topProjects: Array<{              // Top đồ án được tải nhiều nhất
    projectId: string;
    title: string;
    downloads: number;
    rating: number;
  }>;
  monthlyStats: Array<{             // Thống kê theo tháng
    year: number;
    month: number;
    projectCount: number;
    downloadCount: number;
  }>;
}

/**
 * RatingStats - Thống kê rating đơn giản của đồ án
 */
export interface ProjectRatingStats {
  avgRating: number;    // Điểm trung bình
  totalReviews: number;  // Tổng số đánh giá
  star5: number;         // Số đánh giá 5 sao
  star4: number;         // Số đánh giá 4 sao
  star3: number;         // Số đánh giá 3 sao
  star2: number;         // Số đánh giá 2 sao
  star1: number;         // Số đánh giá 1 sao
}

/**
 * CreateProjectReviewData - Dữ liệu tạo đánh giá mới
 */
export interface CreateProjectReviewData {
  IdSanPham: string;  // ID đồ án
  NoiDung: string;    // Nội dung đánh giá
  SoSao: number;      // Số sao (1-5)
}

/**
 * ProjectFilter - Bộ lọc đồ án
 */
export interface ProjectFilter {
  subject?: string;                 // Lọc theo môn học
  level?: ProjectLevel;             // Lọc theo cấp độ
  category?: string;                // Lọc theo loại
  techStack?: string[];             // Lọc theo công nghệ
  minPrice?: number;                // Giá tối thiểu
  maxPrice?: number;                // Giá tối đa
  minRating?: number;               // Điểm tối thiểu
  tags?: string[];                  // Lọc theo tags
  search?: string;                  // Tìm kiếm theo title/description
  sortBy?: 'price' | 'downloads' | 'rating' | 'newest' | 'popular';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * ProjectSearchResult - Kết quả tìm kiếm đồ án
 */
export interface ProjectSearchResult {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
