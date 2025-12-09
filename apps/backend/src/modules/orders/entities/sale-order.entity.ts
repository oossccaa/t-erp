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
    return [SaleOrderStatus.DRAFT, SaleOrderStatus.PENDING, SaleOrderStatus.CONFIRMED].includes(this.status)
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

