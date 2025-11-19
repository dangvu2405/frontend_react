# Diagnostic Guide: Admin Page 404 Error

## Problem
Accessing `/admin` returns "Not Found" (404) after deployment.

## Root Cause Analysis

### 1. Check if static.json exists in dist
```bash
ls -la dist/static.json
```

### 2. Check static.json format
The file should be:
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

### 3. Check Render.com Configuration
- Go to Render Dashboard
- Check service settings
- Verify `staticPublishPath` = `./dist`
- Check build logs to see if static.json is copied

### 4. Test Routes
- `/` - Should work (homepage)
- `/admin` - Should redirect to index.html then React Router handles it
- `/admin/orders` - Should redirect to index.html then React Router handles it

## Solutions to Try

### Solution 1: Ensure static.json is in dist
The vite.config.ts plugin should copy it, but verify:
```bash
npm run build
ls dist/static.json
```

### Solution 2: Manual copy in buildCommand
Add to render.yaml:
```yaml
buildCommand: NODE_ENV=development npm install && npm run build && cp static.json dist/static.json
```

### Solution 3: Check if using custom domain
If using custom domain (dtv2405.id.vn), verify:
- Domain is properly configured in Render
- No CDN/proxy in front that might interfere
- DNS is pointing to Render

### Solution 4: Alternative - Use HashRouter (temporary)
If nothing works, can temporarily use HashRouter:
```tsx
import { HashRouter } from 'react-router-dom';
// Change BrowserRouter to HashRouter
```

### Solution 5: Check Render Logs
Look for:
- Build errors
- File not found errors
- Routing configuration errors

## Expected Behavior
1. User visits `/admin`
2. Server should return `index.html` (not 404)
3. React app loads
4. React Router sees `/admin` and renders AdminLayout
5. AdminRoute checks authentication and admin role

## Debug Steps
1. Open browser DevTools
2. Go to Network tab
3. Visit `/admin`
4. Check:
   - What status code is returned? (should be 200, not 404)
   - What file is served? (should be index.html)
   - Any errors in Console?

