import { Entity, Column } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import { BaseEntity } from '../../../common/entities/base.entity'

@Entity('customers')
export class Customer extends BaseEntity {
  @ApiProperty({ description: '客戶名稱' })
  @Column({ length: 100, comment: '客戶名稱' })
  name: string

  @ApiProperty({ description: '聯絡人', required: false })
  @Column({ name: 'contact_person', length: 50, nullable: true, comment: '聯絡人' })
  contactPerson?: string

  @ApiProperty({ description: '電話', required: false })
  @Column({ length: 20, nullable: true, comment: '電話' })
  phone?: string

  @ApiProperty({ description: '電子郵件', required: false })
  @Column({ length: 100, nullable: true, comment: '電子郵件' })
  email?: string

  @ApiProperty({ description: '地址', required: false })
  @Column({ type: 'text', nullable: true, comment: '地址' })
  address?: string

  @ApiProperty({ description: '是否啟用', default: true })
  @Column({ name: 'is_active', default: true, comment: '是否啟用' })
  isActive: boolean
}