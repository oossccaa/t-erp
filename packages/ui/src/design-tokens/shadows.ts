// 設計系統 - 陰影定義
export const shadows = {
  // 基本陰影
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',

  // 特殊陰影
  outline: '0 0 0 3px rgba(59, 130, 246, 0.5)',
  focus: '0 0 0 3px rgba(59, 130, 246, 0.3)',
} as const

// 語義化陰影
export const semanticShadows = {
  // 卡片陰影
  card: {
    resting: shadows.base,
    hover: shadows.md,
    pressed: shadows.sm,
    elevated: shadows.lg,
  },

  // 按鈕陰影
  button: {
    resting: shadows.sm,
    hover: shadows.md,
    pressed: shadows.inner,
    focus: shadows.focus,
  },

  // 模态窗陰影
  modal: {
    backdrop: '0 0 0 1000px rgba(0, 0, 0, 0.5)',
    content: shadows.xl,
  },

  // 下拉選單陰影
  dropdown: {
    menu: shadows.lg,
    item: shadows.none,
  },

  // 輸入框陰影
  input: {
    normal: shadows.none,
    focus: shadows.focus,
    error: '0 0 0 3px rgba(239, 68, 68, 0.3)',
    success: '0 0 0 3px rgba(34, 197, 94, 0.3)',
  },

  // 通知陰影
  notification: {
    toast: shadows.lg,
    alert: shadows.md,
  },
} as const

export type ShadowToken = keyof typeof shadows
export type SemanticShadowCategory = keyof typeof semanticShadows
