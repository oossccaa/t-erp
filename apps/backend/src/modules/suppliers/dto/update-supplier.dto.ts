import { IsOptional, IsString, IsEmail, MaxLength, IsBoolean } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class UpdateSupplierDto {
  @ApiProperty({ description: '供應商名稱', example: 'ABC 電子科技有限公司', required: false })
  @IsString({ message: '供應商名稱必須是字符串' })
  @MaxLength(100, { message: '供應商名稱長度不能超過100字符' })
  @IsOptional()
  name?: string

  @ApiProperty({ description: '聯絡人', example: '張先生', required: false })
  @IsString({ message: '聯絡人必須是字符串' })
  @MaxLength(50, { message: '聯絡人長度不能超過50字符' })
  @IsOptional()
  contactPerson?: string

  @ApiProperty({ description: '聯絡電話', example: '02-1234-5678', required: false })
  @IsString({ message: '聯絡電話必須是字符串' })
  @MaxLength(20, { message: '聯絡電話長度不能超過20字符' })
  @IsOptional()
  phone?: string

  @ApiProperty({ description: '電子郵件', example: 'contact@abc.com', required: false })
  @IsEmail({}, { message: '請輸入有效的電子郵件地址' })
  @IsOptional()
  email?: string

  @ApiProperty({ description: '地址', example: '台北市信義區信義路100號', required: false })
  @IsString({ message: '地址必須是字符串' })
  @IsOptional()
  address?: string

  @ApiProperty({ description: '是否啟用', example: true, required: false })
  @IsBoolean({ message: '啟用狀態必須是布爾值' })
  @IsOptional()
  isActive?: boolean
}