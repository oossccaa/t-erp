import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import i18n from './i18n'

// Element Plus 樣式
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

app.mount('#app')
