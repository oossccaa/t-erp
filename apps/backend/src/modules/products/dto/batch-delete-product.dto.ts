import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsInt, ArrayMinSize } from 'class-validator'

export class BatchDeleteProductDto {
  @ApiProperty({ description: '產品 ID 列表', example: [1, 2, 3] })
  @IsArray()
  @ArrayMinSize(1, { message: '至少需要選擇一個產品' })
  @IsInt({ each: true, message: '產品 ID 必須是整數' })
  ids: number[]
}
