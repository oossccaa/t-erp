import { IsString, IsNotEmpty, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class LoginDto {
  @ApiProperty({ description: '用戶名', example: 'admin' })
  @IsString()
  @IsNotEmpty({ message: '用戶名不能為空' })
  username: string

  @ApiProperty({ description: '密碼', example: 'admin123' })
  @IsString()
  @IsNotEmpty({ message: '密碼不能為空' })
  @MinLength(6, { message: '密碼至少需要6個字符' })
  password: string
}