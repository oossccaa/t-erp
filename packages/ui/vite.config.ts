import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: [
        'vue',
      ],
      dts: true,
    }),
    Components({
      dts: true,
    }),
  ],
  
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'TErpUI',
      fileName: (format) => `index.${format}.js`,
      formats: ['es', 'cjs'],
    },
    
    rollupOptions: {
      external: ['vue', '@t-erp/shared'],
      output: {
        globals: {
          vue: 'Vue',
          '@t-erp/shared': 'TErpShared',
        },
      },
    },
    
    // 生成 source map
    sourcemap: true,
    
    // 縮小輸出
    minify: 'esbuild',
    
    // 目標環境
    target: 'esnext',
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  
  // 測試配置
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.ts',
  },
})
