import { 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  IsNumber, 
  Min, 
  MaxLength,
  Matches 
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'

export class CreateProductDto {
  @ApiProperty({ description: '商品編號 (SKU)', example: 'PROD001' })
  @IsString({ message: '商品編號必須是字符串' })
  @IsNotEmpty({ message: '商品編號不能為空' })
  @MaxLength(50, { message: '商品編號長度不能超過50字符' })
  @Matches(/^[A-Z0-9_-]+$/, { message: '商品編號只能包含大寫字母、數字、下劃線和連字符' })
  sku: string

  @ApiProperty({ description: '商品名稱', example: 'iPhone 15 Pro' })
  @IsString({ message: '商品名稱必須是字符串' })
  @IsNotEmpty({ message: '商品名稱不能為空' })
  @MaxLength(200, { message: '商品名稱長度不能超過200字符' })
  name: string

  @ApiProperty({ description: '商品描述', example: '蘋果最新旗艦手機', required: false })
  @IsString({ message: '商品描述必須是字符串' })
  @IsOptional()
  description?: string

  @ApiProperty({ description: '分類 ID', example: 1, required: false })
  @IsNumber({}, { message: '分類 ID 必須是數字' })
  @Min(1, { message: '分類 ID 必須大於 0' })
  @Type(() => Number)
  @IsOptional()
  categoryId?: number

  @ApiProperty({ description: '銷售單價', example: 35000 })
  @IsNumber({}, { message: '銷售單價必須是數字' })
  @Min(0, { message: '銷售單價不能為負數' })
  @Type(() => Number)
  unitPrice: number

  @ApiProperty({ description: '成本單價', example: 28000 })
  @IsNumber({}, { message: '成本單價必須是數字' })
  @Min(0, { message: '成本單價不能為負數' })
  @Type(() => Number)
  costPrice: number

  @ApiProperty({ description: '初始庫存數量', example: 50 })
  @IsNumber({}, { message: '庫存數量必須是數字' })
  @Min(0, { message: '庫存數量不能為負數' })
  @Type(() => Number)
  stockQuantity: number

  @ApiProperty({ description: '最低庫存警告', example: 10 })
  @IsNumber({}, { message: '最低庫存警告必須是數字' })
  @Min(0, { message: '最低庫存警告不能為負數' })
  @Type(() => Number)
  minStockLevel: number
}