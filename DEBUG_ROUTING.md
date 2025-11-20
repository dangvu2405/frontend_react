# 🔍 Hướng Dẫn Debug Routing Khi Deploy

## Vấn Đề
Khi deploy lên server, truy cập `/admin` báo 404 "Not Found", nhưng chạy local thì hoạt động bình thường.

## Nguyên Nhân
Đây là vấn đề **Server-Side Routing** cho Single Page Application (SPA):
- Local dev server tự động rewrite tất cả routes về `index.html`
- Server production (Render.com) cần cấu hình rewrite rule để làm tương tự

## Cách Debug

### Bước 1: Kiểm Tra Server Response
1. Mở trình duyệt, truy cập: `https://your-domain.com/debug-route`
2. Hoặc mở DevTools (F12) → Tab **Network**
3. Reload trang `/admin`
4. Tìm request `/admin` trong Network tab
5. Kiểm tra:
   - **Status 200** + **Content-Type: text/html** → Server rewrite OK ✅
   - **Status 404** → Server chưa có rewrite rule ❌

### Bước 2: Kiểm Tra React Router
1. Mở DevTools → Tab **Console**
2. Kiểm tra có lỗi JavaScript không
3. Kiểm tra React Router có match route `/admin` không

### Bước 3: Kiểm Tra Cấu Hình Render.com

#### 3.1. Kiểm Tra File `static.json`
File `static.json` phải có trong thư mục `dist/` sau khi build:
```json
{
  "routes": [
    {
      "src": "/.*",
      "dest": "/index.html"
    }
  ]
}
```

#### 3.2. Kiểm Tra Build Logs
Trong Render.com dashboard:
1. Vào service **frontend-app**
2. Xem tab **Logs**
3. Tìm dòng: `✅ Copied static.json to dist`
4. Nếu không thấy → File chưa được copy

#### 3.3. Cấu Hình Rewrite Rule Trên Render Dashboard
**QUAN TRỌNG:** Render.com có thể không tự động đọc `static.json`. Cần cấu hình thủ công:

1. Vào Render.com dashboard
2. Chọn service **frontend-app**
3. Vào tab **Settings** → **Redirects / Rewrites**
4. Thêm rule:
   - **Source:** `/*`
   - **Destination:** `/index.html`
   - **Action:** `Rewrite`
5. Save và redeploy

### Bước 4: Kiểm Tra Domain Configuration
Nếu bạn dùng custom domain:
1. Kiểm tra domain có trỏ đúng service không
2. Kiểm tra DNS records
3. Thử truy cập trực tiếp Render URL: `https://frontend-app.onrender.com/admin`

## Các File Cấu Hình Đã Có

### ✅ `static.json` (Render.com)
```json
{
  "routes": [
    {
      "src": "/.*",
      "dest": "/index.html"
    }
  ]
}
```

### ✅ `public/_redirects` (Netlify)
```
/*    /index.html   200
```

### ✅ `vite.config.ts`
Plugin tự động copy các file config vào `dist/` khi build.

## Cách Sửa Nhanh

### Option 1: Cấu Hình Trên Render Dashboard (Khuyến Nghị)
1. Vào Render.com → Service **frontend-app**
2. Settings → **Redirects / Rewrites**
3. Add rule: `/*` → `/index.html` (Rewrite)
4. Save và đợi deploy xong

### Option 2: Kiểm Tra File Trong Build
1. Build local: `npm run build`
2. Kiểm tra: `dist/static.json` có tồn tại không
3. Nếu không có → Sửa `vite.config.ts`

### Option 3: Test Với Debug Route
1. Deploy code mới (có trang `/debug-route`)
2. Truy cập: `https://your-domain.com/debug-route`
3. Xem thông tin routing và test các button

## Checklist Debug

- [ ] Server trả về `index.html` khi truy cập `/admin` (Status 200)
- [ ] File `static.json` có trong `dist/` sau build
- [ ] Render dashboard có rewrite rule: `/*` → `/index.html`
- [ ] Domain trỏ đúng service
- [ ] Không có lỗi JavaScript trong Console
- [ ] React Router match route `/admin`
- [ ] User đã đăng nhập và có quyền admin

## Lưu Ý

1. **Render.com có thể không tự động đọc `static.json`** → Cần cấu hình rewrite rule trên dashboard
2. **Custom domain** có thể cache → Clear cache hoặc đợi vài phút
3. **Build logs** phải show "Copied static.json to dist" → Nếu không, kiểm tra `vite.config.ts`

## Liên Hệ

Nếu vẫn không được sau khi làm theo các bước trên, cung cấp:
1. Screenshot Network tab khi truy cập `/admin`
2. Screenshot Console tab
3. Build logs từ Render.com
4. Cấu hình Redirects/Rewrites trên Render dashboard

