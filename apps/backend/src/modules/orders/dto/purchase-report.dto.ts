import { IsNotEmpty, IsNumber, IsDateString, IsOptional, IsEnum, Min, Max, IsString } from 'class-validator'
import { Type } from 'class-transformer'
import { PurchaseOrderStatus } from '../entities/purchase-order.entity'

/**
 * 月度採購報表查詢 DTO
 */
export class MonthlyPurchaseReportDto {
  @IsNotEmpty({ message: '年份不能為空' })
  @IsNumber({}, { message: '年份必須為數字' })
  @Min(2000, { message: '年份不能小於 2000' })
  @Max(2100, { message: '年份不能大於 2100' })
  @Type(() => Number)
  year: number

  @IsNotEmpty({ message: '月份不能為空' })
  @IsNumber({}, { message: '月份必須為數字' })
  @Min(1, { message: '月份不能小於 1' })
  @Max(12, { message: '月份不能大於 12' })
  @Type(() => Number)
  month: number

  @IsOptional()
  @IsEnum(PurchaseOrderStatus, { message: '訂單狀態不合法' })
  status?: PurchaseOrderStatus
}

/**
 * 日期範圍採購報表查詢 DTO
 */
export class DateRangePurchaseReportDto {
  @IsNotEmpty({ message: '開始日期不能為空' })
  @IsDateString({}, { message: '開始日期格式不正確' })
  startDate: string

  @IsNotEmpty({ message: '結束日期不能為空' })
  @IsDateString({}, { message: '結束日期格式不正確' })
  endDate: string

  @IsOptional()
  @IsEnum(PurchaseOrderStatus, { message: '訂單狀態不合法' })
  status?: PurchaseOrderStatus

  @IsOptional()
  @IsString()
  groupBy?: 'day' | 'week' | 'month'
}

/**
 * 採購報表響應介面
 */
export interface PurchaseReportResponse {
  period: {
    start: string
    end: string
    label: string
  }
  summary: {
    totalAmount: number       // 總採購額
    totalOrders: number       // 總訂單數
    avgOrderValue: number     // 平均訂單金額
    completedOrders: number   // 已完成訂單數
    completedAmount: number   // 已完成訂單金額
  }
  trend: Array<{
    date: string              // 日期（YYYY-MM-DD）
    amount: number            // 當日採購額
    orderCount: number        // 訂單數量
    avgAmount: number         // 平均金額
  }>
  statusBreakdown: Array<{
    status: PurchaseOrderStatus   // 訂單狀態
    count: number                 // 訂單數量
    amount: number                // 金額
    percentage: number            // 佔比百分比
  }>
}
