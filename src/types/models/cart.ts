/**
 * Cart models
 * Định nghĩa các types liên quan đến giỏ hàng
 */

import type { BaseDocument, ObjectId } from './common';
import type { Project, ProjectIncludesOption } from './product';
import type { User } from './user';

export interface CartIncludesSelection {
  value: number;
  label: string;
  priceDiff?: number;
  sku?: string;
}

/**
 * CartItem - Item trong giỏ hàng
 */
export interface CartItem {
  IdSanPham: ObjectId | Project; // ID đồ án
  TenSanPham: string;            // Tên đồ án
  Gia: number;                   // Giá đồ án
  SoLuong: number;               // Số lượng
  ThanhTien: number;             // Thành tiền (Gia * SoLuong)
  SelectedDungTich?: CartIncludesSelection | ProjectIncludesOption;
}

/**
 * Cart - Giỏ hàng của khách hàng
 */
export interface Cart extends BaseDocument {
  IdKhachHang: ObjectId | User;  // ID khách hàng
  Items: CartItem[];             // Danh sách đồ án trong giỏ
  TongTien?: number;             // Tổng tiền (tính toán)
  TongSoLuong?: number;          // Tổng số lượng (tính toán)
}


