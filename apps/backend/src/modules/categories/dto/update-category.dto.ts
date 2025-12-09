import { IsOptional, IsString, IsNumber, Min } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'

export class UpdateCategoryDto {
  @ApiProperty({ description: '分類名稱', example: '電子產品', required: false })
  @IsString({ message: '分類名稱必須是字符串' })
  @IsOptional()
  name?: string

  @ApiProperty({ description: '分類描述', example: '電子設備和配件', required: false })
  @IsString({ message: '分類描述必須是字符串' })
  @IsOptional()
  description?: string

  @ApiProperty({ description: '父分類 ID', example: 1, required: false })
  @IsNumber({}, { message: '父分類 ID 必須是數字' })
  @Min(1, { message: '父分類 ID 必須大於 0' })
  @Type(() => Number)
  @IsOptional()
  parentId?: number
}