import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { BaseEntity } from '../../../common/entities/base.entity'
import { User } from '../../users/entities/user.entity'
import { InventoryAdjustmentItem } from './inventory-adjustment-item.entity'

export enum InventoryAdjustmentStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum InventoryAdjustmentType {
  STOCKTAKE = 'stocktake',          // 盤點調整
  DAMAGE = 'damage',                // 損壞調整
  EXPIRED = 'expired',              // 過期調整
  LOST = 'lost',                    // 遺失調整
  FOUND = 'found',                  // 發現調整
  QUALITY = 'quality',              // 品質調整
  OTHER = 'other',                  // 其他調整
}

@Entity('inventory_adjustments')
export class InventoryAdjustment extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true, length: 50 })
  adjustmentNumber: string

  @Column({ type: 'enum', enum: InventoryAdjustmentType })
  type: InventoryAdjustmentType

  @Column({ type: 'enum', enum: InventoryAdjustmentStatus, default: InventoryAdjustmentStatus.DRAFT })
  status: InventoryAdjustmentStatus

  @Column({ type: 'date' })
  adjustmentDate: Date

  @Column('int')
  createdById: number

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: User

  @Column('int', { nullable: true })
  approvedById: number

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approvedById' })
  approvedBy: User

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date

  @Column({ length: 100, nullable: true })
  warehouse: string

  @Column('text', { nullable: true })
  reason: string

  @Column('text', { nullable: true })
  notes: string

  @OneToMany(() => InventoryAdjustmentItem, item => item.adjustment, { cascade: true })
  items: InventoryAdjustmentItem[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // 計算調整總數量
  get totalAdjustmentQuantity(): number {
    if (!this.items) return 0
    return this.items.reduce((sum, item) => sum + item.adjustmentQuantity, 0)
  }

  // 計算調整總價值
  get totalAdjustmentValue(): number {
    if (!this.items) return 0
    return this.items.reduce((sum, item) => sum + (item.adjustmentQuantity * (item.unitCost || 0)), 0)
  }

  // 檢查是否可以審批
  get canApprove(): boolean {
    return this.status === InventoryAdjustmentStatus.PENDING
  }

  // 檢查是否可以取消
  get canCancel(): boolean {
    return [InventoryAdjustmentStatus.DRAFT, InventoryAdjustmentStatus.PENDING].includes(this.status)
  }
}