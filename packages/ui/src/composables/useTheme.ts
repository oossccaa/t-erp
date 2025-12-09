import { ref, computed, inject, provide, readonly } from 'vue'
import type { InjectionKey, Ref, ComputedRef } from 'vue'
import { theme as defaultTheme } from '../design-tokens'
import type { Theme } from '../design-tokens'

// 主題配置類型
export interface ThemeConfig {
  theme: Theme
  mode: 'light' | 'dark' | 'auto'
  customColors?: Record<string, string>
}

export interface ThemeContext {
  config: Ref<ThemeConfig>
  mode: ComputedRef<'light' | 'dark'>
  isDark: ComputedRef<boolean>
  isLight: ComputedRef<boolean>
  toggleMode: () => void
  setMode: (mode: 'light' | 'dark' | 'auto') => void
  updateTheme: (theme: Partial<Theme>) => void
}

// 主題依賽注入的 Key
export const themeContextKey: InjectionKey<ThemeContext> = Symbol('theme-context')

// 主題 Provider
export function createThemeProvider(initialConfig?: Partial<ThemeConfig>) {
  const config = ref<ThemeConfig>({
    theme: defaultTheme,
    mode: 'light',
    customColors: {},
    ...initialConfig,
  })

  // 系統主題檢測
  const systemPrefersDark = ref(false)
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    systemPrefersDark.value = mediaQuery.matches
    
    mediaQuery.addEventListener('change', (e) => {
      systemPrefersDark.value = e.matches
    })
  }

  // 當前主題模式
  const mode = computed(() => {
    if (config.value.mode === 'auto') {
      return systemPrefersDark.value ? 'dark' : 'light'
    }
    return config.value.mode
  })

  const isDark = computed(() => mode.value === 'dark')
  const isLight = computed(() => mode.value === 'light')

  // 切換主題模式
  const toggleMode = () => {
    config.value.mode = isDark.value ? 'light' : 'dark'
  }

  const setMode = (newMode: 'light' | 'dark' | 'auto') => {
    config.value.mode = newMode
  }

  // 更新主題
  const updateTheme = (themeUpdate: Partial<Theme>) => {
    config.value.theme = {
      ...config.value.theme,
      ...themeUpdate,
    }
  }

  const themeContext: ThemeContext = {
    config: readonly(config),
    mode,
    isDark,
    isLight,
    toggleMode,
    setMode,
    updateTheme,
  }

  provide(themeContextKey, themeContext)
  
  return themeContext
}

// 主題 Consumer
export function useTheme(): ThemeContext {
  const context = inject(themeContextKey)
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  
  return context
}

// CSS 變數生成器
export function generateCSSVariables(theme: Theme, mode: 'light' | 'dark') {
  const variables: Record<string, string> = {}
  
  // 生成顏色變數
  Object.entries(theme).forEach(([category, values]) => {
    if (typeof values === 'object' && values !== null) {
      Object.entries(values).forEach(([key, value]) => {
        if (typeof value === 'string') {
          variables[`--t-${category}-${key}`] = value
        } else if (typeof value === 'object') {
          Object.entries(value).forEach(([subKey, subValue]) => {
            variables[`--t-${category}-${key}-${subKey}`] = String(subValue)
          })
        }
      })
    }
  })
  
  // 添加主題模式
  variables['--t-mode'] = mode
  
  return variables
}

// 主題 CSS 樣式產生
export function useThemeCSS() {
  const { config, mode } = useTheme()
  
  return computed(() => {
    const variables = generateCSSVariables(config.value.theme, mode.value)
    
    return Object.entries(variables)
      .map(([key, value]) => `${key}: ${value};`)
      .join('\n')
  })
}
