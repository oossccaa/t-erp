import { ref, onMounted, onUnmounted, computed } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import { breakpoints, deviceBreakpoints } from '../design-tokens'
import type { BreakpointToken, DeviceType } from '../design-tokens'

// 響應式 hook 類型
export interface ResponsiveContext {
  // 當前窧口尺寸
  width: Ref<number>
  height: Ref<number>
  
  // 當前斷點
  currentBreakpoint: ComputedRef<BreakpointToken>
  
  // 設備類型
  isMobile: ComputedRef<boolean>
  isTablet: ComputedRef<boolean>
  isDesktop: ComputedRef<boolean>
  isWidescreen: ComputedRef<boolean>
  
  // 斷點判斷
  isUp: (breakpoint: BreakpointToken) => boolean
  isDown: (breakpoint: BreakpointToken) => boolean
  isBetween: (min: BreakpointToken, max: BreakpointToken) => boolean
  isOnly: (breakpoint: BreakpointToken) => boolean
}

// 響應式 composable
export function useResponsive(): ResponsiveContext {
  const width = ref(0)
  const height = ref(0)

  // 更新窧口尺寸
  const updateSize = () => {
    if (typeof window !== 'undefined') {
      width.value = window.innerWidth
      height.value = window.innerHeight
    }
  }

  // 當前斷點
  const currentBreakpoint = computed<BreakpointToken>(() => {
    const w = width.value
    const breakpointEntries = Object.entries(breakpoints)
      .map(([key, value]) => [key, parseInt(value)] as [BreakpointToken, number])
      .sort(([, a], [, b]) => b - a) // 從大到小排序
    
    for (const [key, value] of breakpointEntries) {
      if (w >= value) {
        return key
      }
    }
    
    return 'xs'
  })

  // 設備類型判斷
  const isMobile = computed(() => {
    const w = width.value
    return w < parseInt(breakpoints.md)
  })

  const isTablet = computed(() => {
    const w = width.value
    return w >= parseInt(breakpoints.md) && w < parseInt(breakpoints.lg)
  })

  const isDesktop = computed(() => {
    const w = width.value
    return w >= parseInt(breakpoints.lg)
  })

  const isWidescreen = computed(() => {
    const w = width.value
    return w >= parseInt(breakpoints.xxl)
  })

  // 斷點判斷函數
  const isUp = (breakpoint: BreakpointToken): boolean => {
    return width.value >= parseInt(breakpoints[breakpoint])
  }

  const isDown = (breakpoint: BreakpointToken): boolean => {
    const breakpointKeys = Object.keys(breakpoints) as BreakpointToken[]
    const currentIndex = breakpointKeys.indexOf(breakpoint)
    const nextBreakpoint = breakpointKeys[currentIndex + 1]
    
    if (!nextBreakpoint) return true
    
    return width.value < parseInt(breakpoints[nextBreakpoint])
  }

  const isBetween = (min: BreakpointToken, max: BreakpointToken): boolean => {
    return isUp(min) && isDown(max)
  }

  const isOnly = (breakpoint: BreakpointToken): boolean => {
    const breakpointKeys = Object.keys(breakpoints) as BreakpointToken[]
    const currentIndex = breakpointKeys.indexOf(breakpoint)
    
    if (currentIndex === 0) {
      return isDown(breakpointKeys[1])
    }
    
    if (currentIndex === breakpointKeys.length - 1) {
      return isUp(breakpoint)
    }
    
    return isBetween(breakpoint, breakpointKeys[currentIndex + 1])
  }

  // 生命週期管理
  onMounted(() => {
    updateSize()
    window.addEventListener('resize', updateSize, { passive: true })
  })

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', updateSize)
    }
  })

  return {
    width,
    height,
    currentBreakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isWidescreen,
    isUp,
    isDown,
    isBetween,
    isOnly,
  }
}

// 媒體查詢 hook
export function useMediaQuery(query: string): Ref<boolean> {
  const matches = ref(false)
  
  onMounted(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia(query)
      matches.value = mediaQuery.matches
      
      const handler = (e: MediaQueryListEvent) => {
        matches.value = e.matches
      }
      
      mediaQuery.addEventListener('change', handler)
      
      onUnmounted(() => {
        mediaQuery.removeEventListener('change', handler)
      })
    }
  })
  
  return matches
}

// 預定義斷點 hooks
export function useMobileDetection() {
  return useMediaQuery(`(max-width: ${parseInt(breakpoints.md) - 1}px)`)
}

export function useTabletDetection() {
  return useMediaQuery(
    `(min-width: ${breakpoints.md}) and (max-width: ${parseInt(breakpoints.lg) - 1}px)`
  )
}

export function useDesktopDetection() {
  return useMediaQuery(`(min-width: ${breakpoints.lg})`)
}

// 方向判斷
export function useOrientation() {
  const isPortrait = useMediaQuery('(orientation: portrait)')
  const isLandscape = computed(() => !isPortrait.value)
  
  return {
    isPortrait,
    isLandscape,
  }
}

// 減少動畫偏好
export function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

// 高對比度偏好
export function usePrefersHighContrast() {
  return useMediaQuery('(prefers-contrast: high)')
}
