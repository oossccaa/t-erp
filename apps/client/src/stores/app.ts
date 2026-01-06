import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 主题模式
  const theme = ref<'light' | 'dark'>('light')
  
  // 语言设置
  const locale = ref<string>('zh-CN')
  
  // 系统设置
  const settings = ref({
    showTutorial: true,
    enableNotifications: true,
    autoSave: true,
  })
  
  // 初始化主题
  const initTheme = () => {
    const savedTheme = localStorage.getItem('app_theme') as 'light' | 'dark'
    if (savedTheme) {
      theme.value = savedTheme
    }
    // 無論是否有保存的主題，都要應用主題以設置 CSS 變量
    applyTheme(theme.value)
  }

  // 应用主题
  const applyTheme = (themeMode: 'light' | 'dark') => {
    document.documentElement.setAttribute('data-theme', themeMode)

    // 设置 Vant CSS 变量
    const root = document.documentElement
    if (themeMode === 'dark') {
      // 深色模式 - 設置完整的 Vant 變量
      root.style.setProperty('--van-background', '#1a1a1a')
      root.style.setProperty('--van-background-2', '#2a2a2a')
      root.style.setProperty('--van-text-color', '#e5e5e5')
      root.style.setProperty('--van-text-color-2', '#999999')
      root.style.setProperty('--van-text-color-3', '#666666')
      root.style.setProperty('--van-border-color', '#3a3a3a')
      root.style.setProperty('--van-active-color', '#333333')
      root.style.setProperty('--van-background-color', '#1a1a1a')
      root.style.setProperty('--van-card-background', '#2a2a2a')
      root.style.setProperty('--van-popup-background', '#2a2a2a')
      root.style.setProperty('--van-dialog-background', '#2a2a2a')
      root.style.setProperty('--van-nav-bar-background', '#2a2a2a')
      root.style.setProperty('--van-cell-background', '#2a2a2a')
    } else {
      // 淺色模式 - 設置完整的 Vant 變量
      root.style.setProperty('--van-background', '#f7f8fa')
      root.style.setProperty('--van-background-2', '#ffffff')
      root.style.setProperty('--van-text-color', '#323233')
      root.style.setProperty('--van-text-color-2', '#646566')
      root.style.setProperty('--van-text-color-3', '#969799')
      root.style.setProperty('--van-border-color', '#ebedf0')
      root.style.setProperty('--van-active-color', '#f2f3f5')
      root.style.setProperty('--van-background-color', '#f7f8fa')
      root.style.setProperty('--van-card-background', '#ffffff')
      root.style.setProperty('--van-popup-background', '#ffffff')
      root.style.setProperty('--van-dialog-background', '#ffffff')
      root.style.setProperty('--van-nav-bar-background', '#ffffff')
      root.style.setProperty('--van-cell-background', '#ffffff')
    }
  }
  
  // 切换主题
  const toggleTheme = () => {
    const newTheme = theme.value === 'light' ? 'dark' : 'light'
    theme.value = newTheme
    localStorage.setItem('app_theme', newTheme)
    applyTheme(newTheme)
  }
  
  // 设置语言
  const setLocale = (lang: string) => {
    locale.value = lang
    localStorage.setItem('app_locale', lang)
  }
  
  // 更新设置
  const updateSettings = (newSettings: Partial<typeof settings.value>) => {
    settings.value = { ...settings.value, ...newSettings }
    localStorage.setItem('app_settings', JSON.stringify(settings.value))
  }
  
  // 初始化应用
  const initApp = () => {
    // 恢复设置
    const savedLocale = localStorage.getItem('app_locale')
    if (savedLocale) {
      locale.value = savedLocale
    }
    
    const savedSettings = localStorage.getItem('app_settings')
    if (savedSettings) {
      settings.value = { ...settings.value, ...JSON.parse(savedSettings) }
    }
    
    initTheme()
  }
  
  return {
    // 状态
    theme,
    locale,
    settings,
    
    // 方法
    initTheme,
    toggleTheme,
    setLocale,
    updateSettings,
    initApp,
  }
})