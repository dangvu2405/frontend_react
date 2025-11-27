/**
 * User models và service types
 * Định nghĩa các types liên quan đến người dùng, xác thực và quản lý tài khoản
 */

import type { BaseDocument, ObjectId } from './common';

/**
 * Role - Vai trò của người dùng trong hệ thống
 */
export interface Role extends BaseDocument {
  TenVaiTro: 'Admin' | 'Customer' | 'Staff' | string;
  MoTa?: string | null;
}

/**
 * UserAddress - Địa chỉ giao hàng của người dùng
 */
export interface UserAddress {
  _id?: ObjectId;
  id?: ObjectId;
  HoTen: string;              // Họ và tên người nhận
  SoDienThoai: string;        // Số điện thoại
  DiaChiChiTiet: string;      // Địa chỉ chi tiết (số nhà, tên đường)
  PhuongXa?: string;          // Phường/Xã
  QuanHuyen: string;          // Quận/Huyện
  TinhThanh: string;          // Tỉnh/Thành phố
  MacDinh?: boolean;          // Địa chỉ mặc định
}

/**
 * SocialAccount - Thông tin tài khoản mạng xã hội (OAuth)
 */
export interface SocialAccount {
  id?: string | null;         // ID từ provider (Google, Facebook)
  accessToken?: string | null; // Access token từ provider
}

/**
 * User - Thông tin người dùng trong hệ thống
 */
export interface User extends BaseDocument {
  TenDangNhap: string;        // Tên đăng nhập (unique)
  HoTen: string;              // Họ và tên
  Email: string;               // Email (unique)
  TrangThai: 'active' | 'inactive'; // Trạng thái tài khoản
  MaVaiTro: Role | ObjectId;  // Vai trò (Admin, Customer, Staff)
  AvatarId?: string | null;    // ID avatar (Cloudinary public_id)
  AvatarUrl?: string | null;   // URL avatar
  NgaySinh?: string | null;    // Ngày sinh
  GioiTinh?: 'male' | 'female' | 'other' | null; // Giới tính
  SoDienThoai?: string;        // Số điện thoại
  DiaChi: UserAddress[];      // Danh sách địa chỉ
  facebook?: SocialAccount;    // Thông tin Facebook OAuth
  google?: SocialAccount;      // Thông tin Google OAuth
}

/**
 * Session - Session đăng nhập của người dùng
 */
export interface Session extends BaseDocument {
  userId: ObjectId | User;    // ID người dùng
  refreshToken: string;       // Refresh token
  expiresAt: string;          // Thời gian hết hạn
}

/**
 * LoginHistory - Lịch sử đăng nhập của người dùng
 */
export interface LoginHistory extends BaseDocument {
  MaTaiKhoan: ObjectId | User; // ID tài khoản
  DiaChiIP: string;             // Địa chỉ IP
  ThietBi?: string;             // Thiết bị đăng nhập
  TrinhDuyet?: string;          // Trình duyệt
  TrangThai: 'success' | 'failed'; // Trạng thái đăng nhập
  ThongTinThem?: Record<string, unknown>; // Thông tin bổ sung
}

/**
 * CustomerWithStats - Thông tin khách hàng kèm thống kê
 * Dùng cho trang admin để hiển thị thông tin khách hàng kèm số liệu
 */
export type CustomerWithStats = User & {
  orderCount?: number;         // Số lượng đơn hàng
  totalRevenue?: number;       // Tổng doanh thu từ khách hàng này
};

// ==========================
// USER SERVICE TYPES
// ==========================

/**
 * UpdateUserData - Dữ liệu cập nhật thông tin người dùng
 * Dùng cho API PUT /user/me
 */
export interface UpdateUserData {
  hoten?: string;     // Họ và tên
  email?: string;     // Email
  sdt?: string;       // Số điện thoại
  diaChi?: string;    // Địa chỉ
}

/**
 * ChangePasswordData - Dữ liệu đổi mật khẩu
 * Dùng cho API POST /user/changepassword
 */
export interface ChangePasswordData {
  oldPassword: string;  // Mật khẩu cũ
  newPassword: string;  // Mật khẩu mới
}

// ==========================
// AUTH SERVICE TYPES
// ==========================

/**
 * LoginCredentials - Thông tin đăng nhập
 * Dùng cho API POST /auth/login
 */
export interface LoginCredentials {
  username: string;  // Tên đăng nhập
  password: string;  // Mật khẩu
}

/**
 * RegisterData - Dữ liệu đăng ký tài khoản mới
 * Dùng cho API POST /auth/register
 */
export interface RegisterData {
  hoten: string;      // Họ và tên
  username: string;   // Tên đăng nhập
  email: string;      // Email
  sdt?: string;       // Số điện thoại (tùy chọn)
  password: string;   // Mật khẩu
}

/**
 * AuthResponse - Response từ API đăng nhập/đăng ký
 */
export interface AuthResponse {
  message: string;    // Thông báo
  accessToken: string; // Access token để xác thực
  user?: {            // Thông tin user (tùy chọn)
    id: string;
    username: string;
    email: string;
    fullName: string;
  };
}



