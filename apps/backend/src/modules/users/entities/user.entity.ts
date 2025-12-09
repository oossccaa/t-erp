import { Entity, Column, Index } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import { Exclude } from 'class-transformer'
import { BaseEntity } from '../../../common/entities/base.entity'

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
}

@Entity('users')
export class User extends BaseEntity {
  @ApiProperty({ description: '用戶名', uniqueItems: true })
  @Column({ unique: true, length: 50, comment: '用戶名' })
  @Index('UK_users_username', { unique: true })
  username: string

  @ApiProperty({ description: '電子郵件', uniqueItems: true })
  @Column({ unique: true, length: 100, comment: '電子郵件' })
  @Index('UK_users_email', { unique: true })
  email: string

  @Exclude()
  @Column({ comment: '密碼' })
  password: string

  @ApiProperty({ description: '用戶角色', enum: UserRole })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
    comment: '用戶角色',
  })
  role: UserRole

  @ApiProperty({ description: '是否啟用', default: true })
  @Column({ name: 'is_active', default: true, comment: '是否啟用' })
  isActive: boolean
}