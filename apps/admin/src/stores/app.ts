import { defineStore } from 'pinia'

export interface AppState {
  // 主題設定
  isDark: boolean
  themeColor: string

  // 布局設定
  sidebarCollapsed: boolean
  sidebarWidth: number

  // 語言設定
  locale: 'zh-TW' | 'en-US'

  // 系統設定
  pageSize: number
  showBreadcrumb: boolean
  showTabs: boolean
  keepAlive: boolean

  // 網絡狀態
  isOnline: boolean
  loading: boolean
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    isDark: localStorage.getItem('theme') === 'dark',
    themeColor: localStorage.getItem('themeColor') || '#409eff',
    sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true',
    sidebarWidth: 240,
    locale: (localStorage.getItem('locale') as AppState['locale']) || 'zh-TW',
    pageSize: Number(localStorage.getItem('pageSize')) || 10,
    showBreadcrumb: localStorage.getItem('showBreadcrumb') !== 'false',
    showTabs: localStorage.getItem('showTabs') !== 'false',
    keepAlive: localStorage.getItem('keepAlive') !== 'false',
    isOnline: navigator.onLine,
    loading: false,
  }),
  
  getters: {
    theme: (state) => state.isDark ? 'dark' : 'light',
    sidebarActualWidth: (state) => state.sidebarCollapsed ? 64 : state.sidebarWidth,
  },
  
  actions: {
    // 初始化主題
    initTheme() {
      // 應用當前主題到 DOM
      document.documentElement.classList.toggle('dark', this.isDark)

      // 應用主題顏色
      if (this.themeColor) {
        document.documentElement.style.setProperty('--el-color-primary', this.themeColor)
      }

      // 監聽系統主題變更
      this.watchSystemTheme()

      // 監聽網絡狀態
      this.watchOnlineStatus()
    },

    // 切換主題
    toggleTheme() {
      this.isDark = !this.isDark
      localStorage.setItem('theme', this.theme)

      // 更新 Element Plus 主題
      document.documentElement.classList.toggle('dark', this.isDark)
    },
    
    // 設定主題顏色
    setThemeColor(color: string) {
      this.themeColor = color
      localStorage.setItem('themeColor', color)
      
      // 更新 CSS 變數
      document.documentElement.style.setProperty('--el-color-primary', color)
    },
    
    // 切換側邊欄
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
      localStorage.setItem('sidebarCollapsed', String(this.sidebarCollapsed))
    },
    
    // 設定側邊欄狀態
    setSidebarCollapsed(collapsed: boolean) {
      this.sidebarCollapsed = collapsed
      localStorage.setItem('sidebarCollapsed', String(collapsed))
    },
    
    // 設定語言
    setLocale(locale: AppState['locale']) {
      this.locale = locale
      localStorage.setItem('locale', locale)
    },
    
    // 設定分頁大小
    setPageSize(size: number) {
      this.pageSize = size
      localStorage.setItem('pageSize', String(size))
    },
    
    // 設定面包屑顯示
    setBreadcrumb(show: boolean) {
      this.showBreadcrumb = show
      localStorage.setItem('showBreadcrumb', String(show))
    },
    
    // 設定標籤頁顯示
    setTabs(show: boolean) {
      this.showTabs = show
      localStorage.setItem('showTabs', String(show))
    },
    
    // 設定緩存狀態
    setKeepAlive(keep: boolean) {
      this.keepAlive = keep
      localStorage.setItem('keepAlive', String(keep))
    },
    
    // 設定載入狀態
    setLoading(loading: boolean) {
      this.loading = loading
    },
    
    // 監聽系統主題
    watchSystemTheme() {
      if (typeof window !== 'undefined') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        
        mediaQuery.addEventListener('change', (e) => {
          // 如果用戶沒有手動設定主題，則跟隨系統
          const savedTheme = localStorage.getItem('theme')
          if (!savedTheme) {
            this.isDark = e.matches
            document.documentElement.classList.toggle('dark', this.isDark)
          }
        })
      }
    },
    
    // 監聽網絡狀態
    watchOnlineStatus() {
      if (typeof window !== 'undefined') {
        window.addEventListener('online', () => {
          this.isOnline = true
        })
        
        window.addEventListener('offline', () => {
          this.isOnline = false
        })
      }
    },
    
    // 重設設定
    resetSettings() {
      // 清除 localStorage
      const keysToRemove = [
        'theme',
        'themeColor',
        'sidebarCollapsed',
        'locale',
        'pageSize',
        'showBreadcrumb',
        'showTabs',
        'keepAlive',
      ]
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
      })
      
      // 重設狀態
      this.isDark = false
      this.themeColor = '#409eff'
      this.sidebarCollapsed = false
      this.locale = 'zh-TW'
      this.pageSize = 10
      this.showBreadcrumb = true
      this.showTabs = true
      this.keepAlive = true
      
      // 重新初始化主題
      this.initTheme()
    },
  },
})
