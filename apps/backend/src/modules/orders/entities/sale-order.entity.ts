import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { BaseEntity } from '../../../common/entities/base.entity'
import { User } from '../../users/entities/user.entity'
import { Customer } from '../../customers/entities/customer.entity'
import { SaleOrderItem } from './sale-order-item.entity'

export enum SaleOrderStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  PARTIALLY_SHIPPED = 'partially_shipped',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
}

export enum ShippingStatus {
  NOT_SHIPPED = 'not_shipped',
  PARTIALLY_SHIPPED = 'partially_shipped',
  SHIPPED = 'shipped',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  FAILED_DELIVERY = 'failed_delivery',
}

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

@Entity('sale_orders')
export class SaleOrder extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true, length: 50 })
  orderNumber: string

  @Column({ type: 'enum', enum: SaleOrderStatus, default: SaleOrderStatus.DRAFT })
  status: SaleOrderStatus

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.UNPAID })
  paymentStatus: PaymentStatus

  @Column({ type: 'enum', enum: ShippingStatus, default: ShippingStatus.NOT_SHIPPED })
  shippingStatus: ShippingStatus

  @Column('int')
  customerId: number

  @ManyToOne(() => Customer, { eager: true })
  @JoinColumn({ name: 'customerId' })
  customer: Customer

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

  @Column({ type: 'date' })
  orderDate: Date

  @Column({ type: 'date', nullable: true })
  expectedShippingDate: Date

  @Column({ type: 'date', nullable: true })
  actualShippingDate: Date

  @Column({ type: 'date', nullable: true })
  expectedDeliveryDate: Date

  @Column({ type: 'date', nullable: true })
  actualDeliveryDate: Date

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  subtotal: number

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  taxAmount: number

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  taxRate: number

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  discountAmount: number

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  discountRate: number

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  shippingCost: number

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalAmount: number

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  paidAmount: number

  @Column('text', { nullable: true })
  notes: string

  @Column({ length: 500, nullable: true })
  shippingAddress: string

  @Column({ length: 500, nullable: true })
  billingAddress: string

  @Column({ length: 100, nullable: true })
  paymentMethod: string

  @Column({ length: 100, nullable: true })
  shippingMethod: string

  @Column({ length: 100, nullable: true })
  trackingNumber: string

  @Column({ length: 50, nullable: true })
  referenceNumber: string

  @Column({ length: 500, nullable: true })
  cancelReason: string

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date

  @Column('int', { nullable: true })
  cancelledById: number

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'cancelledById' })
  cancelledBy: User

  @Column({ type: 'json', nullable: true })
  statusHistory: Array<{
    fromStatus: string
    toStatus: string
    reason?: string
    operatedAt: Date
    operatedById: number
    operatedByName: string
    inventoryAction?: 'none' | 'restore' | 'deduct'
  }>

  @OneToMany(() => SaleOrderItem, item => item.saleOrder, { cascade: true })
  items: SaleOrderItem[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // 計算剩餘應收金額
  get remainingAmount(): number {
    return this.totalAmount - this.paidAmount
  }

  // 檢查是否可以取消
  get canCancel(): boolean {
    // 只有已完成、已取消、已退貨的訂單不能再取消
    return ![
      SaleOrderStatus.COMPLETED,
      SaleOrderStatus.CANCELLED,
      SaleOrderStatus.RETURNED
    ].includes(this.status)
  }

  // 檢查是否可以退回
  get canRevert(): boolean {
    return [
      SaleOrderStatus.PENDING,
      SaleOrderStatus.CONFIRMED,
      SaleOrderStatus.PROCESSING
    ].includes(this.status)
  }

  // 獲取退回目標狀態
  get revertToStatus(): SaleOrderStatus | null {
    const statusMap: Partial<Record<SaleOrderStatus, SaleOrderStatus>> = {
      [SaleOrderStatus.PENDING]: SaleOrderStatus.DRAFT,
      [SaleOrderStatus.CONFIRMED]: SaleOrderStatus.PENDING,
      [SaleOrderStatus.PROCESSING]: SaleOrderStatus.CONFIRMED,
    }
    return statusMap[this.status] || null
  }

  // 檢查是否可以確認
  get canConfirm(): boolean {
    return this.status === SaleOrderStatus.PENDING
  }

  // 檢查是否可以出貨
  get canShip(): boolean {
    return [SaleOrderStatus.CONFIRMED, SaleOrderStatus.PROCESSING, SaleOrderStatus.PARTIALLY_SHIPPED].includes(this.status)
  }

  // 檢查是否可以完成
  get canComplete(): boolean {
    return this.status === SaleOrderStatus.DELIVERED && this.paymentStatus === PaymentStatus.PAID
  }
}

