import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/*
 * 注意：这里刻意不使用 import.meta / __dirname。
 * Cloudflare 的构建（Workers Builds 的 wrangler autoconfig）会用 esprima
 * 解析本文件以自动注入 Cloudflare Vite 插件，而 esprima 不支持 import.meta，
 * 一旦出现就会直接报错：✘ [ERROR] Error parsing file: vite.config.js
 *
 * 所以别名用根目录相对路径 '/src'（Vite 会按项目根目录解析），
 * 效果与 fileURLToPath(new URL('./src', import.meta.url)) 等价。
 */
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
