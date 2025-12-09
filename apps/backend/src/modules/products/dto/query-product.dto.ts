import { IsOptional, IsString, IsNumber, Min, IsBoolean } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Type, Transform } from 'class-transformer'

export class QueryProductDto {
  @ApiProperty({ description: '頁數', example: 1, required: false })
  @IsNumber({}, { message: '頁數必須是數字' })
  @Min(1, { message: '頁數必須大於 0' })
  @Type(() => Number)
  @IsOptional()
  page?: number = 1

  @ApiProperty({ description: '每頁數量', example: 10, required: false })
  @IsNumber({}, { message: '每頁數量必須是數字' })
  @Min(1, { message: '每頁數量必須大於 0' })
  @Type(() => Number)
  @IsOptional()
  limit?: number = 10

  @ApiProperty({ description: '搜索關鍵詞 (商品名稱或 SKU)', required: false })
  @IsString({ message: '搜索關鍵詞必須是字符串' })
  @IsOptional()
  search?: string

  @ApiProperty({ description: '分類 ID', required: false })
  @IsNumber({}, { message: '分類 ID 必須是數字' })
  @Min(1, { message: '分類 ID 必須大於 0' })
  @Type(() => Number)
  @IsOptional()
  categoryId?: number

  @ApiProperty({ description: '是否啟用', required: false })
  @IsBoolean({ message: '啟用狀態必須是布爾值' })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  isActive?: boolean

  @ApiProperty({ description: '是否顯示低庫存商品', required: false })
  @IsBoolean({ message: '低庫存篩選必須是布爾值' })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  lowStock?: boolean

  @ApiProperty({ description: '排序字段', example: 'createdAt', required: false })
  @IsString({ message: '排序字段必須是字符串' })
  @IsOptional()
  sortBy?: string = 'createdAt'

  @ApiProperty({ description: '排序順序', example: 'DESC', required: false })
  @IsString({ message: '排序順序必須是字符串' })
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC'
}