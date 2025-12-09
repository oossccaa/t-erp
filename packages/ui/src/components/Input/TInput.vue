<template>
  <div :class="wrapperClasses">
    <!-- 標籤 -->
    <label 
      v-if="label || $slots.label" 
      :for="inputId"
      :class="labelClasses"
    >
      <slot name="label">{{ label }}</slot>
      <span v-if="required" class="t-input__required">*</span>
    </label>
    
    <!-- 輸入框容器 -->
    <div :class="inputContainerClasses">
      <!-- 前置元素 -->
      <div v-if="$slots.prefix || prefixIcon" class="t-input__prefix">
        <slot name="prefix">
          <TIcon v-if="prefixIcon" :name="prefixIcon" />
        </slot>
      </div>
      
      <!-- 輸入框 -->
      <component
        :is="inputTag"
        :id="inputId"
        ref="inputRef"
        :class="inputClasses"
        :type="computedType"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :maxlength="maxlength"
        :minlength="minlength"
        :max="max"
        :min="min"
        :step="step"
        :rows="rows"
        :cols="cols"
        :autocomplete="autocomplete"
        :autofocus="autofocus"
        v-bind="$attrs"
        @input="handleInput"
        @change="handleChange"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
        @keyup="handleKeyup"
        @keypress="handleKeypress"
      />
      
      <!-- 後置元素 -->
      <div v-if="showSuffix" class="t-input__suffix">
        <slot name="suffix">
          <!-- 清除按鈕 -->
          <button
            v-if="showClear"
            type="button"
            class="t-input__clear"
            @click="handleClear"
          >
            <TIcon name="close" />
          </button>
          
          <!-- 密碼顯示切換 -->
          <button
            v-if="showPasswordToggle"
            type="button"
            class="t-input__password-toggle"
            @click="togglePasswordVisibility"
          >
            <TIcon :name="passwordVisible ? 'eye-off' : 'eye'" />
          </button>
          
          <!-- 後置圖示 -->
          <TIcon v-if="suffixIcon" :name="suffixIcon" />
        </slot>
      </div>
    </div>
    
    <!-- 輔助文字 -->
    <div v-if="showHelperText" :class="helperTextClasses">
      <slot name="helper-text">
        <span v-if="errorMessage" class="t-input__error-message">
          <TIcon name="alert-circle" class="t-input__error-icon" />
          {{ errorMessage }}
        </span>
        <span v-else-if="helperText">{{ helperText }}</span>
      </slot>
      
      <!-- 字數計數 -->
      <span v-if="showWordCount" class="t-input__word-count">
        {{ wordCount }}/{{ maxlength }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, useSlots } from 'vue'
import { nanoid } from 'nanoid'
import TIcon from '../Icon/TIcon.vue'

// 組件名稱
defineOptions({
  name: 'TInput',
  inheritAttrs: false,
})

// 屬性定義
export interface InputProps {
  // 雙向纁定
  modelValue?: string | number
  
  // 基本屬性
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search'
  placeholder?: string
  label?: string
  helperText?: string
  errorMessage?: string
  
  // 尺寸和樣式
  size?: 'sm' | 'md' | 'lg'
  variant?: 'outlined' | 'filled' | 'underlined'
  
  // 狀態
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  loading?: boolean
  
  // 驗證和格式化
  maxlength?: number
  minlength?: number
  max?: string | number
  min?: string | number
  step?: string | number
  pattern?: string
  
  // 多行文字
  multiline?: boolean
  rows?: number
  cols?: number
  autoResize?: boolean
  
  // 功能特性
  clearable?: boolean
  showPassword?: boolean
  showWordCount?: boolean
  
  // 圖示
  prefixIcon?: string
  suffixIcon?: string
  
  // HTML 屬性
  autocomplete?: string
  autofocus?: boolean
  
  // ID
  id?: string
}

const props = withDefaults(defineProps<InputProps>(), {
  type: 'text',
  size: 'md',
  variant: 'outlined',
  disabled: false,
  readonly: false,
  required: false,
  loading: false,
  multiline: false,
  rows: 3,
  autoResize: false,
  clearable: false,
  showPassword: false,
  showWordCount: false,
  autofocus: false,
})

// 事件定義
const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  input: [value: string | number, event: Event]
  change: [value: string | number, event: Event]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  clear: []
  keydown: [event: KeyboardEvent]
  keyup: [event: KeyboardEvent]
  keypress: [event: KeyboardEvent]
}>()

// Slots 定義
const slots = useSlots()

// 內部狀態
const inputRef = ref<HTMLInputElement | HTMLTextAreaElement>()
const isFocused = ref(false)
const passwordVisible = ref(false)
const inputId = computed(() => props.id || `t-input-${nanoid(6)}`)

// 計算屬性
const inputTag = computed(() => props.multiline ? 'textarea' : 'input')

const computedType = computed(() => {
  if (props.type === 'password' && props.showPassword) {
    return passwordVisible.value ? 'text' : 'password'
  }
  return props.type
})

const hasValue = computed(() => {
  const value = props.modelValue
  return value !== undefined && value !== null && value !== ''
})

const wordCount = computed(() => {
  const value = String(props.modelValue || '')
  return value.length
})

const showClear = computed(() => {
  return props.clearable && hasValue.value && !props.disabled && !props.readonly
})

const showPasswordToggle = computed(() => {
  return props.type === 'password' && props.showPassword && hasValue.value
})

const showSuffix = computed(() => {
  return props.suffixIcon || showClear.value || showPasswordToggle.value || slots.suffix
})

const showHelperText = computed(() => {
  return props.helperText || props.errorMessage || (props.showWordCount && props.maxlength) || slots['helper-text']
})

// 樣式類別
const wrapperClasses = computed(() => {
  const classes = [
    't-input-wrapper',
    `t-input-wrapper--${props.size}`,
    `t-input-wrapper--${props.variant}`,
  ]
  
  if (props.disabled) classes.push('t-input-wrapper--disabled')
  if (props.readonly) classes.push('t-input-wrapper--readonly')
  if (props.errorMessage) classes.push('t-input-wrapper--error')
  if (isFocused.value) classes.push('t-input-wrapper--focused')
  if (hasValue.value) classes.push('t-input-wrapper--has-value')
  if (props.loading) classes.push('t-input-wrapper--loading')
  
  return classes
})

const labelClasses = computed(() => {
  const classes = ['t-input__label']
  
  if (props.required) classes.push('t-input__label--required')
  if (props.errorMessage) classes.push('t-input__label--error')
  
  return classes
})

const inputContainerClasses = computed(() => {
  return ['t-input__container']
})

const inputClasses = computed(() => {
  return ['t-input__field']
})

const helperTextClasses = computed(() => {
  const classes = ['t-input__helper']
  
  if (props.errorMessage) classes.push('t-input__helper--error')
  
  return classes
})

// 事件處理
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement
  const value = props.type === 'number' ? Number(target.value) : target.value
  
  emit('update:modelValue', value)
  emit('input', value, event)
  
  // 自動調整高度
  if (props.multiline && props.autoResize) {
    nextTick(() => {
      autoResizeTextarea()
    })
  }
}

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement
  const value = props.type === 'number' ? Number(target.value) : target.value
  emit('change', value, event)
}

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false
  emit('blur', event)
}

const handleClear = () => {
  emit('update:modelValue', '')
  emit('clear')
  inputRef.value?.focus()
}

const handleKeydown = (event: KeyboardEvent) => {
  emit('keydown', event)
}

const handleKeyup = (event: KeyboardEvent) => {
  emit('keyup', event)
}

const handleKeypress = (event: KeyboardEvent) => {
  emit('keypress', event)
}

const togglePasswordVisibility = () => {
  passwordVisible.value = !passwordVisible.value
}

// 自動調整文字區域高度
const autoResizeTextarea = () => {
  const textarea = inputRef.value as HTMLTextAreaElement
  if (!textarea) return
  
  textarea.style.height = 'auto'
  textarea.style.height = `${textarea.scrollHeight}px`
}

// 公開方法
const focus = () => {
  inputRef.value?.focus()
}

const blur = () => {
  inputRef.value?.blur()
}

const select = () => {
  inputRef.value?.select()
}

// 暴露給父組件
defineExpose({
  focus,
  blur,
  select,
  inputRef,
})

// 監聽初始值變化
watch(
  () => props.modelValue,
  () => {
    if (props.multiline && props.autoResize) {
      nextTick(() => {
        autoResizeTextarea()
      })
    }
  },
  { immediate: true }
)
</script>

<style scoped>
/* 容器樣式 */
.t-input-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
}

/* 標籤樣式 */
.t-input__label {
  display: flex;
  align-items: center;
  font-size: var(--t-font-size-sm, 0.875rem);
  font-weight: var(--t-font-weight-medium, 500);
  color: var(--t-semantic-text-secondary, #475569);
  margin-bottom: var(--t-spacing-2, 0.5rem);
  user-select: none;
}

.t-input__required {
  color: var(--t-error-500, #ef4444);
  margin-left: var(--t-spacing-1, 0.25rem);
}

.t-input__label--error {
  color: var(--t-error-600, #dc2626);
}

/* 輸入框容器 */
.t-input__container {
  position: relative;
  display: flex;
  align-items: center;
  border-radius: var(--t-radius-md, 0.375rem);
  transition: all 0.2s ease-in-out;
}

/* Outlined 風格 */
.t-input-wrapper--outlined .t-input__container {
  border: 1px solid var(--t-semantic-border-primary, #e2e8f0);
  background-color: var(--t-semantic-background-primary, #ffffff);
}

.t-input-wrapper--outlined.t-input-wrapper--focused .t-input__container {
  border-color: var(--t-primary-500, #0ea5e9);
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.t-input-wrapper--outlined.t-input-wrapper--error .t-input__container {
  border-color: var(--t-error-500, #ef4444);
}

.t-input-wrapper--outlined.t-input-wrapper--error.t-input-wrapper--focused .t-input__container {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* Filled 風格 */
.t-input-wrapper--filled .t-input__container {
  border: 1px solid transparent;
  background-color: var(--t-secondary-100, #f4f4f5);
}

.t-input-wrapper--filled.t-input-wrapper--focused .t-input__container {
  background-color: var(--t-semantic-background-primary, #ffffff);
  border-color: var(--t-primary-500, #0ea5e9);
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

/* Underlined 風格 */
.t-input-wrapper--underlined .t-input__container {
  border: none;
  border-bottom: 2px solid var(--t-semantic-border-primary, #e2e8f0);
  border-radius: 0;
  background-color: transparent;
}

.t-input-wrapper--underlined.t-input-wrapper--focused .t-input__container {
  border-bottom-color: var(--t-primary-500, #0ea5e9);
}

/* 輸入框本體 */
.t-input__field {
  flex: 1;
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: var(--t-semantic-text-primary, #1e293b);
  font-size: var(--t-font-size-sm, 0.875rem);
  line-height: 1.5;
  
  /* 預設內間距 */
  padding: var(--t-spacing-3, 0.75rem);
}

.t-input__field::placeholder {
  color: var(--t-semantic-text-tertiary, #64748b);
}

.t-input__field:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* 尺寸變化 */
.t-input-wrapper--sm .t-input__field {
  padding: var(--t-spacing-2, 0.5rem) var(--t-spacing-3, 0.75rem);
  font-size: var(--t-font-size-xs, 0.75rem);
}

.t-input-wrapper--lg .t-input__field {
  padding: var(--t-spacing-4, 1rem);
  font-size: var(--t-font-size-base, 1rem);
}

/* 多行文字 */
.t-input__field[rows] {
  resize: vertical;
  min-height: auto;
}

/* 前置和後置元素 */
.t-input__prefix,
.t-input__suffix {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0 var(--t-spacing-2, 0.5rem);
  color: var(--t-semantic-text-tertiary, #64748b);
}

.t-input__prefix {
  border-right: 1px solid var(--t-semantic-border-primary, #e2e8f0);
}

.t-input__suffix {
  border-left: 1px solid var(--t-semantic-border-primary, #e2e8f0);
  gap: var(--t-spacing-1, 0.25rem);
}

/* 按鈕樣式 */
.t-input__clear,
.t-input__password-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--t-spacing-1, 0.25rem);
  border: none;
  background: transparent;
  color: var(--t-semantic-text-tertiary, #64748b);
  cursor: pointer;
  border-radius: var(--t-radius-sm, 0.25rem);
  transition: all 0.15s ease-in-out;
}

.t-input__clear:hover,
.t-input__password-toggle:hover {
  color: var(--t-semantic-text-secondary, #475569);
  background-color: var(--t-secondary-100, #f4f4f5);
}

/* 輔助文字 */
.t-input__helper {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-top: var(--t-spacing-1-5, 0.375rem);
  font-size: var(--t-font-size-xs, 0.75rem);
  color: var(--t-semantic-text-tertiary, #64748b);
}

.t-input__helper--error {
  color: var(--t-error-600, #dc2626);
}

.t-input__error-message {
  display: flex;
  align-items: center;
  gap: var(--t-spacing-1, 0.25rem);
}

.t-input__error-icon {
  flex-shrink: 0;
  width: 1em;
  height: 1em;
}

.t-input__word-count {
  flex-shrink: 0;
  margin-left: var(--t-spacing-2, 0.5rem);
}

/* 禁用狀態 */
.t-input-wrapper--disabled {
  opacity: 0.6;
  pointer-events: none;
}

.t-input-wrapper--disabled .t-input__container {
  background-color: var(--t-semantic-background-secondary, #f8fafc);
  cursor: not-allowed;
}

/* 唯讀狀態 */
.t-input-wrapper--readonly .t-input__field {
  cursor: default;
}

/* 減少動畫模式 */
@media (prefers-reduced-motion: reduce) {
  .t-input__container {
    transition: none;
  }
}
</style>
