// T-ERP UI 組件庫主要導出
export * from './design-tokens'
export { useTheme, createThemeProvider, generateCSSVariables, useThemeCSS } from './composables/useTheme'
export * from './composables/useResponsive'

// 基礎組件
export { default as TButton } from './components/Button/TButton.vue'
export { default as TIcon } from './components/Icon/TIcon.vue'
export { default as TInput } from './components/Input/TInput.vue'
export { default as TDataTable } from './components/DataTable/TDataTable.vue'
export { default as TPagination } from './components/Pagination/TPagination.vue'

// 組件類型導出
export type { ButtonProps } from './components/Button/TButton.vue'
export type { IconProps } from './components/Icon/TIcon.vue'
export type { InputProps } from './components/Input/TInput.vue'
export type { DataTableProps, TableColumn } from './components/DataTable/TDataTable.vue'
export type { PaginationProps } from './components/Pagination/TPagination.vue'

// Composables 類型
export type { ThemeConfig, ThemeContext } from './composables/useTheme'
export type { ResponsiveContext } from './composables/useResponsive'

// 設計 Token 類型
export type { 
  ColorToken, 
  ColorShade, 
  SpacingToken, 
  SemanticSpacingCategory, 
  SemanticSpacingSize,
  FontSizeToken,
  FontWeightToken, 
  LineHeightToken,
  LetterSpacingToken,
  TypographyVariant,
  ShadowToken,
  SemanticShadowCategory,
  BreakpointToken,
  DeviceType,
  Theme
} from './design-tokens'

// 版本資訊
export const version = '1.0.0'
