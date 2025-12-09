import { 
  IsOptional, 
  IsString, 
  IsNumber, 
  Min, 
  MaxLength,
  IsBoolean 
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'

export class UpdateProductDto {
  @ApiProperty({ description: '商品名稱', example: 'iPhone 15 Pro', required: false })
  @IsString({ message: '商品名稱必須是字符串' })
  @MaxLength(200, { message: '商品名稱長度不能超過200字符' })
  @IsOptional()
  name?: string

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

  @ApiProperty({ description: '銷售單價', example: 35000, required: false })
  @IsNumber({}, { message: '銷售單價必須是數字' })
  @Min(0, { message: '銷售單價不能為負數' })
  @Type(() => Number)
  @IsOptional()
  unitPrice?: number

  @ApiProperty({ description: '成本單價', example: 28000, required: false })
  @IsNumber({}, { message: '成本單價必須是數字' })
  @Min(0, { message: '成本單價不能為負數' })
  @Type(() => Number)
  @IsOptional()
  costPrice?: number

  @ApiProperty({ description: '最低庫存警告', example: 10, required: false })
  @IsNumber({}, { message: '最低庫存警告必須是數字' })
  @Min(0, { message: '最低庫存警告不能為負數' })
  @Type(() => Number)
  @IsOptional()
  minStockLevel?: number

  @ApiProperty({ description: '是否啟用', example: true, required: false })
  @IsBoolean({ message: '啟用狀態必須是布爾值' })
  @IsOptional()
  isActive?: boolean
}