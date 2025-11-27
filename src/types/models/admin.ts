/**
 * Admin service types
 * Định nghĩa các payload types cho các API quản trị viên
 */

// ==========================
// ADMIN SERVICE TYPES
// ==========================

/**
 * AdminProductPayload - Payload tạo/cập nhật sản phẩm
 * Dùng cho API POST /admin/products và PUT /admin/products/:id
 */
export interface AdminProductVolumeOptionPayload {
  value: number;
  label?: string;
  priceDiff?: number;
  stockDiff?: number;
  sku?: string;
  isDefault?: boolean;
}

export interface AdminProductPayload {
  TenSanPham?: string;        // Tên sản phẩm
  MoTa?: string;              // Mô tả
  Gia?: number;               // Giá
  KhuyenMai?: number;         // Phần trăm giảm giá
  DungTich?: number;          // (Deprecated) Dung tích legacy
  DungTichOptions?: AdminProductVolumeOptionPayload[]; // Danh sách dung tích
  SoLuong?: number;           // Số lượng
  MaLoaiSanPham?: string;     // ID danh mục
  HinhAnhChinh?: string;      // URL ảnh chính
  HinhAnhPhu?: string[];      // Danh sách URL ảnh phụ
  [key: string]: any;         // Cho phép thêm các field khác
}

/**
 * AdminCategoryPayload - Payload tạo/cập nhật danh mục
 * Dùng cho API POST /admin/categories và PUT /admin/categories/:id
 */
export interface AdminCategoryPayload {
  TenLoaiSanPham: string; // Tên loại sản phẩm
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
  [key: string]: any; // Cho phép thêm các field khác
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

