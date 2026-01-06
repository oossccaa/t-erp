import { IsNotEmpty, IsNumber, IsDateString, IsOptional, IsEnum, Min, Max, IsString } from 'class-validator'
import { Type } from 'class-transformer'
import { SaleOrderStatus } from '../entities/sale-order.entity'

/**
 * 月度銷售報表查詢 DTO
 */
export class MonthlySalesReportDto {
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
  @IsEnum(SaleOrderStatus, { message: '訂單狀態不合法' })
  status?: SaleOrderStatus
}

/**
 * 日期範圍銷售報表查詢 DTO
 */
export class DateRangeSalesReportDto {
  @IsNotEmpty({ message: '開始日期不能為空' })
  @IsDateString({}, { message: '開始日期格式不正確' })
  startDate: string

  @IsNotEmpty({ message: '結束日期不能為空' })
  @IsDateString({}, { message: '結束日期格式不正確' })
  endDate: string

  @IsOptional()
  @IsEnum(SaleOrderStatus, { message: '訂單狀態不合法' })
  status?: SaleOrderStatus

  @IsOptional()
  @IsString()
  groupBy?: 'day' | 'week' | 'month'
}

/**
 * 銷售報表響應介面
 */
export interface SalesReportResponse {
  period: {
    start: string
    end: string
    label: string
  }
  summary: {
    totalAmount: number       // 總銷售額
    totalOrders: number       // 總訂單數
    avgOrderValue: number     // 平均訂單金額
    completedOrders: number   // 已完成訂單數
    completedAmount: number   // 已完成訂單金額
  }
  trend: Array<{
    date: string              // 日期（YYYY-MM-DD）
    amount: number            // 當日銷售額
    orderCount: number        // 訂單數量
    avgAmount: number         // 平均金額
  }>
  statusBreakdown: Array<{
    status: SaleOrderStatus   // 訂單狀態
    count: number             // 訂單數量
    amount: number            // 金額
    percentage: number        // 佔比百分比
  }>
}
