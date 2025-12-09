<template>
  <component
    :is="tag"
    :class="buttonClasses"
    :disabled="disabled || loading"
    :type="htmlType"
    v-bind="$attrs"
    @click="handleClick"
  >
    <!-- Loading 狀態 -->
    <span v-if="loading" class="t-button__loading">
      <TIcon name="loading" class="t-button__loading-icon" />
    </span>
    
    <!-- 前置圖示 -->
    <TIcon 
      v-if="prefixIcon && !loading" 
      :name="prefixIcon" 
      class="t-button__prefix-icon"
    />
    
    <!-- 按鈕內容 -->
    <span v-if="$slots.default || text" class="t-button__content">
      <slot>{{ text }}</slot>
    </span>
    
    <!-- 後置圖示 -->
    <TIcon 
      v-if="suffixIcon && !loading" 
      :name="suffixIcon" 
      class="t-button__suffix-icon"
    />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TIcon from '../Icon/TIcon.vue'

// 組件名稱
defineOptions({
  name: 'TButton',
  inheritAttrs: false,
})

// 屬性定義
export interface ButtonProps {
  // 樣式類型
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link'
  // 尺寸
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  // 顏色主題
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
  // 按鈕文字
  text?: string
  // HTML 類型
  htmlType?: 'button' | 'submit' | 'reset'
  // 標籤類型
  tag?: string
  // 狀態
  disabled?: boolean
  loading?: boolean
  // 形狀
  block?: boolean
  round?: boolean
  circle?: boolean
  // 圖示
  prefixIcon?: string
  suffixIcon?: string
}

const props = withDefaults(defineProps<ButtonProps>(), {
  variant: 'primary',
  size: 'md',
  color: 'primary',
  htmlType: 'button',
  tag: 'button',
  disabled: false,
  loading: false,
  block: false,
  round: false,
  circle: false,
})

// 事件定義
const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

// 按鈕樣式類別
const buttonClasses = computed(() => {
  const classes = [
    't-button',
    `t-button--${props.variant}`,
    `t-button--${props.size}`,
    `t-button--${props.color}`,
  ]
  
  if (props.disabled) classes.push('t-button--disabled')
  if (props.loading) classes.push('t-button--loading')
  if (props.block) classes.push('t-button--block')
  if (props.round) classes.push('t-button--round')
  if (props.circle) classes.push('t-button--circle')
  
  return classes
})

// 點擊事件處理
const handleClick = (event: MouseEvent) => {
  if (props.disabled || props.loading) {
    event.preventDefault()
    event.stopPropagation()
    return
  }
  
  emit('click', event)
}
</script>

<style scoped>
.t-button {
  /* 基本樣式 */
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
  vertical-align: middle;
  user-select: none;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  
  /* 禁用選擇 */
  -webkit-tap-highlight-color: transparent;
  
  /* 預設尺寸 */
  border-radius: var(--t-radius-md, 0.375rem);
  font-size: var(--t-font-size-sm, 0.875rem);
  line-height: 1.25;
  padding: var(--t-spacing-2, 0.5rem) var(--t-spacing-4, 1rem);
  min-height: 2.5rem;
  gap: var(--t-spacing-2, 0.5rem);
}

/* 尺寸變化 */
.t-button--xs {
  padding: var(--t-spacing-1, 0.25rem) var(--t-spacing-2, 0.5rem);
  font-size: var(--t-font-size-xs, 0.75rem);
  min-height: 1.75rem;
  gap: var(--t-spacing-1, 0.25rem);
}

.t-button--sm {
  padding: var(--t-spacing-1-5, 0.375rem) var(--t-spacing-3, 0.75rem);
  font-size: var(--t-font-size-sm, 0.875rem);
  min-height: 2rem;
}

.t-button--lg {
  padding: var(--t-spacing-3, 0.75rem) var(--t-spacing-6, 1.5rem);
  font-size: var(--t-font-size-base, 1rem);
  min-height: 3rem;
}

.t-button--xl {
  padding: var(--t-spacing-4, 1rem) var(--t-spacing-8, 2rem);
  font-size: var(--t-font-size-lg, 1.125rem);
  min-height: 3.5rem;
}

/* 主要樣式 - Primary */
.t-button--primary {
  background-color: var(--t-primary-500, #0ea5e9);
  border-color: var(--t-primary-500, #0ea5e9);
  color: var(--t-semantic-text-inverse, #ffffff);
}

.t-button--primary:hover:not(.t-button--disabled) {
  background-color: var(--t-primary-600, #0284c7);
  border-color: var(--t-primary-600, #0284c7);
}

.t-button--primary:active:not(.t-button--disabled) {
  background-color: var(--t-primary-700, #0369a1);
  border-color: var(--t-primary-700, #0369a1);
}

/* 次要樣式 - Secondary */
.t-button--secondary {
  background-color: var(--t-secondary-100, #f4f4f5);
  border-color: var(--t-secondary-300, #d4d4d8);
  color: var(--t-secondary-700, #3f3f46);
}

.t-button--secondary:hover:not(.t-button--disabled) {
  background-color: var(--t-secondary-200, #e4e4e7);
  border-color: var(--t-secondary-400, #a1a1aa);
}

/* 輪廇樣式 - Outline */
.t-button--outline {
  background-color: transparent;
  border-color: var(--t-primary-500, #0ea5e9);
  color: var(--t-primary-500, #0ea5e9);
}

.t-button--outline:hover:not(.t-button--disabled) {
  background-color: var(--t-primary-50, #f0f9ff);
  border-color: var(--t-primary-600, #0284c7);
  color: var(--t-primary-600, #0284c7);
}

/* 幽靈樣式 - Ghost */
.t-button--ghost {
  background-color: transparent;
  border-color: transparent;
  color: var(--t-primary-500, #0ea5e9);
}

.t-button--ghost:hover:not(.t-button--disabled) {
  background-color: var(--t-primary-50, #f0f9ff);
  color: var(--t-primary-600, #0284c7);
}

/* 連結樣式 - Link */
.t-button--link {
  background-color: transparent;
  border-color: transparent;
  color: var(--t-primary-500, #0ea5e9);
  text-decoration: underline;
  text-underline-offset: 2px;
  padding: 0;
  min-height: auto;
}

.t-button--link:hover:not(.t-button--disabled) {
  color: var(--t-primary-600, #0284c7);
}

/* 顏色變化 */
.t-button--success {
  --t-primary-500: var(--t-success-500, #22c55e);
  --t-primary-600: var(--t-success-600, #16a34a);
  --t-primary-700: var(--t-success-700, #15803d);
  --t-primary-50: var(--t-success-50, #f0fdf4);
}

.t-button--warning {
  --t-primary-500: var(--t-warning-500, #eab308);
  --t-primary-600: var(--t-warning-600, #ca8a04);
  --t-primary-700: var(--t-warning-700, #a16207);
  --t-primary-50: var(--t-warning-50, #fefce8);
}

.t-button--error {
  --t-primary-500: var(--t-error-500, #ef4444);
  --t-primary-600: var(--t-error-600, #dc2626);
  --t-primary-700: var(--t-error-700, #b91c1c);
  --t-primary-50: var(--t-error-50, #fef2f2);
}

/* 特殊形狀 */
.t-button--block {
  display: flex;
  width: 100%;
}

.t-button--round {
  border-radius: 9999px;
}

.t-button--circle {
  border-radius: 50%;
  width: var(--t-button-height, 2.5rem);
  height: var(--t-button-height, 2.5rem);
  padding: 0;
}

.t-button--circle.t-button--xs {
  --t-button-height: 1.75rem;
}

.t-button--circle.t-button--sm {
  --t-button-height: 2rem;
}

.t-button--circle.t-button--lg {
  --t-button-height: 3rem;
}

.t-button--circle.t-button--xl {
  --t-button-height: 3.5rem;
}

/* 狀態樣式 */
.t-button--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.t-button--loading {
  pointer-events: none;
}

/* Loading 狀態 */
.t-button__loading {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  inset: 0;
}

.t-button__loading-icon {
  animation: t-button-spin 1s linear infinite;
}

@keyframes t-button-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 內容區域 */
.t-button__content {
  display: flex;
  align-items: center;
}

.t-button--loading .t-button__content {
  opacity: 0;
}

/* 圖示樣式 */
.t-button__prefix-icon,
.t-button__suffix-icon {
  flex-shrink: 0;
}

/* 焦點樣式 */
.t-button:focus-visible {
  outline: 2px solid var(--t-primary-500, #0ea5e9);
  outline-offset: 2px;
}

/* 高對比度模式 */
@media (prefers-contrast: high) {
  .t-button {
    border-width: 2px;
  }
}

/* 減少動畫模式 */
@media (prefers-reduced-motion: reduce) {
  .t-button {
    transition: none;
  }
  
  .t-button__loading-icon {
    animation: none;
  }
}
</style>
