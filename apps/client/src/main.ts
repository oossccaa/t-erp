import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import i18n from './i18n'

// Vant 樣式
import 'vant/lib/index.css'

// 全域樣式
import './styles/index.scss'

// Touch 模擬器（開發時使用）
import '@vant/touch-emulator'

// T-ERP UI 元件庫
import { createThemeProvider } from '@t-erp/ui'

const app = createApp(App)
const pinia = createPinia()

// 安裝外掛
app.use(pinia)
app.use(router)
app.use(i18n)

// 初始化主題
app.use({
  install(app) {
    createThemeProvider({
      mode: 'light',
      customColors: {
        primary: '#1989fa',
      },
    })
  },
})

app.mount('#app')
