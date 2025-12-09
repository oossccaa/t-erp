export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: {
    code: string
    message: string
    details?: any[]
  }
  timestamp?: string
  path?: string
}

export interface PaginationQuery {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  search?: string
}

export interface PaginationResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface BaseEntity {
  id: number
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
}

export interface TreeNode<T = any> {
  id: number
  label: string
  children?: TreeNode<T>[]
  data?: T
  expanded?: boolean
  selected?: boolean
}

export interface SearchFilters {
  [key: string]: string | number | boolean | Date | null | undefined
}

export interface SortConfig {
  field: string
  order: 'ASC' | 'DESC'
}

export interface TableColumn {
  key: string
  title: string
  dataIndex: string
  width?: number
  sortable?: boolean
  filterable?: boolean
  render?: (value: any, record: any) => any
}