/**
 * Goods Receipt models
 * Định nghĩa các types liên quan đến phiếu nhập hàng
 */

import type { BaseDocument, ObjectId } from './common';
import type { Project } from './project';
import type { User } from './user';

/**
 * GoodsReceiptProject - Đồ án trong phiếu nhập
 */
export interface GoodsReceiptProject {
  MaSanPham: ObjectId | Project; // ID đồ án
  TenSanPham: string;             // Tên đồ án
  SoLuong: number;                // Số lượng nhập
  GiaNhap: number;                // Giá nhập
  ThanhTien: number;              // Thành tiền (GiaNhap * SoLuong)
}

/**
 * GoodsReceipt - Phiếu nhập hàng
 */
export interface GoodsReceipt extends BaseDocument {
  MaNhaCungCap: string;           // Mã nhà cung cấp
  TenNhaCungCap: string;          // Tên nhà cung cấp
  SanPham: GoodsReceiptProject[]; // Danh sách đồ án
  TongTien: number;               // Tổng tiền
  MaNguoiNhap: ObjectId | User;  // ID người nhập
  TrangThai: 'pending' | 'approved' | 'received' | 'cancelled'; // Trạng thái
  NgayNhap: string;               // Ngày nhập
  GhiChu?: string;                // Ghi chú
}


