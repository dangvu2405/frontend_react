/**
 * Cart models
 * Định nghĩa các types liên quan đến giỏ hàng
 */

import type { BaseDocument, ObjectId } from './common';
import type { Product } from './product';
import type { User } from './user';

/**
 * CartItem - Item trong giỏ hàng
 */
export interface CartItem {
  IdSanPham: ObjectId | Product; // ID sản phẩm
  TenSanPham: string;            // Tên sản phẩm
  Gia: number;                   // Giá sản phẩm
  SoLuong: number;               // Số lượng
  ThanhTien: number;             // Thành tiền (Gia * SoLuong)
}

/**
 * Cart - Giỏ hàng của khách hàng
 */
export interface Cart extends BaseDocument {
  IdKhachHang: ObjectId | User;  // ID khách hàng
  Items: CartItem[];             // Danh sách sản phẩm trong giỏ
  TongTien?: number;             // Tổng tiền (tính toán)
  TongSoLuong?: number;          // Tổng số lượng (tính toán)
}


