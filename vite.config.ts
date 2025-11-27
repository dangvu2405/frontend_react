import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { copyFileSync, existsSync, mkdirSync } from 'fs'

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
        const ensureDistDir = () => {
          if (!existsSync(distDir)) {
            mkdirSync(distDir, { recursive: true })
          }
        }

        const tryCopy = (src: string, dest: string, label: string) => {
          if (!existsSync(src)) {
            console.warn(`ℹ️ Skipped copying ${label} (not found at ${src})`)
            return
          }
          try {
            ensureDistDir()
            copyFileSync(src, dest)
            console.log(`✅ Copied ${label} to dist`)
          } catch (error) {
            console.warn(`⚠️ Could not copy ${label}:`, error instanceof Error ? error.message : error)
          }
        }
        
        // Copy .htaccess
        tryCopy(path.join(publicDir, '.htaccess'), path.join(distDir, '.htaccess'), '.htaccess')
        
        // Copy static.json (always overwrite to ensure latest version)
        tryCopy(path.join(__dirname, 'static.json'), path.join(distDir, 'static.json'), 'static.json')
        
        // Copy _redirects (always overwrite)
        tryCopy(path.join(publicDir, '_redirects'), path.join(distDir, '_redirects'), '_redirects')
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
