import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsOptional, MaxLength } from 'class-validator'

export class RevertOrderDto {
  @ApiProperty({
    description: '退回原因（選填）',
    example: '需要修改訂單內容',
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString({ message: '退回原因必須是字符串' })
  @MaxLength(500, { message: '退回原因長度不能超過 500 字符' })
  reason?: string
}
