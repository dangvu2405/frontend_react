/**
 * Order models
 * Định nghĩa các types liên quan đến đơn hàng
 */

import type { BaseDocument, ObjectId } from './common';
import type { Product, ProductVolumeOption } from './product';

/**
 * OrderProduct - Sản phẩm trong đơn hàng
 */
export interface OrderProduct {
  IdSanPham?: ObjectId | Product;  // ID sản phẩm
  TenSanPham?: string;              // Tên sản phẩm (lưu để tránh thay đổi)
  SoLuong?: number;                 // Số lượng
  Gia?: number;                     // Giá tại thời điểm đặt
  ThanhTien?: number;               // Thành tiền (Gia * SoLuong)
  GiaTaiThoiDiemDat?: number;       // Giá tại thời điểm đặt hàng
  SelectedDungTich?: ProductVolumeOption;
  [key: string]: unknown;           // Cho phép thêm field khác
}

/**
 * VNPayMeta - Metadata từ VNPay payment gateway
 */
export interface VNPayMeta {
  VNPayTransactionRef?: string | null;    // Mã tham chiếu giao dịch
  VNPayCreateDate?: string | null;       // Ngày tạo giao dịch
  VNPayExpireDate?: string | null;      // Ngày hết hạn
  VNPayResponseCode?: string | null;     // Mã phản hồi
  VNPayResponseMessage?: string | null;  // Thông điệp phản hồi
  VNPayTransactionId?: string | null;     // ID giao dịch VNPay
  VNPayBankCode?: string | null;         // Mã ngân hàng
  VNPayPayDate?: string | null;          // Ngày thanh toán
}

/**
 * CustomerInfo - Thông tin khách hàng trong đơn hàng (populated từ backend)
 */
export interface CustomerInfo {
  _id?: ObjectId | string;
  HoTen?: string;
  Email?: string;
  SoDienThoai?: string;
  DiaChi?: string;
}

/**
 * OrderShippingInfo - Thông tin nhận hàng chi tiết
 */
export interface OrderShippingInfo {
  HoTen: string;
  Email?: string;
  SoDienThoai: string;
  DiaChiChiTiet: string;
  PhuongXa?: string;
  QuanHuyen: string;
  TinhThanh: string;
}

/**
 * Order - Đơn hàng trong hệ thống
 */
export interface Order extends BaseDocument, VNPayMeta {
  MaDonHang?: string;                    // Mã đơn hàng (unique, tự động generate từ backend)
  MaKhachHang: string;                  // ID khách hàng (string ID)
  IdKhachHang?: CustomerInfo | null;    // Thông tin khách hàng (populated từ backend)
  SanPham: OrderProduct[];              // Danh sách sản phẩm
  TongTien: number;                     // Tổng tiền đơn hàng
  DiaChi: string;                       // Địa chỉ giao hàng (JSON string hoặc ObjectId)
  ThongTinNhanHang?: OrderShippingInfo | null; // Thông tin nhận hàng chi tiết
  PhiVanChuyen: number;                 // Phí vận chuyển
  PhuongThucThanhToan: 'COD' | 'VNPay' | 'VNPayQR' | 'BANK' | 'CARD' | 'MoMo' | 'Chuyển khoản'; // Phương thức thanh toán
  TrangThai: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled'; // Trạng thái đơn hàng
  GhiChu?: string;                      // Ghi chú từ khách hàng
  LyDoHuy?: string | null;              // Lý do hủy (nếu có)
  NgayHuy?: string | null;              // Ngày hủy
  TrangThaiThanhToan: 'pending' | 'paid' | 'failed' | 'refunded'; // Trạng thái thanh toán
  Voucher?: string | null;              // Mã voucher đã sử dụng
}


