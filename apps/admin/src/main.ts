import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import i18n from './i18n'
import { useAuthStore } from './stores/auth'

// Element Plus 樣式與繁中語系
import ElementPlus from 'element-plus'
import zhTw from 'element-plus/es/locale/lang/zh-tw'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

// 全局樣式
import './styles/index.scss'

const app = createApp(App)
const pinia = createPinia()

// 安裝插件
app.use(pinia)
app.use(router)
app.use(i18n)
app.use(ElementPlus, { locale: zhTw })

// 在應用掛載前，恢復認證狀態
const authStore = useAuthStore()
const token = localStorage.getItem('token')
const userStr = localStorage.getItem('user')

if (token && userStr) {
  try {
    const user = JSON.parse(userStr)
    authStore.user = user
    authStore.token = token
    authStore.isAuthenticated = true
    authStore.permissions = user.permissions || []
  } catch (error) {
    console.error('恢復認證狀態失敗:', error)
    authStore.clearAuth()
  }
}

app.mount('#app')
