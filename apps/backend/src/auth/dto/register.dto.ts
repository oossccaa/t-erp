import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class RegisterDto {
  @ApiProperty({ description: '用戶名', example: 'john_doe' })
  @IsString({ message: '用戶名必須是字符串' })
  @IsNotEmpty({ message: '用戶名不能為空' })
  @MinLength(3, { message: '用戶名至少需要3個字符' })
  username: string

  @ApiProperty({ description: '電子郵件', example: 'john@example.com' })
  @IsEmail({}, { message: '請輸入有效的電子郵件地址' })
  @IsNotEmpty({ message: '電子郵件不能為空' })
  email: string

  @ApiProperty({ description: '密碼', example: 'password123' })
  @IsString({ message: '密碼必須是字符串' })
  @IsNotEmpty({ message: '密碼不能為空' })
  @MinLength(6, { message: '密碼至少需要6個字符' })
  password: string
}