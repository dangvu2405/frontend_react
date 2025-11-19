# Troubleshooting: Admin Page 404 on Render.com

## Problem
- ✅ Local: `/admin` works fine
- ❌ Production (Render.com): `/admin` returns "Not Found"

## Root Cause
This is a **server-side routing issue**. React Router works fine, but the server needs to be configured to serve `index.html` for all routes.

## Solution Checklist

### 1. Verify static.json exists in dist
```bash
# After build, check:
ls -la dist/static.json
cat dist/static.json
```

Should contain:
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

### 2. Check Render.com Configuration
In Render Dashboard:
- Service Settings → Verify `staticPublishPath` = `./dist`
- Build Logs → Look for "✅ Copied static.json to dist"
- Runtime Logs → Check if requests to `/admin` are handled

### 3. Verify File Location
Render.com reads `static.json` from the **publish path** (dist folder), not from repo root.

### 4. Test After Deploy
1. Visit `https://dtv2405.id.vn/admin`
2. Open Browser DevTools → Network tab
3. Check:
   - Status: Should be **200** (not 404)
   - Response: Should be `index.html` content
   - If 404: Server routing not configured

### 5. If Still Not Working

#### Option A: Verify Build Process
Check if vite.config.ts plugin is running:
```bash
npm run build
# Should see: "✅ Copied static.json to dist"
```

#### Option B: Manual Copy in Build Command
Add to render.yaml:
```yaml
buildCommand: npm install && npm run build && cp static.json dist/static.json
```

#### Option C: Check Custom Domain
If using custom domain (dtv2405.id.vn):
- Verify DNS points to Render
- Check if CDN/proxy is interfering
- Clear CDN cache if applicable

#### Option D: Alternative Format
Try different static.json format:
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

## Expected Behavior
1. User visits `/admin`
2. Server returns `index.html` (200 OK)
3. React app loads
4. React Router sees `/admin` and renders AdminLayout
5. AdminRoute checks auth and shows content

## Debug Commands
```bash
# Check if file exists
test -f dist/static.json && echo "✅ File exists" || echo "❌ File missing"

# Check file content
cat dist/static.json

# Verify JSON is valid
cat dist/static.json | python -m json.tool
```

