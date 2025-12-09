// 設計 Tokens 統一導出
export * from './colors'
export * from './spacing'
export * from './typography'
export * from './shadows'
export * from './breakpoints'

// 設計系統主題
export const theme = {
  // 主要配置
  name: 'T-ERP Design System',
  version: '1.0.0',
  
  // 預設值
  defaults: {
    borderRadius: '0.375rem', // 6px
    transitionDuration: '150ms',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    focusRing: {
      width: '2px',
      style: 'solid',
      offset: '2px',
    },
  },
  
  // Z-index 層級
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  },
  
  // 動畫時間
  animation: {
    duration: {
      fastest: '50ms',
      faster: '100ms',
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
      slower: '400ms',
      slowest: '500ms',
    },
    
    easing: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
} as const

export type Theme = typeof theme
