/**
 * Admin service types
 * Định nghĩa các payload types cho các API quản trị viên
 */

// ==========================
// ADMIN SERVICE TYPES
// ==========================

/**
 * AdminProjectPayload - Payload tạo/cập nhật đồ án
 * Dùng cho API POST /admin/projects và PUT /admin/projects/:id
 */
export interface AdminProjectIncludesOptionPayload {
  value: number;
  label?: string;
  priceDiff?: number;
  stockDiff?: number;
  sku?: string;
  isDefault?: boolean;
}

export interface AdminProjectPayload {
  TenSanPham?: string;        // Tên đồ án
  MoTa?: string;              // Mô tả
  Gia?: number;               // Giá
  KhuyenMai?: number;         // Phần trăm giảm giá
  DungTich?: number;          // (Deprecated) Bao gồm legacy
  DungTichOptions?: AdminProjectIncludesOptionPayload[]; // Danh sách bao gồm
  SoLuong?: number;           // Số lượng
  MaLoaiSanPham?: string;     // ID danh mục
  HinhAnhChinh?: string;      // URL ảnh chính
  HinhAnhPhu?: string[];      // Danh sách URL ảnh phụ
  [key: string]: unknown;         // Cho phép thêm các field khác
}

/**
 * AdminCategoryPayload - Payload tạo/cập nhật danh mục
 * Dùng cho API POST /admin/categories và PUT /admin/categories/:id
 */
export interface AdminCategoryPayload {
  TenLoaiSanPham: string; // Tên loại đồ án
}

/**
 * AdminRolePayload - Payload tạo/cập nhật vai trò
 * Dùng cho API POST /admin/roles và PUT /admin/roles/:id
 */
export interface AdminRolePayload {
  TenVaiTro: string; // Tên vai trò (Admin, Customer, Staff)
}

/**
 * AdminUserPayload - Payload tạo/cập nhật người dùng
 * Dùng cho API POST /admin/users và PUT /admin/users/:id
 */
export interface AdminUserPayload {
  hoten?: string;     // Họ và tên
  email?: string;     // Email
  sdt?: string;       // Số điện thoại
  diaChi?: string;    // Địa chỉ
  [key: string]: unknown; // Cho phép thêm các field khác
}

/**
 * AdminInventoryPayload - Payload cập nhật tồn kho
 * Dùng cho API POST /admin/inventory/:id/increase, decrease
 * và PUT /admin/inventory/:id
 */
export interface AdminInventoryPayload {
  amount?: number;    // Số lượng thay đổi (cho increase/decrease)
  quantity?: number;  // Số lượng mới (cho setStock)
}

/**
 * AdminVoucherPayload - Payload tạo mã giảm giá
 * Dùng cho API POST /admin/vouchers
 */
export interface AdminVoucherPayload {
  MaVoucher: string;  // Mã voucher (unique)
  NoiDung: string;   // Nội dung mô tả
  GiaTri: number;     // Giá trị giảm giá (% hoặc số tiền)
  SoLuong: number;    // Số lượng voucher
  NgayTao?: string;   // Ngày tạo (ISO string)
}

/**
 * AdminUpdateVoucherPayload - Payload cập nhật mã giảm giá
 * Dùng cho API PUT /admin/vouchers/:id
 */
export interface AdminUpdateVoucherPayload {
  MaVoucher?: string;  // Mã voucher
  NoiDung?: string;   // Nội dung mô tả
  GiaTri?: number;     // Giá trị giảm giá
  SoLuong?: number;    // Số lượng voucher
  NgayTao?: string;    // Ngày tạo
}

