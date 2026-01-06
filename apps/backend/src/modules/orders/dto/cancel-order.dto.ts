import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsBoolean, IsOptional, MaxLength } from 'class-validator'

export class CancelOrderDto {
  @ApiProperty({
    description: '取消原因',
    example: '供應商無法按時交貨',
    maxLength: 500,
  })
  @IsString({ message: '取消原因必須是字符串' })
  @MaxLength(500, { message: '取消原因長度不能超過 500 字符' })
  reason: string

  @ApiProperty({
    description: '是否調整庫存（進貨單：扣減已入庫數量；銷貨單：回補已出貨數量）',
    example: true,
    required: false,
    default: true,
  })
  @IsBoolean({ message: '調整庫存標記必須是布爾值' })
  @IsOptional()
  adjustInventory?: boolean = true
}
