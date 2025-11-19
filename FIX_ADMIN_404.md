# Fix Admin 404 Error - Step by Step Guide

## Vấn đề
- ✅ Local: `/admin` hoạt động bình thường
- ❌ Production (Render.com): `/admin` báo "Not Found"

## Nguyên nhân
Đây là vấn đề **server-side routing**. React Router hoạt động đúng, nhưng server cần được cấu hình để serve `index.html` cho tất cả routes.

## Giải pháp đã áp dụng

### 1. File static.json
- ✅ Đã có trong repo root: `static.json`
- ✅ Format: `{ "routes": [{ "src": "/.*", "dest": "/index.html" }] }`
- ✅ Được copy vào `dist/static.json` khi build (2 lần: vite plugin + build script)

### 2. Build Process
- ✅ Vite plugin copy static.json vào dist
- ✅ Build script cũng copy static.json vào dist (backup)
- ✅ File có trong dist sau khi build

## Các bước kiểm tra trên Render.com

### Bước 1: Kiểm tra Build Logs
1. Vào Render Dashboard → Service `frontend-app`
2. Xem **Build Logs**
3. Tìm các dòng:
   - `✅ Copied static.json to dist` (từ vite plugin)
   - `✅ static.json copied to dist` (từ build script)
4. Nếu không thấy → Build process có vấn đề

### Bước 2: Kiểm tra File trong Dist
Sau khi build xong, kiểm tra xem file có trong dist không:
- Vào **Runtime** tab
- Hoặc dùng **Shell** để check: `ls -la dist/static.json`

### Bước 3: Test trực tiếp
1. Mở Browser DevTools (F12)
2. Vào tab **Network**
3. Truy cập `https://dtv2405.id.vn/admin`
4. Xem request `/admin`:
   - **Status**: 200 (OK) hay 404 (Not Found)?
   - **Response**: `index.html` content hay error page?

### Bước 4: Kiểm tra Custom Domain
Nếu dùng custom domain `dtv2405.id.vn`:
- Kiểm tra DNS có trỏ đúng về Render không
- Có CDN/proxy nào đứng trước không?
- Clear CDN cache nếu có

## Nếu vẫn không hoạt động

### Giải pháp 1: Kiểm tra Render.com Settings
1. Vào Service Settings
2. Kiểm tra:
   - `staticPublishPath` = `./dist` ✅
   - `Build Command` = `NODE_ENV=development npm install && npm run build` ✅

### Giải pháp 2: Manual Copy trong Build Command
Nếu cần, thêm vào `render.yaml`:
```yaml
buildCommand: npm install && npm run build && cp static.json dist/static.json && ls -la dist/static.json
```

### Giải pháp 3: Kiểm tra Format
Thử format khác trong `static.json`:
```json
{
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### Giải pháp 4: Contact Render Support
Nếu tất cả đều đúng nhưng vẫn không hoạt động:
- Có thể là bug của Render.com
- Contact Render support với:
  - Service name
  - Build logs
  - Runtime logs
  - File structure trong dist

## Debug Commands (trong Render Shell)
```bash
# Check if file exists
ls -la dist/static.json

# Check file content
cat dist/static.json

# Verify JSON is valid
cat dist/static.json | python -m json.tool

# List all files in dist
ls -la dist/ | grep -E "static|index"
```

## Expected Result
Sau khi fix:
1. User visits `/admin`
2. Server returns `index.html` (200 OK)
3. React app loads
4. React Router sees `/admin` và render AdminLayout
5. AdminRoute checks auth và show content

## Files đã được cấu hình
- ✅ `static.json` (root) - Format đúng
- ✅ `dist/static.json` (sau build) - Được copy tự động
- ✅ `vite.config.ts` - Plugin copy file
- ✅ `package.json` - Build script copy file
- ✅ `render.yaml` - Cấu hình Render.com

