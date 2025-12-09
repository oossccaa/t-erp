import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { BaseEntity } from '../../../common/entities/base.entity'
import { User } from '../../users/entities/user.entity'
import { Supplier } from '../../suppliers/entities/supplier.entity'
import { PurchaseOrderItem } from './purchase-order-item.entity'

export enum PurchaseOrderStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  PROCESSING = 'processing',
  PARTIALLY_RECEIVED = 'partially_received',
  RECEIVED = 'received',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

@Entity('purchase_orders')
export class PurchaseOrder extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true, length: 50 })
  orderNumber: string

  @Column({ type: 'enum', enum: PurchaseOrderStatus, default: PurchaseOrderStatus.DRAFT })
  status: PurchaseOrderStatus

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.UNPAID })
  paymentStatus: PaymentStatus

  @Column('int')
  supplierId: number

  @ManyToOne(() => Supplier, { eager: true })
  @JoinColumn({ name: 'supplierId' })
  supplier: Supplier

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

  @Column({ length: 100, nullable: true })
  paymentTerms: string

  @Column({ length: 100, nullable: true })
  deliveryTerms: string

  @Column({ length: 50, nullable: true })
  referenceNumber: string

  @OneToMany(() => PurchaseOrderItem, item => item.purchaseOrder, { cascade: true })
  items: PurchaseOrderItem[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // 計算剩餘應付金額
  get remainingAmount(): number {
    return this.totalAmount - this.paidAmount
  }

  // 檢查是否可以取消
  get canCancel(): boolean {
    return [PurchaseOrderStatus.DRAFT, PurchaseOrderStatus.PENDING].includes(this.status)
  }

  // 檢查是否可以批准
  get canApprove(): boolean {
    return this.status === PurchaseOrderStatus.PENDING
  }

  // 檢查是否可以接收貨物
  get canReceive(): boolean {
    return [PurchaseOrderStatus.APPROVED, PurchaseOrderStatus.PROCESSING, PurchaseOrderStatus.PARTIALLY_RECEIVED].includes(this.status)
  }
}