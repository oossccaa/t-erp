import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'

// 為什麼不寫 type:
//   - PostgreSQL: 'timestamp' 才對，'datetime' 不認
//   - better-sqlite3: 'datetime' 才對，'timestamp' 不認
//   - 留空讓 TypeORM 依 dialect 自動選（PG → timestamp、SQLite → datetime）
export abstract class BaseEntity {
  @ApiProperty({ description: '主鍵 ID' })
  @PrimaryGeneratedColumn()
  id: number

  @ApiProperty({ description: '創建時間' })
  @CreateDateColumn({ name: 'created_at', comment: '創建時間' })
  createdAt: Date

  @ApiProperty({ description: '更新時間' })
  @UpdateDateColumn({ name: 'updated_at', comment: '更新時間' })
  updatedAt: Date

  @ApiProperty({ description: '刪除時間（軟刪除）', required: false })
  @DeleteDateColumn({ name: 'deleted_at', nullable: true, comment: '刪除時間（軟刪除）' })
  deletedAt?: Date
}
