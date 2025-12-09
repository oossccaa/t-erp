import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from '../../../common/entities/base.entity'
import { InventoryAdjustment } from './inventory-adjustment.entity'
import { Product } from '../../products/entities/product.entity'

@Entity('inventory_adjustment_items')
export class InventoryAdjustmentItem extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column('int')
  adjustmentId: number

  @ManyToOne(() => InventoryAdjustment, adjustment => adjustment.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'adjustmentId' })
  adjustment: InventoryAdjustment

  @Column('int')
  productId: number

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'productId' })
  product: Product

  @Column({ length: 100, nullable: true })
  productName: string

  @Column({ length: 50, nullable: true })
  productSku: string

  @Column('int')
  systemQuantity: number

  @Column('int')
  actualQuantity: number

  @Column('int')
  adjustmentQuantity: number

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  unitCost: number

  @Column({ length: 50, nullable: true })
  batchNumber: string

  @Column({ type: 'date', nullable: true })
  expiryDate: Date

  @Column({ length: 100, nullable: true })
  location: string

  @Column('text', { nullable: true })
  reason: string

  @Column('text', { nullable: true })
  notes: string

  // 檢查是否為增加調整
  get isIncrease(): boolean {
    return this.adjustmentQuantity > 0
  }

  // 檢查是否為減少調整
  get isDecrease(): boolean {
    return this.adjustmentQuantity < 0
  }

  // 計算差異百分比
  get variancePercentage(): number {
    if (this.systemQuantity === 0) return this.actualQuantity > 0 ? 100 : 0
    return Math.round((this.adjustmentQuantity / this.systemQuantity) * 100)
  }
}