import { IsNotEmpty, IsOptional, IsString, IsEmail, MaxLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateCustomerDto {
  @ApiProperty({ description: '客戶名稱', example: '優質客戶 A 公司' })
  @IsString({ message: '客戶名稱必須是字符串' })
  @IsNotEmpty({ message: '客戶名稱不能為空' })
  @MaxLength(100, { message: '客戶名稱長度不能超過100字符' })
  name: string

  @ApiProperty({ description: '聯絡人', example: '王先生', required: false })
  @IsString({ message: '聯絡人必須是字符串' })
  @MaxLength(50, { message: '聯絡人長度不能超過50字符' })
  @IsOptional()
  contactPerson?: string

  @ApiProperty({ description: '聯絡電話', example: '03-1234-5678', required: false })
  @IsString({ message: '聯絡電話必須是字符串' })
  @MaxLength(20, { message: '聯絡電話長度不能超過20字符' })
  @IsOptional()
  phone?: string

  @ApiProperty({ description: '電子郵件', example: 'customer@company.com', required: false })
  @IsEmail({}, { message: '請輸入有效的電子郵件地址' })
  @IsOptional()
  email?: string

  @ApiProperty({ description: '地址', example: '桃園市桃園區復興路300號', required: false })
  @IsString({ message: '地址必須是字符串' })
  @IsOptional()
  address?: string
}