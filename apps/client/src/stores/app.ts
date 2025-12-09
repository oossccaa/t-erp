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
      applyTheme(savedTheme)
    }
  }
  
  // 应用主题
  const applyTheme = (themeMode: 'light' | 'dark') => {
    document.documentElement.setAttribute('data-theme', themeMode)
    
    // 设置 CSS 变量
    const root = document.documentElement
    if (themeMode === 'dark') {
      root.style.setProperty('--van-background-color', '#1a1a1a')
      root.style.setProperty('--van-text-color', '#ffffff')
    } else {
      root.style.setProperty('--van-background-color', '#f7f8fa')
      root.style.setProperty('--van-text-color', '#323233')
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