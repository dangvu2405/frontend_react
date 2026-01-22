/**
 * Wallet models - Ví điện tử
 * Định nghĩa các types liên quan đến ví điện tử của khách hàng
 */

import type { BaseDocument, ObjectId } from './common';
import type { User } from './user';
import type { Order } from './order';

/**
 * Transaction Type - Loại giao dịch
 */
export type TransactionType = 
  | 'deposit'        // Nạp tiền
  | 'withdraw'       // Rút tiền
  | 'payment'        // Thanh toán đơn hàng
  | 'refund'         // Hoàn tiền
  | 'admin_adjust';  // Admin điều chỉnh

/**
 * Transaction Status - Trạng thái giao dịch
 */
export type TransactionStatus = 
  | 'pending'        // Đang chờ xử lý
  | 'completed'      // Hoàn thành
  | 'failed'         // Thất bại
  | 'cancelled';     // Đã hủy

/**
 * Payment Method for Wallet - Phương thức thanh toán để nạp tiền
 */
export type WalletPaymentMethod = 
  | 'vnpay'          // VNPay
  | 'momo'           // MoMo
  | 'bank_transfer'  // Chuyển khoản ngân hàng
  | 'cash';          // Tiền mặt

/**
 * Wallet Transaction - Giao dịch ví
 */
export interface WalletTransaction extends BaseDocument {
  IdKhachHang: ObjectId | User;        // ID khách hàng
  type: TransactionType;                // Loại giao dịch
  amount: number;                      // Số tiền (dương = nạp, âm = rút/thanh toán)
  balanceBefore: number;                // Số dư trước giao dịch
  balanceAfter: number;                // Số dư sau giao dịch
  status: TransactionStatus;           // Trạng thái
  description: string;                  // Mô tả giao dịch
  paymentMethod?: WalletPaymentMethod;  // Phương thức thanh toán (nếu là nạp tiền)
  orderId?: ObjectId | Order;          // ID đơn hàng (nếu là thanh toán/hoàn tiền)
  transactionCode?: string;            // Mã giao dịch (từ VNPay, MoMo, etc.)
  adminNote?: string;                  // Ghi chú của admin (nếu là điều chỉnh)
  processedBy?: ObjectId | User;       // Người xử lý (admin)
  processedAt?: string;                // Thời gian xử lý
}

/**
 * Wallet - Ví điện tử của khách hàng
 */
export interface Wallet extends BaseDocument {
  IdKhachHang: ObjectId | User;        // ID khách hàng
  balance: number;                     // Số dư hiện tại
  totalDeposited: number;              // Tổng số tiền đã nạp
  totalSpent: number;                  // Tổng số tiền đã chi tiêu
  lastTransactionAt?: string;          // Thời gian giao dịch cuối cùng
  isActive: boolean;                   // Trạng thái hoạt động
  lockedAt?: string;                   // Thời gian khóa (nếu bị khóa)
  lockReason?: string;                 // Lý do khóa
}

/**
 * DepositRequest - Yêu cầu nạp tiền
 */
export interface DepositRequest {
  amount: number;                      // Số tiền nạp
  paymentMethod: WalletPaymentMethod;  // Phương thức thanh toán
  description?: string;                 // Mô tả (tùy chọn)
}

/**
 * DepositResponse - Phản hồi khi nạp tiền
 */
export interface DepositResponse {
  transactionId: string;               // ID giao dịch
  paymentUrl?: string;                 // URL thanh toán (nếu dùng VNPay/MoMo)
  qrCode?: string;                     // QR code (nếu dùng MoMo)
  status: TransactionStatus;           // Trạng thái
  message: string;                      // Thông báo
}

/**
 * WalletStats - Thống kê ví
 */
export interface WalletStats {
  totalWallets: number;                // Tổng số ví
  totalBalance: number;                // Tổng số dư
  totalDeposited: number;               // Tổng số tiền đã nạp
  totalSpent: number;                   // Tổng số tiền đã chi
  activeWallets: number;               // Số ví đang hoạt động
  lockedWallets: number;               // Số ví bị khóa
  transactionsToday: number;            // Số giao dịch hôm nay
  transactionsThisMonth: number;       // Số giao dịch tháng này
}

/**
 * AdminWalletAdjustment - Điều chỉnh ví của admin
 */
export interface AdminWalletAdjustment {
  walletId: string;                    // ID ví
  amount: number;                       // Số tiền điều chỉnh (dương = thêm, âm = trừ)
  type: 'add' | 'subtract';            // Loại điều chỉnh
  reason: string;                      // Lý do điều chỉnh
  note?: string;                       // Ghi chú
}
