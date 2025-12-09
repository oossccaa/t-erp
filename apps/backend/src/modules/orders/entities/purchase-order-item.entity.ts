import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from '../../../common/entities/base.entity'
import { PurchaseOrder } from './purchase-order.entity'
import { Product } from '../../products/entities/product.entity'

@Entity('purchase_order_items')
export class PurchaseOrderItem extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column('int')
  purchaseOrderId: number

  @ManyToOne(() => PurchaseOrder, order => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchaseOrderId' })
  purchaseOrder: PurchaseOrder

  @Column('int')
  productId: number

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'productId' })
  product: Product

  @Column({ length: 100, nullable: true })
  productName: string

  @Column({ length: 50, nullable: true })
  productSku: string

  @Column({ length: 50, nullable: true })
  unit: string

  @Column('int')
  quantity: number

  @Column('decimal', { precision: 15, scale: 2 })
  unitPrice: number

  @Column('decimal', { precision: 15, scale: 2 })
  totalPrice: number

  @Column('int', { default: 0 })
  receivedQuantity: number

  @Column('text', { nullable: true })
  notes: string

  @Column('int', { default: 1 })
  lineNumber: number

  // 計算剩餘待收數量
  get remainingQuantity(): number {
    return this.quantity - this.receivedQuantity
  }

  // 檢查是否完全接收
  get isFullyReceived(): boolean {
    return this.receivedQuantity >= this.quantity
  }

  // 計算接收進度百分比
  get receivedPercentage(): number {
    if (this.quantity === 0) return 0
    return Math.round((this.receivedQuantity / this.quantity) * 100)
  }
}