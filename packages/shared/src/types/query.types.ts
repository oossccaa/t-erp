import type { PaginationQuery, SortConfig, SearchFilters } from './api.types'

// 基礎查詢接口
export interface BaseQuery extends PaginationQuery {
  filters?: SearchFilters
  sort?: SortConfig[]
  includes?: string[]
  excludes?: string[]
}

// 日期範圍查詢
export interface DateRangeQuery {
  startDate?: Date | string
  endDate?: Date | string
  dateField?: string
}

// 數值範圍查詢
export interface NumberRangeQuery {
  minValue?: number
  maxValue?: number
  field?: string
}

// 高級搜索查詢
export interface AdvancedQuery extends BaseQuery, DateRangeQuery {
  searchFields?: string[]
  searchMode?: 'exact' | 'contains' | 'starts_with' | 'ends_with'
  caseSensitive?: boolean
}

// 產品查詢擴展
export interface ProductAdvancedQuery extends AdvancedQuery {
  categoryIds?: number[]
  priceRange?: NumberRangeQuery
  stockRange?: NumberRangeQuery
  isActive?: boolean
  hasLowStock?: boolean
  hasImages?: boolean
  supplierIds?: number[]
}

// 訂單查詢擴展
export interface OrderAdvancedQuery extends AdvancedQuery, DateRangeQuery {
  orderTypes?: string[]
  statuses?: string[]
  paymentStatuses?: string[]
  customerIds?: number[]
  supplierIds?: number[]
  amountRange?: NumberRangeQuery
  itemCountRange?: NumberRangeQuery
}

// 庫存查詢擴展
export interface InventoryAdvancedQuery extends AdvancedQuery {
  productIds?: number[]
  categoryIds?: number[]
  warehouseIds?: number[]
  transactionTypes?: string[]
  quantityRange?: NumberRangeQuery
  valueRange?: NumberRangeQuery
  hasAlerts?: boolean
}

// 用戶查詢擴展
export interface UserAdvancedQuery extends AdvancedQuery {
  roles?: string[]
  isActive?: boolean
  departments?: string[]
  positions?: string[]
  lastLoginRange?: DateRangeQuery
}

// 聚合查詢
export interface AggregationQuery {
  groupBy: string[]
  aggregations: Array<{
    field: string
    operation: 'sum' | 'avg' | 'count' | 'min' | 'max'
    alias?: string
  }>
  having?: SearchFilters
}

// 報表查詢
export interface ReportQuery extends BaseQuery, DateRangeQuery {
  reportType: string
  groupBy?: string[]
  metrics?: string[]
  dimensions?: string[]
  aggregation?: AggregationQuery
}

// 導出查詢
export interface ExportQuery extends AdvancedQuery {
  format: 'csv' | 'excel' | 'pdf' | 'json'
  columns?: string[]
  includeHeaders?: boolean
  template?: string
}

// 批量操作查詢
export interface BulkOperationQuery {
  ids?: number[]
  query?: AdvancedQuery
  operation: string
  parameters?: Record<string, any>
  dryRun?: boolean
}

// 搜索建議查詢
export interface SearchSuggestionQuery {
  query: string
  field: string
  limit?: number
  filters?: SearchFilters
}

// 自動完成查詢
export interface AutocompleteQuery extends SearchSuggestionQuery {
  valueField: string
  labelField: string
  includeInactive?: boolean
}

// 查詢結果元數據
export interface QueryMetadata {
  executionTime: number
  totalCount: number
  filteredCount?: number
  cacheHit?: boolean
  warnings?: string[]
  suggestions?: string[]
}

// 查詢構建器配置
export interface QueryBuilderConfig {
  allowedFields: string[]
  allowedOperators: string[]
  defaultSort?: SortConfig
  maxLimit?: number
  allowAggregation?: boolean
  allowExport?: boolean
}