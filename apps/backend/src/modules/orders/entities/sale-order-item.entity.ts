import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from '../../../common/entities/base.entity'
import { SaleOrder } from './sale-order.entity'
import { Product } from '../../products/entities/product.entity'

@Entity('sale_order_items')
export class SaleOrderItem extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column('int')
  saleOrderId: number

  @ManyToOne(() => SaleOrder, order => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'saleOrderId' })
  saleOrder: SaleOrder

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
  shippedQuantity: number

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  discountRate: number

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  discountAmount: number

  @Column('text', { nullable: true })
  notes: string

  @Column('int', { default: 1 })
  lineNumber: number

  // 計算剩餘待出貨數量
  get remainingQuantity(): number {
    return this.quantity - this.shippedQuantity
  }

  // 檢查是否完全出貨
  get isFullyShipped(): boolean {
    return this.shippedQuantity >= this.quantity
  }

  // 計算出貨進度百分比
  get shippedPercentage(): number {
    if (this.quantity === 0) return 0
    return Math.round((this.shippedQuantity / this.quantity) * 100)
  }

  // 計算折扣後的單價
  get finalUnitPrice(): number {
    return this.unitPrice - this.discountAmount / this.quantity
  }
}