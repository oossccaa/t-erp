import { IsEmail, IsEnum, IsOptional, IsString, IsBoolean, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { UserRole } from '../entities/user.entity'

export class UpdateUserDto {
  @ApiProperty({ description: '用戶名', example: 'john_doe', required: false })
  @IsString({ message: '用戶名必須是字符串' })
  @IsOptional()
  @MinLength(3, { message: '用戶名至少需要3個字符' })
  username?: string

  @ApiProperty({ description: '電子郵件', example: 'john@example.com', required: false })
  @IsEmail({}, { message: '請輸入有效的電子郵件地址' })
  @IsOptional()
  email?: string

  @ApiProperty({ 
    description: '用戶角色', 
    enum: UserRole, 
    example: UserRole.USER,
    required: false 
  })
  @IsEnum(UserRole, { message: '無效的用戶角色' })
  @IsOptional()
  role?: UserRole

  @ApiProperty({ description: '是否啟用', example: true, required: false })
  @IsBoolean({ message: '啟用狀態必須是布爾值' })
  @IsOptional()
  isActive?: boolean
}