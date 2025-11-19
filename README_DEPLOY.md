# Hướng dẫn Deploy và Fix Routing

## Vấn đề: 404 Not Found khi truy cập /admin

### Nguyên nhân
Render.com cần file `static.json` trong thư mục `dist` để xử lý SPA routing.

### Giải pháp

1. **File static.json phải có trong dist folder**
   - File đã được tự động copy khi build nhờ vite.config.ts
   - Format: `{ "routes": [{ "src": "/.*", "dest": "/index.html" }] }`

2. **Kiểm tra trong Render Dashboard:**
   - Vào service settings
   - Đảm bảo `staticPublishPath` = `./dist`
   - Kiểm tra logs để xem file static.json có được nhận diện

3. **Nếu vẫn lỗi, thử:**
   - Clear cache của Render
   - Rebuild service
   - Kiểm tra file static.json có trong dist folder trên Render

### Files cần có trong dist:
- ✅ index.html
- ✅ static.json (cho Render.com)
- ✅ _redirects (cho Netlify)
- ✅ .htaccess (cho Apache)
- ✅ vercel.json (cho Vercel)

### Thêm rewrite rule trực tiếp trên Render
1. Vào Render Dashboard → Service frontend.
2. Chọn tab **Redirects / Rewrites** → **Add rule**.
3. Nhập:
   | Source | Destination | Action  |
   |--------|-------------|---------|
   | `/*`   | `/index.html` | Rewrite |
4. Deploy lại service.

> Tip: Nếu deploy ở nền tảng khác (Netlify, Vercel, Nginx, ...), file `public/_redirects` và `static.json` trong repo đã sẵn sàng để sử dụng.

