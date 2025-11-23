/**
 * Voucher models
 * Định nghĩa các types liên quan đến mã giảm giá
 */

import type { ObjectId } from './common';

/**
 * Voucher - Mã giảm giá
 * ⚠️ Backend Voucher schema không có timestamps, nên không extend BaseDocument
 */
export interface Voucher {
  _id: ObjectId;        // ✅ Luôn có trong MongoDB
  MaVoucher: string;    // Mã voucher (unique)
  NoiDung: string;     // Nội dung mô tả
  GiaTri: number;       // Giá trị giảm giá (% hoặc số tiền)
  SoLuong: number;      // Số lượng voucher còn lại
  NgayTao?: string;     // Ngày tạo (ISO string, từ backend Date)
  NgayHetHan?: string;  // Ngày hết hạn (ISO string, từ backend Date)
  TrangThai?: 'active' | 'inactive' | 'expired';  // Trạng thái voucher
  GiaTriToiThieu?: number;  // Giá trị tối thiểu để áp dụng voucher
  // ❌ Không có createdAt, updatedAt (backend không có timestamps)
}

/**
 * VoucherStats - Thống kê voucher
 * Dùng cho trang admin
 */
export interface VoucherStats {
  summary: {
    totalVouchers: number;    // Tổng số voucher
    totalQuantity: number;     // Tổng số lượng
    avgGiaTri: number;        // Giá trị trung bình
    minGiaTri: number;        // Giá trị nhỏ nhất
    maxGiaTri: number;        // Giá trị lớn nhất
    lowStock: number;         // Số voucher sắp hết (low stock)
  };
  giaTriDistribution: Array<{ // Phân bố theo giá trị
    _id: string;              // Giá trị
    count: number;            // Số lượng voucher
    totalQuantity: number;    // Tổng số lượng
  }>;
}


