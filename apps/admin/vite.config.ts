import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        'pinia',
        '@vueuse/core',
      ],
      resolvers: [ElementPlusResolver()],
      dts: true,
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: true,
    }),
  ],
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  optimizeDeps: {
    exclude: ['@t-erp/ui', '@t-erp/shared'],
  },

  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler', // 使用現代 Sass API
        silenceDeprecations: ['legacy-js-api', 'import'], // 暫時靜默棄用警告
      },
    },
  },

  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',

    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          elementplus: ['element-plus'],
          echarts: ['echarts', 'vue-echarts'],
        },
      },
    },
  },
  
  // 測試配置
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
