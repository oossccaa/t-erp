// 設計系統 - 響應式斷點定義
export const breakpoints = {
  // 手機優先設計
  xs: '0px',      // 手機 (小型)
  sm: '576px',    // 手機 (大型)
  md: '768px',    // 平板
  lg: '1024px',   // 桌機 (小型)
  xl: '1200px',   // 桌機 (中型)
  xxl: '1400px',  // 桌機 (大型)
} as const

// 媒體查詢輔助函數
export const media = {
  // 最小寬度
  up: (breakpoint: keyof typeof breakpoints) => `@media (min-width: ${breakpoints[breakpoint]})`,
  
  // 最大寬度
  down: (breakpoint: keyof typeof breakpoints) => {
    const breakpointValues = Object.values(breakpoints)
    const currentIndex = Object.keys(breakpoints).indexOf(breakpoint)
    const nextValue = breakpointValues[currentIndex + 1]
    
    if (!nextValue) return '@media (max-width: 9999px)'
    
    const maxWidth = parseInt(nextValue) - 0.02
    return `@media (max-width: ${maxWidth}px)`
  },
  
  // 範圍查詢
  between: (min: keyof typeof breakpoints, max: keyof typeof breakpoints) => 
    `@media (min-width: ${breakpoints[min]}) and (max-width: ${parseInt(breakpoints[max]) - 0.02}px)`,
    
  // 僅在特定斷點
  only: (breakpoint: keyof typeof breakpoints) => {
    const keys = Object.keys(breakpoints) as Array<keyof typeof breakpoints>
    const currentIndex = keys.indexOf(breakpoint)
    
    if (currentIndex === 0) {
      return media.down(keys[1])
    }
    
    if (currentIndex === keys.length - 1) {
      return media.up(breakpoint)
    }
    
    return media.between(breakpoint, keys[currentIndex + 1])
  },
} as const

// 語義化斷點
export const deviceBreakpoints = {
  mobile: {
    min: breakpoints.xs,
    max: breakpoints.sm,
    query: media.between('xs', 'md'),
  },
  tablet: {
    min: breakpoints.md,
    max: breakpoints.lg,
    query: media.between('md', 'xl'),
  },
  desktop: {
    min: breakpoints.lg,
    max: breakpoints.xxl,
    query: media.up('lg'),
  },
  widescreen: {
    min: breakpoints.xxl,
    query: media.up('xxl'),
  },
} as const

// 容器最大寬度
export const containerMaxWidths = {
  sm: '540px',
  md: '720px',
  lg: '960px',
  xl: '1140px',
  xxl: '1320px',
} as const

export type BreakpointToken = keyof typeof breakpoints
export type DeviceType = keyof typeof deviceBreakpoints
