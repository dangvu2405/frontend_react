/**
 * Goods Receipt models
 * Định nghĩa các types liên quan đến phiếu nhập hàng
 */

import type { BaseDocument, ObjectId } from './common';
import type { Product } from './product';
import type { User } from './user';

/**
 * GoodsReceiptProduct - Sản phẩm trong phiếu nhập
 */
export interface GoodsReceiptProduct {
  MaSanPham: ObjectId | Product; // ID sản phẩm
  TenSanPham: string;             // Tên sản phẩm
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
  SanPham: GoodsReceiptProduct[]; // Danh sách sản phẩm
  TongTien: number;               // Tổng tiền
  MaNguoiNhap: ObjectId | User;  // ID người nhập
  TrangThai: 'pending' | 'approved' | 'received' | 'cancelled'; // Trạng thái
  NgayNhap: string;               // Ngày nhập
  GhiChu?: string;                // Ghi chú
}


