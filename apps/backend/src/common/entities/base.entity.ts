import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'

export abstract class BaseEntity {
  @ApiProperty({ description: '主鍵 ID' })
  @PrimaryGeneratedColumn()
  id: number

  @ApiProperty({ description: '創建時間' })
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    comment: '創建時間',
  })
  createdAt: Date

  @ApiProperty({ description: '更新時間' })
  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    comment: '更新時間',
  })
  updatedAt: Date

  @ApiProperty({ description: '刪除時間（軟刪除）', required: false })
  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp',
    nullable: true,
    comment: '刪除時間（軟刪除）',
  })
  deletedAt?: Date
}