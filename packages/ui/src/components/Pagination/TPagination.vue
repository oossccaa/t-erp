<template>
  <div class="t-pagination" :class="paginationClasses">
    <!-- 總数顯示 -->
    <div v-if="showTotal" class="t-pagination__total">
      <slot name="total" :total="total" :range="currentRange">
        共 {{ total }} 項，第 {{ currentRange[0] }}-{{ currentRange[1] }} 項
      </slot>
    </div>
    
    <!-- 分頁尺寸選擇器 -->
    <div v-if="showSizeChanger" class="t-pagination__size-changer">
      <label class="t-pagination__size-label">每頁顯示</label>
      <select 
        v-model="currentPageSize"
        class="t-pagination__size-select"
        @change="handleSizeChange"
      >
        <option 
          v-for="size in pageSizeOptions" 
          :key="size" 
          :value="size"
        >
          {{ size }}
        </option>
      </select>
      <span class="t-pagination__size-suffix">項</span>
    </div>
    
    <!-- 分頁器 -->
    <nav class="t-pagination__nav" aria-label="分頁導航">
      <!-- 上一頁 -->
      <button
        type="button"
        :disabled="currentPage <= 1"
        class="t-pagination__button t-pagination__button--prev"
        @click="handlePrevPage"
        aria-label="上一頁"
      >
        <TIcon name="arrow_left" />
        <span v-if="showText">上一頁</span>
      </button>
      
      <!-- 页码清单 -->
      <ul class="t-pagination__list">
        <!-- 第一頁 -->
        <li v-if="pageNumbers.includes(1)" class="t-pagination__item">
          <button
            type="button"
            :class="getPageButtonClass(1)"
            @click="handlePageChange(1)"
            :aria-label="`第 1 頁`"
            :aria-current="currentPage === 1 ? 'page' : undefined"
          >
            1
          </button>
        </li>
        
        <!-- 省略符 -->
        <li v-if="showStartEllipsis" class="t-pagination__item t-pagination__item--ellipsis">
          <button
            type="button"
            class="t-pagination__button t-pagination__button--ellipsis"
            @click="handleJumpBackward"
            :aria-label="`往前 ${fastJumpStep} 頁`"
          >
            <TIcon name="more_vertical" />
          </button>
        </li>
        
        <!-- 中間页码 -->
        <li 
          v-for="page in middlePages" 
          :key="page" 
          class="t-pagination__item"
        >
          <button
            type="button"
            :class="getPageButtonClass(page)"
            @click="handlePageChange(page)"
            :aria-label="`第 ${page} 頁`"
            :aria-current="currentPage === page ? 'page' : undefined"
          >
            {{ page }}
          </button>
        </li>
        
        <!-- 省略符 -->
        <li v-if="showEndEllipsis" class="t-pagination__item t-pagination__item--ellipsis">
          <button
            type="button"
            class="t-pagination__button t-pagination__button--ellipsis"
            @click="handleJumpForward"
            :aria-label="`往後 ${fastJumpStep} 頁`"
          >
            <TIcon name="more_vertical" />
          </button>
        </li>
        
        <!-- 最後一頁 -->
        <li v-if="pageNumbers.includes(totalPages) && totalPages > 1" class="t-pagination__item">
          <button
            type="button"
            :class="getPageButtonClass(totalPages)"
            @click="handlePageChange(totalPages)"
            :aria-label="`第 ${totalPages} 頁`"
            :aria-current="currentPage === totalPages ? 'page' : undefined"
          >
            {{ totalPages }}
          </button>
        </li>
      </ul>
      
      <!-- 下一頁 -->
      <button
        type="button"
        :disabled="currentPage >= totalPages"
        class="t-pagination__button t-pagination__button--next"
        @click="handleNextPage"
        aria-label="下一頁"
      >
        <span v-if="showText">下一頁</span>
        <TIcon name="arrow_right" />
      </button>
    </nav>
    
    <!-- 快速跳轉 -->
    <div v-if="showQuickJumper" class="t-pagination__jumper">
      <span class="t-pagination__jumper-label">跳至</span>
      <input
        v-model="jumpValue"
        type="number"
        :min="1"
        :max="totalPages"
        class="t-pagination__jumper-input"
        @keydown.enter="handleQuickJump"
        @blur="handleQuickJump"
        aria-label="跳轉頁碼"
      />
      <span class="t-pagination__jumper-suffix">頁</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import TIcon from '../Icon/TIcon.vue'

// 組件名稱
defineOptions({
  name: 'TPagination',
})

// 屬性定義
export interface PaginationProps {
  // 當前頁碼
  current?: number
  // 每頁大小
  pageSize?: number
  // 總数量
  total: number
  // 顯示範圍
  showRange?: number
  // 快速跳轉步長
  fastJumpStep?: number
  // 功能開關
  showTotal?: boolean
  showSizeChanger?: boolean
  showQuickJumper?: boolean
  showText?: boolean
  // 頁尺寸選項
  pageSizeOptions?: number[]
  // 尺寸
  size?: 'sm' | 'md' | 'lg'
  // 簡單模式
  simple?: boolean
  // 禁用
  disabled?: boolean
}

const props = withDefaults(defineProps<PaginationProps>(), {
  current: 1,
  pageSize: 10,
  showRange: 5,
  fastJumpStep: 5,
  showTotal: true,
  showSizeChanger: false,
  showQuickJumper: false,
  showText: false,
  pageSizeOptions: () => [10, 20, 50, 100],
  size: 'md',
  simple: false,
  disabled: false,
})

// 事件定義
const emit = defineEmits<{
  'update:current': [page: number]
  'update:pageSize': [size: number]
  'change': [page: number, pageSize: number]
  'showSizeChange': [current: number, size: number]
}>()

// 內部狀態
const currentPage = ref(props.current)
const currentPageSize = ref(props.pageSize)
const jumpValue = ref<number | string>('')

// 計算屬性
const totalPages = computed(() => {
  return Math.ceil(props.total / currentPageSize.value) || 1
})

const currentRange = computed(() => {
  const start = (currentPage.value - 1) * currentPageSize.value + 1
  const end = Math.min(currentPage.value * currentPageSize.value, props.total)
  return [start, end]
})

const paginationClasses = computed(() => {
  const classes = [`t-pagination--${props.size}`]
  
  if (props.simple) classes.push('t-pagination--simple')
  if (props.disabled) classes.push('t-pagination--disabled')
  
  return classes
})

// 页码计算
const pageNumbers = computed(() => {
  const range = props.showRange
  const current = currentPage.value
  const total = totalPages.value
  
  if (total <= range + 2) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  
  const half = Math.floor(range / 2)
  let start = current - half
  let end = current + half
  
  if (start <= 2) {
    start = 2
    end = start + range - 1
  }
  
  if (end >= total - 1) {
    end = total - 1
    start = end - range + 1
  }
  
  const pages = [1]
  for (let i = Math.max(start, 2); i <= Math.min(end, total - 1); i++) {
    pages.push(i)
  }
  if (total > 1) pages.push(total)
  
  return pages
})

const middlePages = computed(() => {
  return pageNumbers.value.filter(page => page !== 1 && page !== totalPages.value)
})

const showStartEllipsis = computed(() => {
  return pageNumbers.value.length > 0 && pageNumbers.value[1] > 2
})

const showEndEllipsis = computed(() => {
  const pages = pageNumbers.value
  return pages.length > 1 && pages[pages.length - 2] < totalPages.value - 1
})

// 方法
const getPageButtonClass = (page: number): string[] => {
  const classes = ['t-pagination__button', 't-pagination__button--page']
  
  if (page === currentPage.value) {
    classes.push('t-pagination__button--active')
  }
  
  return classes
}

const handlePageChange = (page: number) => {
  if (props.disabled || page === currentPage.value || page < 1 || page > totalPages.value) {
    return
  }
  
  currentPage.value = page
  emit('update:current', page)
  emit('change', page, currentPageSize.value)
}

const handlePrevPage = () => {
  handlePageChange(currentPage.value - 1)
}

const handleNextPage = () => {
  handlePageChange(currentPage.value + 1)
}

const handleJumpBackward = () => {
  const page = Math.max(1, currentPage.value - props.fastJumpStep)
  handlePageChange(page)
}

const handleJumpForward = () => {
  const page = Math.min(totalPages.value, currentPage.value + props.fastJumpStep)
  handlePageChange(page)
}

const handleSizeChange = () => {
  const newPageSize = currentPageSize.value
  const newPage = Math.min(currentPage.value, Math.ceil(props.total / newPageSize))
  
  currentPage.value = newPage
  
  emit('update:pageSize', newPageSize)
  emit('update:current', newPage)
  emit('showSizeChange', newPage, newPageSize)
  emit('change', newPage, newPageSize)
}

const handleQuickJump = () => {
  const value = Number(jumpValue.value)
  
  if (isNaN(value) || value < 1 || value > totalPages.value) {
    jumpValue.value = ''
    return
  }
  
  handlePageChange(value)
  jumpValue.value = ''
}

// 監聽 props 變化
watch(
  () => props.current,
  (newCurrent) => {
    if (newCurrent !== currentPage.value) {
      currentPage.value = newCurrent
    }
  }
)

watch(
  () => props.pageSize,
  (newPageSize) => {
    if (newPageSize !== currentPageSize.value) {
      currentPageSize.value = newPageSize
    }
  }
)

// 當 total 變化時，調整當前頁碼
watch(
  () => props.total,
  () => {
    const maxPage = Math.ceil(props.total / currentPageSize.value) || 1
    if (currentPage.value > maxPage) {
      handlePageChange(maxPage)
    }
  }
)
</script>

<style scoped>
.t-pagination {
  display: flex;
  align-items: center;
  gap: var(--t-spacing-4, 1rem);
  font-size: var(--t-font-size-sm, 0.875rem);
  user-select: none;
}

/* 簡單模式 */
.t-pagination--simple {
  gap: var(--t-spacing-2, 0.5rem);
}

/* 尺寸變化 */
.t-pagination--sm {
  font-size: var(--t-font-size-xs, 0.75rem);
  gap: var(--t-spacing-3, 0.75rem);
}

.t-pagination--lg {
  font-size: var(--t-font-size-base, 1rem);
  gap: var(--t-spacing-6, 1.5rem);
}

/* 總數顯示 */
.t-pagination__total {
  color: var(--t-semantic-text-secondary, #475569);
  white-space: nowrap;
}

/* 尺寸選擇器 */
.t-pagination__size-changer {
  display: flex;
  align-items: center;
  gap: var(--t-spacing-2, 0.5rem);
  color: var(--t-semantic-text-secondary, #475569);
  white-space: nowrap;
}

.t-pagination__size-select {
  padding: var(--t-spacing-1, 0.25rem) var(--t-spacing-2, 0.5rem);
  border: 1px solid var(--t-semantic-border-primary, #e2e8f0);
  border-radius: var(--t-radius-md, 0.375rem);
  background: var(--t-semantic-background-primary, #ffffff);
  color: var(--t-semantic-text-primary, #1e293b);
  font-size: inherit;
  cursor: pointer;
  transition: border-color 0.15s ease-in-out;
}

.t-pagination__size-select:focus {
  outline: none;
  border-color: var(--t-primary-500, #0ea5e9);
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

/* 導航 */
.t-pagination__nav {
  display: flex;
  align-items: center;
  gap: var(--t-spacing-1, 0.25rem);
}

.t-pagination__list {
  display: flex;
  align-items: center;
  gap: var(--t-spacing-1, 0.25rem);
  list-style: none;
  margin: 0;
  padding: 0;
}

.t-pagination__item {
  display: flex;
}

/* 按鈕樣式 */
.t-pagination__button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  height: 2rem;
  padding: 0 var(--t-spacing-2, 0.5rem);
  border: 1px solid var(--t-semantic-border-primary, #e2e8f0);
  border-radius: var(--t-radius-md, 0.375rem);
  background: var(--t-semantic-background-primary, #ffffff);
  color: var(--t-semantic-text-primary, #1e293b);
  font-size: inherit;
  font-weight: var(--t-font-weight-medium, 500);
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  text-decoration: none;
  user-select: none;
}

.t-pagination__button:hover:not(:disabled) {
  border-color: var(--t-primary-500, #0ea5e9);
  color: var(--t-primary-500, #0ea5e9);
}

.t-pagination__button:focus-visible {
  outline: 2px solid var(--t-primary-500, #0ea5e9);
  outline-offset: 2px;
}

.t-pagination__button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--t-semantic-background-secondary, #f8fafc);
  color: var(--t-semantic-text-tertiary, #64748b);
}

.t-pagination__button--active {
  border-color: var(--t-primary-500, #0ea5e9);
  background: var(--t-primary-500, #0ea5e9);
  color: var(--t-semantic-text-inverse, #ffffff);
}

.t-pagination__button--active:hover {
  border-color: var(--t-primary-600, #0284c7);
  background: var(--t-primary-600, #0284c7);
  color: var(--t-semantic-text-inverse, #ffffff);
}

.t-pagination__button--ellipsis {
  border: none;
  background: transparent;
  cursor: pointer;
}

.t-pagination__button--ellipsis:hover {
  background: var(--t-secondary-100, #f4f4f5);
  color: var(--t-primary-500, #0ea5e9);
}

.t-pagination__button--prev,
.t-pagination__button--next {
  gap: var(--t-spacing-1, 0.25rem);
  padding: 0 var(--t-spacing-3, 0.75rem);
}

/* 尺寸變化 */
.t-pagination--sm .t-pagination__button {
  min-width: 1.75rem;
  height: 1.75rem;
  padding: 0 var(--t-spacing-1-5, 0.375rem);
}

.t-pagination--lg .t-pagination__button {
  min-width: 2.5rem;
  height: 2.5rem;
  padding: 0 var(--t-spacing-3, 0.75rem);
}

/* 快速跳轉 */
.t-pagination__jumper {
  display: flex;
  align-items: center;
  gap: var(--t-spacing-2, 0.5rem);
  color: var(--t-semantic-text-secondary, #475569);
  white-space: nowrap;
}

.t-pagination__jumper-input {
  width: 3rem;
  padding: var(--t-spacing-1, 0.25rem) var(--t-spacing-2, 0.5rem);
  border: 1px solid var(--t-semantic-border-primary, #e2e8f0);
  border-radius: var(--t-radius-md, 0.375rem);
  background: var(--t-semantic-background-primary, #ffffff);
  color: var(--t-semantic-text-primary, #1e293b);
  font-size: inherit;
  text-align: center;
  transition: border-color 0.15s ease-in-out;
}

.t-pagination__jumper-input:focus {
  outline: none;
  border-color: var(--t-primary-500, #0ea5e9);
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

/* 禁用狀態 */
.t-pagination--disabled {
  opacity: 0.6;
  pointer-events: none;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .t-pagination {
    flex-wrap: wrap;
    gap: var(--t-spacing-2, 0.5rem);
  }
  
  .t-pagination__total {
    order: -1;
    width: 100%;
    text-align: center;
  }
  
  .t-pagination__size-changer {
    order: 1;
  }
  
  .t-pagination__nav {
    order: 0;
    flex: 1;
    justify-content: center;
  }
  
  .t-pagination__jumper {
    order: 1;
  }
  
  .t-pagination__button {
    min-width: 1.75rem;
    height: 1.75rem;
    padding: 0 var(--t-spacing-1-5, 0.375rem);
  }
  
  .t-pagination__button--prev,
  .t-pagination__button--next {
    padding: 0 var(--t-spacing-2, 0.5rem);
  }
}

/* 減少動畫模式 */
@media (prefers-reduced-motion: reduce) {
  .t-pagination__button {
    transition: none;
  }
}
</style>
