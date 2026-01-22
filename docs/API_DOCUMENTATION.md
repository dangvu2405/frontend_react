# 📚 API Documentation - Tài liệu API đầy đủ

**Base URL:** `http://localhost:3001`

**Authentication:** 
- Bearer Token: `Authorization: Bearer <token>`
- Cookie: `refreshToken` (tự động)

---

## 🔐 Authentication APIs

### 1. Đăng ký
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "hoTen": "Nguyễn Văn A"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": {
    "user": { ... },
    "token": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### 2. Đăng nhập
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "user": { ... },
    "token": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### 3. Đăng xuất
```http
POST /auth/logout
Authorization: Bearer <token>
```

### 4. Refresh Token
```http
POST /auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "refresh_token"
}
```

### 5. Quên mật khẩu
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### 6. Đặt lại mật khẩu
```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset_token",
  "password": "new_password"
}
```

### 7. Google OAuth
```http
GET /auth/google
```

```http
GET /auth/google/callback
```

---

## 👤 User APIs (Cần Authentication)

### 1. Lấy thông tin user hiện tại
```http
GET /user/me
Authorization: Bearer <token>
```

### 2. Cập nhật thông tin user
```http
PUT /user/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "hoTen": "Nguyễn Văn B",
  "soDienThoai": "0123456789"
}
```

### 3. Upload Avatar
```http
POST /user/uploadAvatar
Authorization: Bearer <token>
Content-Type: multipart/form-data

avatar: <file>
```

### 4. Đổi mật khẩu
```http
POST /user/changepassword
Authorization: Bearer <token>
Content-Type: application/json

{
  "oldPassword": "old_password",
  "newPassword": "new_password"
}
```

### 5. Lấy danh sách đơn hàng của user
```http
GET /user/orderUser
Authorization: Bearer <token>
```

### 6. Xem chi tiết đơn hàng
```http
GET /user/orderUser/:id
Authorization: Bearer <token>
```

### 7. Hủy đơn hàng
```http
DELETE /user/orderUser/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "lyDo": "Lý do hủy đơn"
}
```

### 8. Quản lý địa chỉ
```http
GET /user/address
POST /user/address
PATCH /user/address/:id
DELETE /user/address/:id
Authorization: Bearer <token>
```

### 9. Xóa tài khoản
```http
DELETE /user/me/account
Authorization: Bearer <token>
```

---

## 🛒 Cart APIs (Optional Auth - Guest hoặc User)

### 1. Thêm vào giỏ hàng
```http
POST /cart/add-to-cart
Content-Type: application/json

{
  "productId": "product_id",
  "quantity": 1,
  "loaiSP": "Product", // hoặc "MMO"
  "selectedDungTich": "optional"
}
```

### 2. Lấy giỏ hàng
```http
GET /cart/get-cart
```

### 3. Cập nhật giỏ hàng
```http
POST /cart/update-cart
Content-Type: application/json

{
  "items": [
    {
      "productId": "product_id",
      "quantity": 2
    }
  ]
}
```

### 4. Thanh toán (Checkout)
```http
POST /cart/checkout
Content-Type: application/json

{
  "diaChiGiaoHang": "Địa chỉ giao hàng",
  "ghiChu": "Ghi chú",
  "phuongThucThanhToan": "vnpay", // hoặc "wallet", "cod"
  "maVoucher": "optional_voucher_code"
}
```

---

## 📦 Projects APIs (Đồ Án) - Public GET

**⚠️ Lưu ý:** Routes cho Projects (DoAn) đã được cấu hình trong auth middleware nhưng chưa được implement. Cần tạo controller và routes.

### 1. Lấy danh sách đồ án (Chưa implement)
```http
GET /api/projects?page=1&limit=10&search=keyword&category=category_id
```

**Query Parameters (Dự kiến):**
- `page`: Số trang (default: 1)
- `limit`: Số lượng mỗi trang (default: 10)
- `search`: Từ khóa tìm kiếm
- `category`: ID danh mục (MaLoaiDoAn)
- `subject`: Môn học (MonHoc)
- `level`: Cấp độ (CapDo: Đại học, Thạc sĩ, etc.)
- `techStack`: Công nghệ (CongNghe)
- `tags`: Tags
- `minPrice`: Giá tối thiểu
- `maxPrice`: Giá tối đa
- `sortBy`: Sắp xếp (newest, price_asc, price_desc, popular, rating, downloads)

**Response (Dự kiến):**
```json
{
  "success": true,
  "data": {
    "projects": [...],
    "pagination": {
      "currentPage": 1,
      "pageSize": 10,
      "totalPages": 5,
      "totalItems": 50
    }
  }
}
```

### 2. Lấy chi tiết đồ án (Chưa implement)
```http
GET /api/projects/:id
```

**Response (Dự kiến):**
```json
{
  "success": true,
  "data": {
    "project": {
      "_id": "...",
      "TieuDe": "Tên đồ án",
      "MaLoaiDoAn": "...",
      "MonHoc": "Web Development",
      "CapDo": "Đại học",
      "Gia": 500000,
      "KhuyenMai": 10,
      "MoTa": "Mô tả",
      "TinhNang": ["Tính năng 1", "Tính năng 2"],
      "CongNghe": ["React", "Node.js"],
      "BaoGom": ["Source code", "Database"],
      "HinhAnhChinh": "url",
      "AnhPreview": ["url1", "url2"],
      "LinkDemo": "url",
      "DiemSo": "9.5",
      "NamThucHien": 2024,
      "Truong": "Tên trường",
      "Tags": ["tag1", "tag2"],
      "SoLuotTai": 25,
      "DanhGia": 4.8,
      "SoLuongDanhGia": 12,
      "TrangThai": "available",
      "IsFeatured": true
    }
  }
}
```

### 3. Lấy danh mục đồ án (Chưa implement)
```http
GET /api/project-categories
```

**Response (Dự kiến):**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "_id": "...",
        "TenLoaiDoAn": "Web Development",
        "Loai": "subject",
        "MaLoaiCha": null
      }
    ]
  }
}
```

---

## 🎮 MMO Shop APIs - Public GET

### 1. Lấy danh sách sản phẩm MMO
```http
GET /api/mmo-shop/products?page=1&limit=20&category=gold&game=WoW&search=keyword
```

**Query Parameters:**
- `page`: Số trang
- `limit`: Số lượng (max: 100)
- `category`: gold, items, accounts, services, all
- `game`: Tên game
- `search`: Từ khóa
- `minPrice`: Giá tối thiểu
- `maxPrice`: Giá tối đa
- `sortBy`: price_asc, price_desc, newest, popular, name_asc
- `inStock`: true/false

### 2. Lấy chi tiết sản phẩm MMO
```http
GET /api/mmo-shop/products/:id
```

### 3. Lấy danh sách games
```http
GET /api/mmo-shop/games
```

### 4. Lấy danh sách categories
```http
GET /api/mmo-shop/categories
```

---

## ⭐ Reviews APIs

### 1. Lấy thống kê đánh giá (Public)
```http
GET /api/reviews/product/:productId/stats
```

### 2. Lấy danh sách đánh giá (Public)
```http
GET /api/reviews/product/:productId?page=1&limit=10
```

### 3. Tạo đánh giá (Cần Auth)
```http
POST /api/reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "IdSanPham": "product_id",
  "NoiDung": "Nội dung đánh giá",
  "SoSao": 5
}
```

### 4. Lấy đánh giá của tôi (Cần Auth)
```http
GET /api/reviews/product/:productId/my-review
Authorization: Bearer <token>
```

### 5. Lấy tất cả đánh giá của tôi (Cần Auth)
```http
GET /api/reviews/my-reviews
Authorization: Bearer <token>
```

### 6. Cập nhật đánh giá (Cần Auth)
```http
PUT /api/reviews/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "SoSao": 4,
  "NoiDung": "Nội dung cập nhật"
}
```

### 7. Xóa đánh giá (Cần Auth)
```http
DELETE /api/reviews/:id
Authorization: Bearer <token>
```

---

## 💰 Wallet APIs

### 1. Lấy số dư ví
```http
GET /api/wallet?userId=user_id
```
**Note:** Có thể dùng `userId` query param hoặc token

### 2. Nạp tiền vào ví
```http
POST /api/wallet/deposit
Content-Type: application/json

{
  "userId": "user_id", // optional nếu có token
  "amount": 100000,
  "paymentMethod": "vnpay", // vnpay, momo, bank, cash
  "transactionId": "optional"
}
```

### 3. Lấy lịch sử giao dịch
```http
GET /api/wallet/transactions?userId=user_id&page=1&limit=20&type=deposit&status=completed
```

**Query Parameters:**
- `userId`: ID user (optional)
- `page`: Số trang
- `limit`: Số lượng
- `type`: deposit, withdraw, refund, adjustment
- `status`: pending, completed, failed, cancelled
- `startDate`: Ngày bắt đầu
- `endDate`: Ngày kết thúc

### 4. Thanh toán bằng ví (Cần Auth)
```http
POST /api/wallet/pay
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "order_id",
  "amount": 500000
}
```

### 5. Lấy thống kê giao dịch
```http
GET /api/wallet/statistics?userId=user_id&startDate=2024-01-01&endDate=2024-12-31
```

---

## 💬 Chat APIs (Cần Auth)

### 1. Lấy hoặc tạo phòng chat
```http
GET /chat/room
Authorization: Bearer <token>
```

### 2. Lấy thông tin phòng chat
```http
GET /chat/room/:chatRoomId
Authorization: Bearer <token>
```

### 3. Lấy tin nhắn
```http
GET /chat/room/:chatRoomId/messages?page=1&limit=50
Authorization: Bearer <token>
```

### 4. Đánh dấu đã đọc
```http
POST /chat/room/:chatRoomId/read
Authorization: Bearer <token>
```

### 5. Gửi tin nhắn (WebSocket)
```javascript
// Sử dụng Socket.IO
socket.emit('sendMessage', {
  chatRoomId: 'room_id',
  message: 'Nội dung tin nhắn'
});
```

---

## 💳 Payment APIs

### 1. Tạo thanh toán (Cần Auth)
```http
POST /payment/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "order_id",
  "paymentMethod": "vnpay" // hoặc "momo"
}
```

### 2. VNPay Callback
```http
GET /payment/vnpay-callback?vnp_ResponseCode=00&vnp_TxnRef=...
```

### 3. MoMo Callback
```http
GET /payment/momo-callback?resultCode=0&...
```

---

## 🔧 Admin APIs (Cần Auth + Admin Role)

**Tất cả routes admin đều cần:**
- `Authorization: Bearer <token>`
- User phải có role `Admin`

### Roles Management
```http
POST /admin/roles
Body: { "TenVaiTro": "Role Name", "MoTa": "Description" }

GET /admin/roles

GET /admin/roles/:id

PUT /admin/roles/:id
Body: { "TenVaiTro": "New Name", "MoTa": "New Description" }

DELETE /admin/roles/:id
```

### Users Management
```http
GET /admin/users/me
PUT /admin/users/me
DELETE /admin/users/me

POST /admin/users
Body: { "email", "password", "hoTen", "soDienThoai", "maVaiTro" }

GET /admin/users?page=1&limit=10&search=keyword&role=role_id

PUT /admin/users/:id
Body: { "hoTen", "soDienThoai", "maVaiTro", "trangThai" }

DELETE /admin/users/:id
```

### Customers Management
```http
GET /admin/customers?page=1&limit=10&search=keyword

PUT /admin/customers/:id
Body: { "hoTen", "soDienThoai", "trangThai" }

DELETE /admin/customers/:id

POST /admin/customers/:id/lock
Body: { "lyDo": "Lý do khóa" }

POST /admin/customers/:id/change-role
Body: { "roleId": "new_role_id" }
```

### Orders Management
```http
GET /admin/orders?page=1&limit=10&status=pending&startDate=2024-01-01&endDate=2024-12-31

GET /admin/orders/:id

PUT /admin/orders/:id/status
Body: { "trangThai": "confirmed" }

GET /admin/orders/stats
```

### Cart Management
```http
GET /admin/carts?page=1&limit=10

GET /admin/carts/:id

DELETE /admin/cart/items/:id
```

### Wallet Management
```http
GET /admin/wallets?page=1&limit=10

GET /admin/wallets/:userId

POST /admin/wallets/:userId/adjust
Body: { "amount": 100000, "type": "increase", "description": "Điều chỉnh số dư" }

GET /admin/wallets/transactions?page=1&limit=20&type=deposit&status=completed

GET /admin/wallets/statistics?startDate=2024-01-01&endDate=2024-12-31
```

### MMO Shop Management
```http
POST /admin/mmo-shop/products
Body: {
  "Ten": "Product Name",
  "Loai": "gold", // gold, items, accounts, services
  "Game": "WoW",
  "Gia": 500000,
  "SoLuong": 100,
  "MoTa": "Description",
  "HinhAnh": "url"
}

GET /admin/mmo-shop/products?page=1&limit=20&status=active&game=WoW

PUT /admin/mmo-shop/products/:id
Body: { "Ten", "Gia", "SoLuong", "TrangThai", ... }

DELETE /admin/mmo-shop/products/:id

GET /admin/mmo-shop/stats
```

### Reviews Management
```http
GET /admin/reviews?page=1&limit=20&productId=product_id&rating=5

GET /admin/reviews/:id

PUT /admin/reviews/:id
Body: { "SoSao": 4, "NoiDung": "Updated review" }

DELETE /admin/reviews/:id

DELETE /admin/reviews
Body: { "reviewIds": ["id1", "id2"] }

GET /admin/reviews/stats
```

### Vouchers Management
```http
POST /admin/vouchers
Body: {
  "MaVoucher": "CODE10",
  "NoiDung": "Giảm 10%",
  "GiaTri": 10, // Phần trăm (0-100)
  "SoLuong": 100,
  "NgayHetHan": "2024-12-31",
  "GiaTriToiThieu": 100000
}

GET /admin/vouchers?page=1&limit=20&status=active

GET /admin/vouchers/stats

GET /admin/vouchers/:id

PUT /admin/vouchers/:id
Body: { "GiaTri", "SoLuong", "NgayHetHan", "TrangThai" }

DELETE /admin/vouchers/:id
```

### Statistics & Dashboard
```http
GET /admin/stats
Response: {
  "totalUsers": 100,
  "totalOrders": 500,
  "totalRevenue": 50000000,
  "totalProducts": 50,
  ...
}

GET /admin/stats/orders?startDate=2024-01-01&endDate=2024-12-31

GET /admin/stats/revenue?period=monthly&startDate=2024-01-01&endDate=2024-12-31

GET /admin/stats/users?period=monthly
```

---

## 📄 Other APIs

### Health Check
```http
GET /api/health
```

### Upload Image
```http
POST /api/upload
Content-Type: application/json

{
  "image": "data:image/png;base64,..."
}
```

---

## 🔑 Authentication Headers

### Bearer Token
```http
Authorization: Bearer <jwt_token>
```

### Cookie (tự động)
```http
Cookie: refreshToken=<refresh_token>
```

---

## 📝 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Thông báo thành công",
  "data": { ... },
  "pagination": { // nếu có
    "currentPage": 1,
    "pageSize": 10,
    "totalPages": 5,
    "totalItems": 50
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Thông báo lỗi",
  "error": "Chi tiết lỗi (development only)"
}
```

---

## 🚨 Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## 📌 Notes

1. **Public Routes (không cần token):**
   - GET `/api/projects/*`
   - GET `/api/mmo-shop/*`
   - GET `/api/reviews/product/*` (trừ `/my-review`)
   - GET `/api/wallet` (có thể dùng `userId` query param)
   - POST `/api/wallet/deposit` (có thể dùng `userId` trong body)

2. **Protected Routes (cần token):**
   - Tất cả `/user/*`
   - Tất cả `/admin/*`
   - Tất cả `/chat/*`
   - POST `/api/reviews`
   - POST `/api/wallet/pay`

3. **Optional Auth (Guest hoặc User):**
   - `/cart/*`

4. **Base URL:** `http://localhost:3001` (development)
   - Production: Cập nhật trong `.env` file

---

## 🔗 WebSocket Events

### Client → Server
- `sendMessage` - Gửi tin nhắn
- `joinRoom` - Tham gia phòng chat
- `leaveRoom` - Rời phòng chat

### Server → Client
- `newMessage` - Tin nhắn mới
- `messageRead` - Tin nhắn đã đọc
- `userTyping` - User đang gõ
- `userOnline` - User online
- `userOffline` - User offline

---

## 📦 Example Requests

### Axios Example
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Thêm token vào header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Lấy danh sách đồ án
const getProjects = async () => {
  const response = await api.get('/api/projects', {
    params: {
      page: 1,
      limit: 10,
      search: 'website'
    }
  });
  return response.data;
};

// Đăng nhập
const login = async (email, password) => {
  const response = await api.post('/auth/login', {
    email,
    password
  });
  localStorage.setItem('token', response.data.data.token);
  return response.data;
};
```

---

**Last Updated:** 2024
**Version:** 1.0.0
