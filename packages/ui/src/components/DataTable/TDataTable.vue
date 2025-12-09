<template>
  <div class="t-data-table" :class="tableClasses">
    <!-- 表格工具欄 -->
    <div v-if="showToolbar" class="t-data-table__toolbar">
      <div class="t-data-table__toolbar-left">
        <slot name="toolbar-left">
          <h3 v-if="title" class="t-data-table__title">{{ title }}</h3>
        </slot>
      </div>
      
      <div class="t-data-table__toolbar-right">
        <slot name="toolbar-right">
          <!-- 搜尋框 -->
          <TInput
            v-if="searchable"
            v-model="searchQuery"
            :placeholder="searchPlaceholder"
            prefix-icon="search"
            clearable
            class="t-data-table__search"
          />
          
          <!-- 篩選器 -->
          <TButton
            v-if="filterable"
            variant="outline"
            prefix-icon="filter"
            @click="toggleFilters"
          >
            篩選
          </TButton>
          
          <!-- 列設定 -->
          <TButton
            v-if="columnsConfigurable"
            variant="outline"
            prefix-icon="settings"
            @click="toggleColumnConfig"
          >
            列設定
          </TButton>
        </slot>
      </div>
    </div>
    
    <!-- 篩選器面板 -->
    <div v-if="showFilters" class="t-data-table__filters">
      <slot name="filters" :filters="filters" :update-filter="updateFilter">
        <div class="t-data-table__filter-grid">
          <div
            v-for="column in filterableColumns"
            :key="column.key"
            class="t-data-table__filter-item"
          >
            <label class="t-data-table__filter-label">{{ column.label }}</label>
            <TInput
              :model-value="filters[column.key]"
              :placeholder="`搜尋 ${column.label}`"
              size="sm"
              clearable
              @update:model-value="updateFilter(column.key, $event)"
            />
          </div>
        </div>
        
        <div class="t-data-table__filter-actions">
          <TButton size="sm" @click="clearFilters">清除</TButton>
          <TButton size="sm" variant="primary" @click="applyFilters">應用</TButton>
        </div>
      </slot>
    </div>
    
    <!-- 表格容器 -->
    <div class="t-data-table__container" :style="containerStyles">
      <table class="t-data-table__table">
        <!-- 表頭 -->
        <thead class="t-data-table__thead">
          <tr class="t-data-table__row t-data-table__row--header">
            <!-- 選擇欄 -->
            <th v-if="selectable" class="t-data-table__th t-data-table__th--selection">
              <input
                type="checkbox"
                :checked="isAllSelected"
                :indeterminate="isIndeterminate"
                @change="toggleSelectAll"
                class="t-data-table__checkbox"
              />
            </th>
            
            <!-- 序號欄 -->
            <th v-if="showIndex" class="t-data-table__th t-data-table__th--index">
              #
            </th>
            
            <!-- 數據欄 -->
            <th
              v-for="column in visibleColumns"
              :key="column.key"
              :class="getColumnClasses(column, 'th')"
              :style="getColumnStyles(column)"
              @click="handleSort(column)"
            >
              <div class="t-data-table__th-content">
                <span class="t-data-table__th-text">{{ column.label }}</span>
                
                <!-- 排序指示器 -->
                <span v-if="column.sortable" class="t-data-table__sort-indicator">
                  <TIcon
                    :name="getSortIcon(column.key)"
                    :class="getSortIconClass(column.key)"
                  />
                </span>
              </div>
            </th>
            
            <!-- 操作欄 -->
            <th v-if="$slots.actions" class="t-data-table__th t-data-table__th--actions">
              操作
            </th>
          </tr>
        </thead>
        
        <!-- 表身 -->
        <tbody class="t-data-table__tbody">
          <!-- 空狀態 -->
          <tr v-if="paginatedData.length === 0" class="t-data-table__row t-data-table__row--empty">
            <td :colspan="totalColumns" class="t-data-table__td t-data-table__empty">
              <slot name="empty">
                <div class="t-data-table__empty-content">
                  <TIcon name="inbox" class="t-data-table__empty-icon" />
                  <p class="t-data-table__empty-text">{{ emptyText }}</p>
                </div>
              </slot>
            </td>
          </tr>
          
          <!-- 數據列 -->
          <tr
            v-for="(row, index) in paginatedData"
            :key="getRowKey(row, index)"
            :class="getRowClasses(row, index)"
            @click="handleRowClick(row, index)"
          >
            <!-- 選擇欄 -->
            <td v-if="selectable" class="t-data-table__td t-data-table__td--selection">
              <input
                type="checkbox"
                :checked="isRowSelected(row)"
                @change="toggleRowSelection(row)"
                class="t-data-table__checkbox"
              />
            </td>
            
            <!-- 序號欄 -->
            <td v-if="showIndex" class="t-data-table__td t-data-table__td--index">
              {{ getRowIndex(index) }}
            </td>
            
            <!-- 數據欄 -->
            <td
              v-for="column in visibleColumns"
              :key="column.key"
              :class="getColumnClasses(column, 'td')"
              :style="getColumnStyles(column)"
            >
              <slot
                :name="`cell-${column.key}`"
                :row="row"
                :column="column"
                :value="getCellValue(row, column.key)"
                :index="index"
              >
                <component
                  v-if="column.component"
                  :is="column.component"
                  :value="getCellValue(row, column.key)"
                  :row="row"
                  :column="column"
                />
                <span v-else :class="getCellTextClass(column)">
                  {{ formatCellValue(getCellValue(row, column.key), column) }}
                </span>
              </slot>
            </td>
            
            <!-- 操作欄 -->
            <td v-if="$slots.actions" class="t-data-table__td t-data-table__td--actions">
              <slot name="actions" :row="row" :index="index" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- 分頁 -->
    <div v-if="pageable && filteredData.length > 0" class="t-data-table__pagination">
      <TPagination
        v-model:current="currentPage"
        v-model:page-size="pageSize"
        :total="filteredData.length"
        :show-size-changer="showSizeChanger"
        :show-quick-jumper="showQuickJumper"
        :show-total="showTotal"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, useSlots } from 'vue'
import TInput from '../Input/TInput.vue'
import TButton from '../Button/TButton.vue'
import TIcon from '../Icon/TIcon.vue'
import TPagination from '../Pagination/TPagination.vue'

// 組件名稱
defineOptions({
  name: 'TDataTable',
})

// 列定義
export interface TableColumn {
  key: string
  label: string
  width?: string | number
  minWidth?: string | number
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  filterable?: boolean
  fixed?: 'left' | 'right'
  resizable?: boolean
  ellipsis?: boolean
  component?: any
  formatter?: (value: any, row: any) => string
  className?: string
}

// 屬性定義
export interface DataTableProps {
  // 数據
  data: any[]
  columns: TableColumn[]
  rowKey?: string | ((row: any) => string)
  
  // 外觀
  title?: string
  height?: string | number
  maxHeight?: string | number
  stripe?: boolean
  border?: boolean
  size?: 'sm' | 'md' | 'lg'
  
  // 功能
  loading?: boolean
  selectable?: boolean
  showIndex?: boolean
  
  // 搜尋
  searchable?: boolean
  searchPlaceholder?: string
  searchFields?: string[]
  
  // 篩選
  filterable?: boolean
  
  // 排序
  defaultSort?: { key: string; order: 'asc' | 'desc' }
  
  // 分頁
  pageable?: boolean
  pageSize?: number
  showSizeChanger?: boolean
  showQuickJumper?: boolean
  showTotal?: boolean
  
  // 其他
  emptyText?: string
  showToolbar?: boolean
  columnsConfigurable?: boolean
}

const props = withDefaults(defineProps<DataTableProps>(), {
  rowKey: 'id',
  stripe: false,
  border: true,
  size: 'md',
  loading: false,
  selectable: false,
  showIndex: false,
  searchable: true,
  searchPlaceholder: '請輸入關鍵字搜尋',
  filterable: true,
  pageable: true,
  pageSize: 10,
  showSizeChanger: true,
  showQuickJumper: false,
  showTotal: true,
  emptyText: '暂無數據',
  showToolbar: true,
  columnsConfigurable: false,
})

// 事件定義
const emit = defineEmits<{
  'selection-change': [selection: any[]]
  'row-click': [row: any, index: number]
  'sort-change': [sort: { key: string; order: 'asc' | 'desc' | null }]
}>()

// Slots 定義
const slots = useSlots()

// 內部狀態
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(props.pageSize)
const selectedRows = ref<any[]>([])
const sortState = ref<{ key: string; order: 'asc' | 'desc' | null }>(
  props.defaultSort ? { key: props.defaultSort.key, order: props.defaultSort.order } : { key: '', order: null }
)
const showFilters = ref(false)
const filters = ref<Record<string, any>>({})
const visibleColumnKeys = ref<string[]>(props.columns.map(col => col.key))

// 計算屬性
const tableClasses = computed(() => {
  const classes = [`t-data-table--${props.size}`]
  
  if (props.stripe) classes.push('t-data-table--stripe')
  if (props.border) classes.push('t-data-table--border')
  if (props.loading) classes.push('t-data-table--loading')
  
  return classes
})

const visibleColumns = computed(() => {
  return props.columns.filter(col => visibleColumnKeys.value.includes(col.key))
})

const filterableColumns = computed(() => {
  return visibleColumns.value.filter(col => col.filterable !== false)
})

const totalColumns = computed(() => {
  let count = visibleColumns.value.length
  if (props.selectable) count++
  if (props.showIndex) count++
  if (slots.actions) count++
  return count
})

const containerStyles = computed(() => {
  const styles: Record<string, string> = {}
  
  if (props.height) {
    styles.height = typeof props.height === 'number' ? `${props.height}px` : props.height
  }
  
  if (props.maxHeight) {
    styles.maxHeight = typeof props.maxHeight === 'number' ? `${props.maxHeight}px` : props.maxHeight
  }
  
  return styles
})

// 数據處理
const filteredData = computed(() => {
  let result = [...props.data]
  
  // 搜尋過濾
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(row => {
      const searchFields = props.searchFields || visibleColumns.value.map(col => col.key)
      return searchFields.some(field => {
        const value = getCellValue(row, field)
        return String(value).toLowerCase().includes(query)
      })
    })
  }
  
  // 列篩選過濾
  Object.entries(filters.value).forEach(([key, value]) => {
    if (value && value !== '') {
      result = result.filter(row => {
        const cellValue = getCellValue(row, key)
        return String(cellValue).toLowerCase().includes(String(value).toLowerCase())
      })
    }
  })
  
  // 排序
  if (sortState.value.key && sortState.value.order) {
    result.sort((a, b) => {
      const aVal = getCellValue(a, sortState.value.key)
      const bVal = getCellValue(b, sortState.value.key)
      
      let comparison = 0
      if (aVal < bVal) comparison = -1
      if (aVal > bVal) comparison = 1
      
      return sortState.value.order === 'desc' ? -comparison : comparison
    })
  }
  
  return result
})

const paginatedData = computed(() => {
  if (!props.pageable) return filteredData.value
  
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredData.value.slice(start, end)
})

// 選擇狀態
const isAllSelected = computed(() => {
  return paginatedData.value.length > 0 && selectedRows.value.length === paginatedData.value.length
})

const isIndeterminate = computed(() => {
  return selectedRows.value.length > 0 && selectedRows.value.length < paginatedData.value.length
})

// 方法
const getRowKey = (row: any, index: number): string => {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(row)
  }
  return row[props.rowKey] || index.toString()
}

const getCellValue = (row: any, key: string): any => {
  return key.split('.').reduce((obj, k) => obj?.[k], row) ?? ''
}

const formatCellValue = (value: any, column: TableColumn): string => {
  if (column.formatter) {
    return column.formatter(value, {})
  }
  return String(value ?? '')
}

const getRowIndex = (index: number): number => {
  return (currentPage.value - 1) * pageSize.value + index + 1
}

const getColumnClasses = (column: TableColumn, type: 'th' | 'td'): string[] => {
  const classes = [`t-data-table__${type}`, `t-data-table__${type}--${column.key}`]
  
  if (column.align) classes.push(`t-data-table__${type}--${column.align}`)
  if (column.fixed) classes.push(`t-data-table__${type}--fixed-${column.fixed}`)
  if (column.ellipsis) classes.push(`t-data-table__${type}--ellipsis`)
  if (column.sortable && type === 'th') classes.push('t-data-table__th--sortable')
  if (column.className) classes.push(column.className)
  
  return classes
}

const getColumnStyles = (column: TableColumn): Record<string, string> => {
  const styles: Record<string, string> = {}
  
  if (column.width) {
    styles.width = typeof column.width === 'number' ? `${column.width}px` : column.width
  }
  
  if (column.minWidth) {
    styles.minWidth = typeof column.minWidth === 'number' ? `${column.minWidth}px` : column.minWidth
  }
  
  return styles
}

const getRowClasses = (row: any, index: number): string[] => {
  const classes = ['t-data-table__row', 't-data-table__row--data']
  
  if (isRowSelected(row)) classes.push('t-data-table__row--selected')
  if (index % 2 === 1 && props.stripe) classes.push('t-data-table__row--stripe')
  
  return classes
}

const getCellTextClass = (column: TableColumn): string[] => {
  const classes = ['t-data-table__cell-text']
  if (column.ellipsis) classes.push('t-data-table__cell-text--ellipsis')
  return classes
}

const getSortIcon = (key: string): string => {
  if (sortState.value.key !== key) return 'unfold-more'
  return sortState.value.order === 'asc' ? 'expand-less' : 'expand-more'
}

const getSortIconClass = (key: string): string[] => {
  const classes = ['t-data-table__sort-icon']
  if (sortState.value.key === key) classes.push('t-data-table__sort-icon--active')
  return classes
}

const isRowSelected = (row: any): boolean => {
  const key = getRowKey(row, -1)
  return selectedRows.value.some(selected => getRowKey(selected, -1) === key)
}

// 事件處理
const handleSort = (column: TableColumn) => {
  if (!column.sortable) return
  
  if (sortState.value.key === column.key) {
    // 切換排序方向：asc -> desc -> null
    if (sortState.value.order === 'asc') {
      sortState.value.order = 'desc'
    } else if (sortState.value.order === 'desc') {
      sortState.value.order = null
      sortState.value.key = ''
    }
  } else {
    sortState.value.key = column.key
    sortState.value.order = 'asc'
  }
  
  emit('sort-change', { ...sortState.value })
}

const handleRowClick = (row: any, index: number) => {
  emit('row-click', row, index)
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedRows.value = []
  } else {
    selectedRows.value = [...paginatedData.value]
  }
  emit('selection-change', selectedRows.value)
}

const toggleRowSelection = (row: any) => {
  const key = getRowKey(row, -1)
  const index = selectedRows.value.findIndex(selected => getRowKey(selected, -1) === key)
  
  if (index > -1) {
    selectedRows.value.splice(index, 1)
  } else {
    selectedRows.value.push(row)
  }
  
  emit('selection-change', selectedRows.value)
}

const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

const updateFilter = (key: string, value: any) => {
  filters.value[key] = value
}

const clearFilters = () => {
  filters.value = {}
  currentPage.value = 1
}

const applyFilters = () => {
  currentPage.value = 1
  showFilters.value = false
}

const toggleColumnConfig = () => {
  // 實現列設定功能
}

// 監聽數據變化
watch(
  () => props.data,
  () => {
    currentPage.value = 1
  }
)

watch(
  [searchQuery, filters],
  () => {
    currentPage.value = 1
  },
  { deep: true }
)
</script>

<style scoped>
.t-data-table {
  position: relative;
  background: var(--t-semantic-background-primary, #ffffff);
  border-radius: var(--t-radius-lg, 0.5rem);
  overflow: hidden;
}

/* 工具欄 */
.t-data-table__toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--t-spacing-4, 1rem);
  border-bottom: 1px solid var(--t-semantic-border-primary, #e2e8f0);
  background: var(--t-semantic-background-secondary, #f8fafc);
}

.t-data-table__toolbar-left {
  display: flex;
  align-items: center;
}

.t-data-table__toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--t-spacing-3, 0.75rem);
}

.t-data-table__title {
  font-size: var(--t-font-size-lg, 1.125rem);
  font-weight: var(--t-font-weight-semibold, 600);
  color: var(--t-semantic-text-primary, #1e293b);
  margin: 0;
}

.t-data-table__search {
  width: 240px;
}

/* 篩選器 */
.t-data-table__filters {
  padding: var(--t-spacing-4, 1rem);
  border-bottom: 1px solid var(--t-semantic-border-primary, #e2e8f0);
  background: var(--t-semantic-background-tertiary, #f1f5f9);
}

.t-data-table__filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--t-spacing-4, 1rem);
  margin-bottom: var(--t-spacing-4, 1rem);
}

.t-data-table__filter-item {
  display: flex;
  flex-direction: column;
  gap: var(--t-spacing-2, 0.5rem);
}

.t-data-table__filter-label {
  font-size: var(--t-font-size-sm, 0.875rem);
  font-weight: var(--t-font-weight-medium, 500);
  color: var(--t-semantic-text-secondary, #475569);
}

.t-data-table__filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--t-spacing-2, 0.5rem);
}

/* 表格容器 */
.t-data-table__container {
  overflow: auto;
  border: 1px solid var(--t-semantic-border-primary, #e2e8f0);
}

.t-data-table--border .t-data-table__container {
  border: 1px solid var(--t-semantic-border-secondary, #cbd5e1);
}

.t-data-table__table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: var(--t-font-size-sm, 0.875rem);
}

/* 表頭 */
.t-data-table__thead {
  background: var(--t-semantic-background-secondary, #f8fafc);
  position: sticky;
  top: 0;
  z-index: 10;
}

.t-data-table__th {
  padding: var(--t-spacing-3, 0.75rem) var(--t-spacing-4, 1rem);
  text-align: left;
  font-weight: var(--t-font-weight-semibold, 600);
  color: var(--t-semantic-text-primary, #1e293b);
  border-bottom: 1px solid var(--t-semantic-border-primary, #e2e8f0);
  white-space: nowrap;
  user-select: none;
}

.t-data-table__th--center {
  text-align: center;
}

.t-data-table__th--right {
  text-align: right;
}

.t-data-table__th--sortable {
  cursor: pointer;
  transition: all 0.15s ease-in-out;
}

.t-data-table__th--sortable:hover {
  background-color: var(--t-secondary-100, #f4f4f5);
}

.t-data-table__th--selection,
.t-data-table__th--index,
.t-data-table__th--actions {
  width: 1%;
  text-align: center;
}

.t-data-table__th-content {
  display: flex;
  align-items: center;
  gap: var(--t-spacing-2, 0.5rem);
}

.t-data-table__th-text {
  flex: 1;
}

.t-data-table__sort-indicator {
  display: flex;
  align-items: center;
  opacity: 0.5;
  transition: opacity 0.15s ease-in-out;
}

.t-data-table__sort-icon--active {
  opacity: 1;
  color: var(--t-primary-500, #0ea5e9);
}

/* 表身 */
.t-data-table__tbody {
  background: var(--t-semantic-background-primary, #ffffff);
}

.t-data-table__td {
  padding: var(--t-spacing-3, 0.75rem) var(--t-spacing-4, 1rem);
  border-bottom: 1px solid var(--t-semantic-border-primary, #e2e8f0);
  color: var(--t-semantic-text-primary, #1e293b);
  vertical-align: middle;
}

.t-data-table__td--center {
  text-align: center;
}

.t-data-table__td--right {
  text-align: right;
}

.t-data-table__td--selection,
.t-data-table__td--index,
.t-data-table__td--actions {
  text-align: center;
  width: 1%;
}

.t-data-table__cell-text--ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 0;
}

/* 行樣式 */
.t-data-table__row {
  transition: background-color 0.15s ease-in-out;
}

.t-data-table__row--data:hover {
  background-color: var(--t-semantic-background-secondary, #f8fafc);
}

.t-data-table__row--selected {
  background-color: var(--t-primary-50, #f0f9ff);
}

.t-data-table--stripe .t-data-table__row--stripe {
  background-color: var(--t-semantic-background-tertiary, #f1f5f9);
}

/* 空狀態 */
.t-data-table__empty {
  text-align: center;
  padding: var(--t-spacing-12, 3rem) var(--t-spacing-4, 1rem);
}

.t-data-table__empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--t-spacing-3, 0.75rem);
}

.t-data-table__empty-icon {
  width: 3rem;
  height: 3rem;
  color: var(--t-semantic-text-tertiary, #64748b);
  opacity: 0.5;
}

.t-data-table__empty-text {
  color: var(--t-semantic-text-tertiary, #64748b);
  font-size: var(--t-font-size-sm, 0.875rem);
  margin: 0;
}

/* 分頁 */
.t-data-table__pagination {
  padding: var(--t-spacing-4, 1rem);
  border-top: 1px solid var(--t-semantic-border-primary, #e2e8f0);
  background: var(--t-semantic-background-secondary, #f8fafc);
  display: flex;
  justify-content: flex-end;
}

/* 尺寸變化 */
.t-data-table--sm .t-data-table__th,
.t-data-table--sm .t-data-table__td {
  padding: var(--t-spacing-2, 0.5rem) var(--t-spacing-3, 0.75rem);
  font-size: var(--t-font-size-xs, 0.75rem);
}

.t-data-table--lg .t-data-table__th,
.t-data-table--lg .t-data-table__td {
  padding: var(--t-spacing-4, 1rem) var(--t-spacing-6, 1.5rem);
  font-size: var(--t-font-size-base, 1rem);
}

/* 選擇框 */
.t-data-table__checkbox {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .t-data-table__toolbar {
    flex-direction: column;
    gap: var(--t-spacing-3, 0.75rem);
    align-items: stretch;
  }
  
  .t-data-table__toolbar-right {
    justify-content: flex-end;
  }
  
  .t-data-table__search {
    width: 100%;
  }
  
  .t-data-table__filter-grid {
    grid-template-columns: 1fr;
  }
  
  .t-data-table__th,
  .t-data-table__td {
    padding: var(--t-spacing-2, 0.5rem);
    font-size: var(--t-font-size-xs, 0.75rem);
  }
}
</style>
