import { IsNotEmpty, IsDateString, IsOptional, IsNumber, Min, IsString, IsEnum } from 'class-validator'
import { Type } from 'class-transformer'

/**
 * 庫存趨勢查詢 DTO
 */
export class InventoryTrendDto {
  @IsNotEmpty({ message: '開始日期不能為空' })
  @IsDateString({}, { message: '開始日期格式不正確' })
  startDate: string

  @IsNotEmpty({ message: '結束日期不能為空' })
  @IsDateString({}, { message: '結束日期格式不正確' })
  endDate: string
}

/**
 * 商品排行查詢 DTO
 */
export class TopProductsDto {
  @IsOptional()
  @IsNumber({}, { message: '數量必須為數字' })
  @Min(1, { message: '數量不能小於 1' })
  @Type(() => Number)
  limit?: number = 10

  @IsOptional()
  @IsEnum(['stockQuantity', 'stockValue', 'turnover'], { message: '排序方式不合法' })
  sortBy?: 'stockQuantity' | 'stockValue' | 'turnover' = 'stockQuantity'
}

/**
 * 庫存彙總響應介面
 */
export interface InventorySummaryResponse {
  totalProducts: number         // 總商品數
  totalStockQuantity: number    // 總庫存數量
  totalStockValue: number        // 總庫存價值
  lowStockCount: number          // 低庫存商品數量
  outOfStockCount: number        // 零庫存商品數量
}

/**
 * 庫存趨勢響應介面
 */
export interface InventoryTrendResponse {
  period: {
    start: string
    end: string
  }
  trend: Array<{
    date: string                 // 日期（YYYY-MM-DD）
    inboundQuantity: number      // 入庫數量
    outboundQuantity: number     // 出庫數量
    netChange: number            // 淨變化（入庫-出庫）
  }>
}

/**
 * 商品排行響應介面
 */
export interface TopProductsResponse {
  sortBy: string
  products: Array<{
    productId: number
    productName: string
    productSku: string
    stockQuantity: number        // 庫存數量
    stockValue: number           // 庫存價值
    unitCost: number             // 單位成本
  }>
}
