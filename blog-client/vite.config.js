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
  build: {
    // 拆包策略：让「框架 / 组件库 / 高亮器」各自独立
    //  - 业务代码改动时，用户不必重新下载这几百 KB 的 vendor
    //  - markdown（marked + highlight.js + DOMPurify）本来就只在详情页
    //    动态引入，单独成 chunk 后能被长期缓存
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('highlight.js') || id.includes('marked') || id.includes('dompurify')) {
            return 'markdown'
          }
          if (id.includes('element-plus') || id.includes('@element-plus')) {
            return 'element-plus'
          }
          if (id.includes('/vue/') || id.includes('vue-router') || id.includes('pinia') || id.includes('@vue')) {
            return 'vue-vendor'
          }
          return 'vendor'
        }
      }
    },
    // 单 chunk 超过 500KB 才提示，避免上面拆包后仍刷警告
    chunkSizeWarningLimit: 700
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
