# 📋 PROMPT: TẠO API CHO TẠP HÓA MMO

## 🎯 YÊU CẦU TỔNG QUAN

Tạo hệ thống API backend cho tính năng **Tạp hóa MMO** (MMO Shop) - nơi khách hàng có thể mua bán Gold, Items, Accounts và Dịch vụ game MMO. API cần tích hợp với hệ thống hiện tại (Cart, Orders, Payments) và có đầy đủ chức năng CRUD cho Admin.

---

## 🗄️ 1. DATABASE SCHEMA

### 1.1 Bảng `mmo_products` (Sản phẩm MMO)

```sql
CREATE TABLE mmo_products (
  id VARCHAR(50) PRIMARY KEY,
  name NVARCHAR(255) NOT NULL,
  category ENUM('gold', 'items', 'accounts', 'services') NOT NULL,
  game VARCHAR(100) NOT NULL,
  price DECIMAL(15, 2) NOT NULL CHECK (price >= 0),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  description TEXT,
  image_url VARCHAR(500),
  status ENUM('active', 'inactive', 'out_of_stock') DEFAULT 'active',
  
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(50),
  updated_by VARCHAR(50),
  
  -- Indexes
  INDEX idx_category (category),
  INDEX idx_game (game),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 1.2 Bảng `mmo_product_details` (Chi tiết sản phẩm - tùy chọn)

```sql
CREATE TABLE mmo_product_details (
  id VARCHAR(50) PRIMARY KEY,
  product_id VARCHAR(50) NOT NULL,
  detail_type VARCHAR(50), -- 'server', 'region', 'faction', 'level', etc.
  detail_value VARCHAR(255),
  additional_price DECIMAL(15, 2) DEFAULT 0,
  
  FOREIGN KEY (product_id) REFERENCES mmo_products(id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 1.3 Bảng `mmo_orders` (Đơn hàng MMO - nếu cần tracking riêng)

```sql
CREATE TABLE mmo_orders (
  id VARCHAR(50) PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL, -- Reference to main orders table
  product_id VARCHAR(50) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(15, 2) NOT NULL,
  total_price DECIMAL(15, 2) NOT NULL,
  delivery_status ENUM('pending', 'processing', 'delivered', 'cancelled') DEFAULT 'pending',
  delivery_method VARCHAR(50), -- 'in_game', 'email', 'manual', etc.
  delivery_info TEXT, -- Character name, server, email, etc.
  delivered_at DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES mmo_products(id),
  INDEX idx_order_id (order_id),
  INDEX idx_product_id (product_id),
  INDEX idx_delivery_status (delivery_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 🔌 2. API ENDPOINTS

### 2.1 Customer Endpoints (Public/Authenticated)

#### **GET `/api/mmo-shop/products`** - Lấy danh sách sản phẩm

**Query Parameters:**
```typescript
{
  page?: number;           // Default: 1
  limit?: number;          // Default: 20, Max: 100
  category?: 'gold' | 'items' | 'accounts' | 'services' | 'all';
  game?: string;           // Filter by game name
  search?: string;         // Search in name, description
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popular' | 'name_asc';
  inStock?: boolean;       // Only show products with stock > 0
}
```

**Response Format:**
```typescript
{
  success: true,
  data: MMOProduct[],
  pagination: {
    currentPage: number,
    pageSize: number,
    totalPages: number,
    totalItems: number
  }
}
```

**MMOProduct Type:**
```typescript
interface MMOProduct {
  id: string;
  name: string;
  category: 'gold' | 'items' | 'accounts' | 'services';
  game: string;
  price: number;
  stock: number;
  description: string;
  image?: string;
  status: 'active' | 'inactive' | 'out_of_stock';
  createdAt: string;
  updatedAt: string;
}
```

**Example Request:**
```
GET /api/mmo-shop/products?category=gold&game=World%20of%20Warcraft&page=1&limit=20&sortBy=price_asc
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "mmo-001",
      "name": "WoW Classic Gold - 10,000",
      "category": "gold",
      "game": "World of Warcraft",
      "price": 500000,
      "stock": 50,
      "description": "World of Warcraft Classic Gold. Fast delivery within 5-30 minutes.",
      "image": "https://cloudinary.com/...",
      "status": "active",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 20,
    "totalPages": 5,
    "totalItems": 100
  }
}
```

#### **GET `/api/mmo-shop/products/:id`** - Lấy chi tiết sản phẩm

**Response:**
```typescript
{
  success: true,
  data: MMOProduct & {
    details?: MMOProductDetail[]; // Optional additional details
  }
}
```

#### **GET `/api/mmo-shop/games`** - Lấy danh sách games

**Response:**
```typescript
{
  success: true,
  data: string[] // ['World of Warcraft', 'Final Fantasy XIV', ...]
}
```

#### **GET `/api/mmo-shop/categories`** - Lấy danh sách categories

**Response:**
```typescript
{
  success: true,
  data: Array<{
    id: string;
    name: string;
    count: number; // Number of products in this category
  }>
}
```

---

### 2.2 Admin Endpoints (Require Admin Role)

#### **POST `/api/admin/mmo-shop/products`** - Tạo sản phẩm mới

**Request Body:**
```typescript
{
  name: string;                    // Required, max 255 chars
  category: 'gold' | 'items' | 'accounts' | 'services'; // Required
  game: string;                   // Required, max 100 chars
  price: number;                  // Required, >= 0
  stock: number;                  // Required, >= 0
  description?: string;            // Optional
  image?: string;                  // Optional, URL or base64
  status?: 'active' | 'inactive'; // Optional, default: 'active'
}
```

**Response:**
```typescript
{
  success: true,
  message: "Product created successfully",
  data: MMOProduct
}
```

**Validation Rules:**
- `name`: Required, 1-255 characters
- `category`: Required, must be one of: gold, items, accounts, services
- `game`: Required, 1-100 characters
- `price`: Required, must be >= 0
- `stock`: Required, must be >= 0
- `description`: Optional, max 5000 characters
- `image`: Optional, must be valid URL or base64 image

#### **PUT `/api/admin/mmo-shop/products/:id`** - Cập nhật sản phẩm

**Request Body:** (Same as POST, all fields optional except validation)

**Response:**
```typescript
{
  success: true,
  message: "Product updated successfully",
  data: MMOProduct
}
```

#### **DELETE `/api/admin/mmo-shop/products/:id`** - Xóa sản phẩm

**Response:**
```typescript
{
  success: true,
  message: "Product deleted successfully"
}
```

**Note:** Soft delete recommended (set status to 'inactive' instead of hard delete)

#### **GET `/api/admin/mmo-shop/products`** - Lấy danh sách sản phẩm (Admin)

**Query Parameters:** (Same as customer endpoint, plus:)
```typescript
{
  status?: 'active' | 'inactive' | 'out_of_stock' | 'all'; // Admin can see all
  createdBy?: string; // Filter by creator
}
```

**Response:** (Same format as customer endpoint)

#### **GET `/api/admin/mmo-shop/stats`** - Thống kê MMO Shop

**Response:**
```typescript
{
  success: true,
  data: {
    totalProducts: number;
    totalByCategory: {
      gold: number;
      items: number;
      accounts: number;
      services: number;
    };
    totalByStatus: {
      active: number;
      inactive: number;
      out_of_stock: number;
    };
    totalRevenue: number;        // Total revenue from MMO products
    totalOrders: number;          // Total orders with MMO products
    lowStockProducts: number;      // Products with stock < 10
    topGames: Array<{
      game: string;
      productCount: number;
      revenue: number;
    }>;
  }
}
```

---

## 🔄 3. INTEGRATION VỚI HỆ THỐNG HIỆN TẠI

### 3.1 Cart Integration

MMO products sẽ được thêm vào cart giống như Projects. Khi thêm vào cart:

```typescript
// Frontend sẽ gửi:
{
  projectId: "mmo-001",  // MMO product ID
  tenSP: "WoW Classic Gold - 10,000",
  basePrice: 500000,
  giamGia: 0,
  hinhAnh: "...",
  loaiSP: "MMO Shop",    // Để phân biệt với Projects
  selectedDungTich: undefined,
  includesOptions: undefined
}
```

**Backend cần:**
- Validate product exists và còn stock
- Check `loaiSP === "MMO Shop"` để xử lý riêng
- Khi checkout, tạo record trong `mmo_orders` table

### 3.2 Order Integration

Khi order được tạo thành công, cần:

1. **Tạo records trong `mmo_orders`** cho các items có `loaiSP === "MMO Shop"`
2. **Trừ stock** của MMO products
3. **Set delivery_status = 'pending'**

**Example:**
```sql
-- Khi order được tạo
INSERT INTO mmo_orders (id, order_id, product_id, quantity, unit_price, total_price, delivery_status)
VALUES 
  ('mmo-order-001', 'order-123', 'mmo-001', 2, 500000, 1000000, 'pending');

-- Trừ stock
UPDATE mmo_products 
SET stock = stock - 2 
WHERE id = 'mmo-001';
```

### 3.3 Payment Integration

MMO products sử dụng cùng payment flow như Projects:
- VNPay
- Wallet
- Cash on delivery (nếu có)

Sau khi payment thành công:
- Update `mmo_orders.delivery_status = 'processing'`
- Trigger delivery process (manual hoặc automated)

---

## ✅ 4. VALIDATION & BUSINESS LOGIC

### 4.1 Product Validation

```typescript
// Pseudo-code validation
function validateMMOProduct(data) {
  // Required fields
  if (!data.name || data.name.trim().length === 0) {
    throw new Error("Product name is required");
  }
  if (data.name.length > 255) {
    throw new Error("Product name must be <= 255 characters");
  }
  
  if (!['gold', 'items', 'accounts', 'services'].includes(data.category)) {
    throw new Error("Invalid category");
  }
  
  if (!data.game || data.game.trim().length === 0) {
    throw new Error("Game name is required");
  }
  
  if (typeof data.price !== 'number' || data.price < 0) {
    throw new Error("Price must be a non-negative number");
  }
  
  if (typeof data.stock !== 'number' || data.stock < 0) {
    throw new Error("Stock must be a non-negative integer");
  }
  
  // Auto-update status based on stock
  if (data.stock === 0) {
    data.status = 'out_of_stock';
  } else if (data.status === 'out_of_stock' && data.stock > 0) {
    data.status = 'active';
  }
}
```

### 4.2 Stock Management

```typescript
// Khi thêm vào cart
function checkStock(productId: string, quantity: number) {
  const product = getProduct(productId);
  if (product.stock < quantity) {
    throw new Error(`Insufficient stock. Available: ${product.stock}`);
  }
  return true;
}

// Khi checkout thành công
function updateStock(productId: string, quantity: number) {
  const product = getProduct(productId);
  const newStock = product.stock - quantity;
  
  if (newStock < 0) {
    throw new Error("Stock cannot be negative");
  }
  
  updateProduct(productId, { 
    stock: newStock,
    status: newStock === 0 ? 'out_of_stock' : product.status
  });
}
```

### 4.3 Search & Filter Logic

```sql
-- Example SQL query for products
SELECT 
  p.*,
  COUNT(DISTINCT o.id) as order_count -- For popularity sorting
FROM mmo_products p
LEFT JOIN mmo_orders o ON p.id = o.product_id
WHERE 
  p.status = 'active'
  AND (p.category = ? OR ? = 'all')
  AND (p.game = ? OR ? = 'all')
  AND (p.name LIKE ? OR p.description LIKE ? OR ? IS NULL)
  AND (p.price >= ? OR ? IS NULL)
  AND (p.price <= ? OR ? IS NULL)
  AND (p.stock > 0 OR ? = false)
GROUP BY p.id
ORDER BY 
  CASE ?
    WHEN 'price_asc' THEN p.price
    WHEN 'price_desc' THEN -p.price
    WHEN 'newest' THEN -UNIX_TIMESTAMP(p.created_at)
    WHEN 'popular' THEN -order_count
    WHEN 'name_asc' THEN p.name
    ELSE p.created_at
  END
LIMIT ? OFFSET ?;
```

---

## 🔒 5. SECURITY & PERMISSIONS

### 5.1 Authentication & Authorization

```typescript
// Customer endpoints
- GET /api/mmo-shop/products: Public (no auth required)
- GET /api/mmo-shop/products/:id: Public
- GET /api/mmo-shop/games: Public
- GET /api/mmo-shop/categories: Public

// Admin endpoints (require admin role)
- POST /api/admin/mmo-shop/products: Require Admin role
- PUT /api/admin/mmo-shop/products/:id: Require Admin role
- DELETE /api/admin/mmo-shop/products/:id: Require Admin role
- GET /api/admin/mmo-shop/products: Require Admin role
- GET /api/admin/mmo-shop/stats: Require Admin role
```

### 5.2 Input Sanitization

- Sanitize all string inputs (prevent XSS)
- Validate numeric inputs (prevent SQL injection)
- Use parameterized queries
- Rate limiting on create/update/delete endpoints

### 5.3 Data Privacy

- Don't expose internal IDs in public endpoints
- Log admin actions for audit trail
- Encrypt sensitive delivery information

---

## 📊 6. ERROR HANDLING

### 6.1 Error Response Format

```typescript
{
  success: false,
  error: {
    code: string;        // 'VALIDATION_ERROR', 'NOT_FOUND', 'INSUFFICIENT_STOCK', etc.
    message: string;     // Human-readable error message
    details?: any;        // Additional error details
  }
}
```

### 6.2 Common Error Codes

- `VALIDATION_ERROR`: Invalid input data
- `NOT_FOUND`: Product not found
- `INSUFFICIENT_STOCK`: Not enough stock available
- `UNAUTHORIZED`: Not authenticated
- `FORBIDDEN`: Not authorized (not admin)
- `INTERNAL_ERROR`: Server error

**Example Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Insufficient stock. Available: 5, Requested: 10",
    "details": {
      "productId": "mmo-001",
      "available": 5,
      "requested": 10
    }
  }
}
```

---

## 🧪 7. TESTING REQUIREMENTS

### 7.1 Unit Tests

- Product validation
- Stock management logic
- Search/filter logic
- Price calculations

### 7.2 Integration Tests

- Create product → Get product → Update product → Delete product
- Add to cart → Checkout → Order creation → Stock update
- Search and filter functionality
- Pagination

### 7.3 Test Cases

```typescript
// Test cases to cover:
1. Create product with valid data → Success
2. Create product with invalid category → Validation error
3. Create product with negative price → Validation error
4. Get products with filters → Correct results
5. Get non-existent product → 404
6. Update product stock → Stock updated correctly
7. Add to cart with insufficient stock → Error
8. Checkout with MMO products → Orders created correctly
9. Admin endpoints without auth → 401
10. Customer accessing admin endpoints → 403
```

---

## 📝 8. API DOCUMENTATION REQUIREMENTS

Cần tạo documentation cho:
1. **Swagger/OpenAPI** specification
2. **Postman Collection** với examples
3. **README** với setup instructions

---

## 🔗 9. FRONTEND INTEGRATION

### 9.1 Service File Structure

Frontend sẽ tạo file: `src/services/mmoShopService.ts`

```typescript
import axiosInstance from '@/lib/api/axios';
import type { ApiListResponse, ApiItemResponse, Pagination } from '@/types/models/common';

export interface MMOProduct {
  id: string;
  name: string;
  category: 'gold' | 'items' | 'accounts' | 'services';
  game: string;
  price: number;
  stock: number;
  description: string;
  image?: string;
  status: 'active' | 'inactive' | 'out_of_stock';
  createdAt: string;
  updatedAt: string;
}

export interface GetProductsParams {
  page?: number;
  limit?: number;
  category?: 'gold' | 'items' | 'accounts' | 'services' | 'all';
  game?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popular' | 'name_asc';
  inStock?: boolean;
}

export const mmoShopService = {
  getProducts: async (params?: GetProductsParams): Promise<{
    products: MMOProduct[];
    pagination?: Pagination;
  }> => {
    const response = await axiosInstance.get<ApiListResponse<MMOProduct>>(
      '/api/mmo-shop/products',
      { params }
    );
    return {
      products: response.data.data || [],
      pagination: response.data.pagination,
    };
  },

  getProduct: async (id: string): Promise<MMOProduct> => {
    const response = await axiosInstance.get<ApiItemResponse<MMOProduct>>(
      `/api/mmo-shop/products/${id}`
    );
    return response.data.data;
  },

  getGames: async (): Promise<string[]> => {
    const response = await axiosInstance.get<{ success: boolean; data: string[] }>(
      '/api/mmo-shop/games'
    );
    return response.data.data;
  },

  getCategories: async (): Promise<Array<{ id: string; name: string; count: number }>> => {
    const response = await axiosInstance.get<{
      success: boolean;
      data: Array<{ id: string; name: string; count: number }>;
    }>('/api/mmo-shop/categories');
    return response.data.data;
  },
};
```

---

## ✅ 10. CHECKLIST IMPLEMENTATION

### Phase 1: Database Setup
- [ ] Create `mmo_products` table
- [ ] Create `mmo_product_details` table (optional)
- [ ] Create `mmo_orders` table
- [ ] Create indexes
- [ ] Add foreign keys

### Phase 2: Basic CRUD
- [ ] GET `/api/mmo-shop/products` (list)
- [ ] GET `/api/mmo-shop/products/:id` (detail)
- [ ] POST `/api/admin/mmo-shop/products` (create)
- [ ] PUT `/api/admin/mmo-shop/products/:id` (update)
- [ ] DELETE `/api/admin/mmo-shop/products/:id` (delete)

### Phase 3: Search & Filter
- [ ] Implement search functionality
- [ ] Implement category filter
- [ ] Implement game filter
- [ ] Implement price range filter
- [ ] Implement sorting
- [ ] Implement pagination

### Phase 4: Integration
- [ ] Integrate with cart system
- [ ] Integrate with order system
- [ ] Integrate with payment system
- [ ] Stock management on checkout

### Phase 5: Admin Features
- [ ] Admin product list with filters
- [ ] Admin stats endpoint
- [ ] Admin product management UI

### Phase 6: Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing
- [ ] Performance testing

### Phase 7: Documentation
- [ ] API documentation
- [ ] Postman collection
- [ ] README updates

---

## 🎯 11. PRIORITY ORDER

**High Priority (MVP):**
1. Database schema
2. GET products (list & detail)
3. POST create product (admin)
4. Cart integration
5. Order integration

**Medium Priority:**
1. Search & filter
2. PUT update product
3. DELETE product
4. Admin stats

**Low Priority (Nice to have):**
1. Product details (variants)
2. Advanced filtering
3. Analytics
4. Bulk operations

---

## 📌 NOTES

1. **Naming Convention:**
   - Use snake_case for database fields
   - Use camelCase for API request/response
   - Use kebab-case for URL endpoints

2. **Response Format:**
   - Always wrap responses in `{ success: boolean, data: any }`
   - Include pagination for list endpoints
   - Include error details in error responses

3. **Stock Management:**
   - Always check stock before adding to cart
   - Always check stock before checkout
   - Update stock atomically (use transactions)

4. **Performance:**
   - Cache frequently accessed data (games list, categories)
   - Use database indexes for search/filter
   - Paginate large result sets

5. **Security:**
   - Validate all inputs
   - Sanitize outputs
   - Use parameterized queries
   - Implement rate limiting

---

## 🚀 READY TO IMPLEMENT

Sử dụng prompt này để tạo API backend cho Tạp hóa MMO. Đảm bảo:
- ✅ Tuân thủ cấu trúc API hiện tại của dự án
- ✅ Tích hợp với hệ thống Cart, Orders, Payments
- ✅ Có đầy đủ validation và error handling
- ✅ Có documentation và tests
- ✅ Secure và performant
