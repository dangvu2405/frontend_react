/**
 * Payment models
 * Định nghĩa các types liên quan đến thanh toán
 */

import type { Order } from './order';

/**
 * PaymentResponse - Response từ API thanh toán (VNPay, etc.)
 */
export interface PaymentResponse {
  message?: string;         // Thông báo
  paymentUrl?: string;      // URL thanh toán (cho VNPay)
  qrCode?: string;          // QR code (cho VNPayQR)
  orderId?: string;         // ID đơn hàng
  transactionRef?: string;  // Mã tham chiếu giao dịch
  error?: string;           // Lỗi (nếu có)
  [key: string]: unknown;    // Cho phép thêm field khác
}

/**
 * CheckoutResponse - Response từ API checkout
 * Dùng cho API POST /cart/checkout
 */
export interface CheckoutResponse {
  message?: string;                    // Thông báo
  orderId?: string;                    // ID đơn hàng
  _id?: string | { toString(): string }; // ID đơn hàng (alternative)
  donHang?: Partial<Order>;            // Thông tin đơn hàng
  data?: {                              // Dữ liệu bổ sung
    donHang?: Partial<Order>;
    [key: string]: unknown;
  };
  [key: string]: unknown;               // Cho phép thêm field khác
}


