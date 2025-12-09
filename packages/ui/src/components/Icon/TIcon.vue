<template>
  <component
    :is="tag"
    :class="iconClasses"
    :style="iconStyles"
    v-bind="$attrs"
  >
    <!-- SVG 圖示 -->
    <svg
      v-if="isSvg"
      :width="computedSize"
      :height="computedSize"
      :viewBox="svgViewBox"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        :d="svgPath"
        :fill="computedColor"
        :stroke="strokeColor"
        :stroke-width="strokeWidth"
      />
    </svg>
    
    <!-- 字體圖示 -->
    <i v-else :class="fontIconClass"></i>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// 內建圖示定義
const BUILT_IN_ICONS: Record<string, { viewBox: string; path: string }> = {
  loading: {
    viewBox: '0 0 24 24',
    path: 'M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83',
  },
  check: {
    viewBox: '0 0 24 24',
    path: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
  },
  close: {
    viewBox: '0 0 24 24',
    path: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  },
  arrow_up: {
    viewBox: '0 0 24 24',
    path: 'M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z',
  },
  arrow_down: {
    viewBox: '0 0 24 24',
    path: 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z',
  },
  arrow_left: {
    viewBox: '0 0 24 24',
    path: 'M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z',
  },
  arrow_right: {
    viewBox: '0 0 24 24',
    path: 'M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z',
  },
  search: {
    viewBox: '0 0 24 24',
    path: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
  },
  menu: {
    viewBox: '0 0 24 24',
    path: 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z',
  },
  more_vertical: {
    viewBox: '0 0 24 24',
    path: 'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
  },
  settings: {
    viewBox: '0 0 24 24',
    path: 'M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z',
  },
}

// 組件名稱
defineOptions({
  name: 'TIcon',
  inheritAttrs: false,
})

// 屬性定義
export interface IconProps {
  // 圖示名稱
  name: string
  // 尺寸
  size?: string | number
  // 顏色
  color?: string
  // HTML 標籤
  tag?: string
  // SVG 特殊屬性
  strokeColor?: string
  strokeWidth?: string | number
  // 字體圖示类別
  fontClass?: string
}

const props = withDefaults(defineProps<IconProps>(), {
  size: 20,
  color: 'currentColor',
  tag: 'span',
  strokeWidth: 1,
  fontClass: 'icon',
})

// 判斷是否為 SVG 圖示
const isSvg = computed(() => {
  return BUILT_IN_ICONS[props.name] !== undefined
})

// 計算尺寸
const computedSize = computed(() => {
  return typeof props.size === 'number' ? `${props.size}px` : props.size
})

// 計算顏色
const computedColor = computed(() => {
  return props.color === 'currentColor' ? 'currentColor' : props.color
})

// SVG 視窗
const svgViewBox = computed(() => {
  return BUILT_IN_ICONS[props.name]?.viewBox || '0 0 24 24'
})

// SVG 路徑
const svgPath = computed(() => {
  return BUILT_IN_ICONS[props.name]?.path || ''
})

// 字體圖示類別
const fontIconClass = computed(() => {
  return `${props.fontClass} ${props.fontClass}-${props.name}`
})

// 圖示樣式類別
const iconClasses = computed(() => {
  const classes = ['t-icon']
  
  if (isSvg.value) {
    classes.push('t-icon--svg')
  } else {
    classes.push('t-icon--font')
  }
  
  return classes
})

// 圖示樣式
const iconStyles = computed(() => {
  const styles: Record<string, string> = {}
  
  if (!isSvg.value) {
    styles.fontSize = computedSize.value
    styles.color = computedColor.value
  }
  
  return styles
})
</script>

<style scoped>
.t-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  vertical-align: middle;
}

.t-icon--svg {
  line-height: 1;
}

.t-icon--svg svg {
  display: block;
  width: 100%;
  height: 100%;
}

.t-icon--font {
  line-height: 1;
}

/* 內建動畫效果 */
.t-icon svg[stroke] {
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* Loading 動畫 */
.t-icon .t-icon-loading {
  animation: t-icon-spin 1s linear infinite;
}

@keyframes t-icon-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 減少動畫模式 */
@media (prefers-reduced-motion: reduce) {
  .t-icon .t-icon-loading {
    animation: none;
  }
}
</style>
