import { IsNotEmpty, IsString, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class ChangePasswordDto {
  @ApiProperty({ description: '舊密碼', example: 'oldpassword123' })
  @IsString({ message: '舊密碼必須是字符串' })
  @IsNotEmpty({ message: '舊密碼不能為空' })
  oldPassword: string

  @ApiProperty({ description: '新密碼', example: 'newpassword123' })
  @IsString({ message: '新密碼必須是字符串' })
  @IsNotEmpty({ message: '新密碼不能為空' })
  @MinLength(6, { message: '新密碼至少需要6個字符' })
  newPassword: string
}