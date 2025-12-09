import type { BaseEntity, PaginationQuery } from './api.types'
import type { Product, Customer, Supplier } from './product.types'

// 時間範圍類型
export type TimeRange = 
  | 'today' 
  | 'yesterday' 
  | 'last_7_days' 
  | 'last_30_days' 
  | 'last_90_days' 
  | 'this_month' 
  | 'last_month' 
  | 'this_quarter' 
  | 'last_quarter' 
  | 'this_year' 
  | 'last_year' 
  | 'custom'

// 圖表類型
export type ChartType = 
  | 'line' 
  | 'bar' 
  | 'pie' 
  | 'doughnut' 
  | 'area' 
  | 'scatter' 
  | 'radar' 
  | 'gauge'

// 統計指標類型
export interface StatisticMetric {
  key: string
  label: string
  value: number
  previousValue?: number
  change?: number
  changePercent?: number
  trend?: 'up' | 'down' | 'stable'
  format?: 'number' | 'currency' | 'percentage'
}

// 儀表板統計
export interface DashboardStats {
  overview: {
    totalRevenue: StatisticMetric
    totalOrders: StatisticMetric
    totalProducts: StatisticMetric
    totalCustomers: StatisticMetric
  }
  sales: {
    dailySales: StatisticMetric
    monthlySales: StatisticMetric
    averageOrderValue: StatisticMetric
    conversionRate: StatisticMetric
  }
  inventory: {
    totalInventoryValue: StatisticMetric
    lowStockProducts: StatisticMetric
    outOfStockProducts: StatisticMetric
    inventoryTurnover: StatisticMetric
  }
  financial: {
    grossProfit: StatisticMetric
    grossMargin: StatisticMetric
    netProfit: StatisticMetric
    roi: StatisticMetric
  }
}

// 趨勢數據
export interface TrendData {
  period: string
  value: number
  previousValue?: number
  label?: string
  metadata?: Record<string, any>
}

// 圖表數據
export interface ChartData {
  type: ChartType
  title: string
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string
    borderWidth?: number
  }>
  options?: Record<string, any>
}

// 銷售分析
export interface SalesAnalytics {
  totalSales: number
  totalOrders: number
  averageOrderValue: number
  conversionRate: number
  topProducts: Array<{
    product: Product
    quantity: number
    revenue: number
    profit: number
  }>
  topCustomers: Array<{
    customer: Customer
    orderCount: number
    totalSpent: number
    averageOrder: number
  }>
  salesByPeriod: TrendData[]
  salesByCategory: Array<{
    categoryName: string
    quantity: number
    revenue: number
  }>
  salesByRegion?: Array<{
    region: string
    orderCount: number
    revenue: number
  }>
}

// 採購分析
export interface PurchaseAnalytics {
  totalPurchases: number
  totalPurchaseOrders: number
  averageOrderValue: number
  topSuppliers: Array<{
    supplier: Supplier
    orderCount: number
    totalAmount: number
    averageOrder: number
  }>
  topPurchasedProducts: Array<{
    product: Product
    quantity: number
    totalCost: number
  }>
  purchasesByPeriod: TrendData[]
  purchasesByCategory: Array<{
    categoryName: string
    quantity: number
    totalCost: number
  }>
}

// 庫存分析
export interface InventoryAnalytics {
  totalInventoryValue: number
  totalProducts: number
  inventoryTurnover: number
  slowMovingProducts: Array<{
    product: Product
    daysInStock: number
    quantity: number
    value: number
  }>
  fastMovingProducts: Array<{
    product: Product
    velocity: number
    quantity: number
    revenue: number
  }>
  lowStockAlerts: Array<{
    product: Product
    currentStock: number
    minStock: number
    stockoutRisk: number
  }>
  inventoryByCategory: Array<{
    categoryName: string
    productCount: number
    totalValue: number
    percentage: number
  }>
}

// 財務分析
export interface FinancialAnalytics {
  revenue: StatisticMetric
  costs: StatisticMetric
  grossProfit: StatisticMetric
  grossMargin: StatisticMetric
  netProfit: StatisticMetric
  netMargin: StatisticMetric
  roi: StatisticMetric
  revenueByPeriod: TrendData[]
  profitByPeriod: TrendData[]
  expensesByCategory: Array<{
    category: string
    amount: number
    percentage: number
  }>
  cashFlow: Array<{
    period: string
    inflow: number
    outflow: number
    netFlow: number
  }>
}

// 客戶分析
export interface CustomerAnalytics {
  totalCustomers: number
  activeCustomers: number
  newCustomers: number
  churnRate: number
  customerLifetimeValue: number
  averageOrderValue: number
  repeatPurchaseRate: number
  customersBySegment: Array<{
    segment: string
    count: number
    revenue: number
  }>
  customerGrowth: TrendData[]
  topCustomers: Array<{
    customer: Customer
    orders: number
    totalSpent: number
    lastOrder: Date
  }>
}

// 報表請求參數
export interface ReportRequest {
  reportType: string
  timeRange: TimeRange
  startDate?: Date
  endDate?: Date
  filters?: Record<string, any>
  groupBy?: string[]
  metrics?: string[]
  compareWithPrevious?: boolean
  format?: 'json' | 'csv' | 'excel' | 'pdf'
}

// 報表響應
export interface ReportResponse<T = any> {
  reportType: string
  title: string
  description?: string
  generatedAt: Date
  period: {
    start: Date
    end: Date
    label: string
  }
  data: T
  metadata: {
    totalRecords: number
    executionTime: number
    filters: Record<string, any>
  }
  charts?: ChartData[]
  summary?: StatisticMetric[]
}

// KPI 配置
export interface KPIConfig {
  id: string
  name: string
  description?: string
  calculation: string
  format: 'number' | 'currency' | 'percentage'
  target?: number
  threshold?: {
    good: number
    warning: number
    critical: number
  }
  isActive: boolean
}

// KPI 結果
export interface KPIResult {
  config: KPIConfig
  value: number
  previousValue?: number
  change?: number
  changePercent?: number
  trend?: 'up' | 'down' | 'stable'
  status?: 'good' | 'warning' | 'critical'
  calculatedAt: Date
}