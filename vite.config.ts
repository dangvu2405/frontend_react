import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { copyFileSync, existsSync } from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Plugin to copy .htaccess and other config files to dist
    {
      name: 'copy-config-files',
      closeBundle() {
        const publicDir = path.resolve(__dirname, 'public')
        const distDir = path.resolve(__dirname, 'dist')
        
        // Copy .htaccess
        const htaccessSrc = path.join(publicDir, '.htaccess')
        const htaccessDest = path.join(distDir, '.htaccess')
        if (existsSync(htaccessSrc)) {
          copyFileSync(htaccessSrc, htaccessDest)
          console.log('✅ Copied .htaccess to dist')
        }
        
        // Copy static.json (always overwrite to ensure latest version)
        const staticJsonSrc = path.join(__dirname, 'static.json')
        const staticJsonDest = path.join(distDir, 'static.json')
        if (existsSync(staticJsonSrc)) {
          copyFileSync(staticJsonSrc, staticJsonDest)
          console.log('✅ Copied static.json to dist')
        }
        
        // Copy _redirects (always overwrite)
        const redirectsSrc = path.join(publicDir, '_redirects')
        const redirectsDest = path.join(distDir, '_redirects')
        if (existsSync(redirectsSrc)) {
          copyFileSync(redirectsSrc, redirectsDest)
          console.log('✅ Copied _redirects to dist')
        }
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
  },
  esbuild: {
    // Keep console for debugging in production (remove if not needed)
    // drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  build: {
    rollupOptions: {
      output: {
        // Let Rollup automatically handle chunking to avoid circular dependencies
        // Only specify file naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000, // Increase limit to avoid warnings
    // Enable minification (Vite uses esbuild by default, faster than terser)
    minify: 'esbuild', // esbuild is faster and included with Vite
    // Optimize chunk size
    target: 'es2015',
    cssCodeSplit: true,
    // Reduce asset inline limit to force separate files
    assetsInlineLimit: 4096, // 4KB - smaller images will be inlined
    // CommonJS options to handle circular dependencies better
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
})
