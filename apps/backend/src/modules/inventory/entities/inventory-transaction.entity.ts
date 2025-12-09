import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm'
import { BaseEntity } from '../../../common/entities/base.entity'
import { Product } from '../../products/entities/product.entity'
import { User } from '../../users/entities/user.entity'

export enum InventoryTransactionType {
  // 入庫類型
  PURCHASE_RECEIVE = 'purchase_receive',        // 採購入庫
  MANUFACTURE_COMPLETE = 'manufacture_complete', // 生產完成入庫
  RETURN_RECEIVE = 'return_receive',             // 退貨入庫
  ADJUSTMENT_INCREASE = 'adjustment_increase',   // 盤點調增
  TRANSFER_IN = 'transfer_in',                   // 調撥入庫
  INITIAL_STOCK = 'initial_stock',               // 期初庫存
  OTHER_IN = 'other_in',                         // 其他入庫

  // 出庫類型
  SALE_SHIP = 'sale_ship',                       // 銷售出庫
  MANUFACTURE_CONSUME = 'manufacture_consume',   // 生產消耗出庫
  RETURN_SHIP = 'return_ship',                   // 退貨出庫
  ADJUSTMENT_DECREASE = 'adjustment_decrease',   // 盤點調減
  TRANSFER_OUT = 'transfer_out',                 // 調撥出庫
  DAMAGE_LOSS = 'damage_loss',                   // 損壞報廢
  EXPIRED_LOSS = 'expired_loss',                 // 過期報廢
  OTHER_OUT = 'other_out',                       // 其他出庫
}

@Entity('inventory_transactions')
export class InventoryTransaction extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column('int')
  productId: number

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'productId' })
  product: Product

  @Column({ type: 'enum', enum: InventoryTransactionType })
  type: InventoryTransactionType

  @Column('int')
  quantityBefore: number

  @Column('int')
  quantityChanged: number

  @Column('int')
  quantityAfter: number

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  unitCost: number

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  totalCost: number

  @Column({ length: 50, nullable: true })
  batchNumber: string

  @Column({ type: 'date', nullable: true })
  expiryDate: Date

  @Column({ length: 100, nullable: true })
  warehouse: string

  @Column({ length: 100, nullable: true })
  location: string

  @Column({ length: 50, nullable: true })
  referenceType: string

  @Column('int', { nullable: true })
  referenceId: number

  @Column({ length: 100, nullable: true })
  referenceNumber: string

  @Column('text', { nullable: true })
  reason: string

  @Column('text', { nullable: true })
  notes: string

  @Column('int', { nullable: true })
  createdById: number

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: User

  @CreateDateColumn()
  transactionDate: Date

  // 檢查是否為入庫操作
  get isInbound(): boolean {
    return [
      InventoryTransactionType.PURCHASE_RECEIVE,
      InventoryTransactionType.MANUFACTURE_COMPLETE,
      InventoryTransactionType.RETURN_RECEIVE,
      InventoryTransactionType.ADJUSTMENT_INCREASE,
      InventoryTransactionType.TRANSFER_IN,
      InventoryTransactionType.INITIAL_STOCK,
      InventoryTransactionType.OTHER_IN,
    ].includes(this.type)
  }

  // 檢查是否為出庫操作
  get isOutbound(): boolean {
    return [
      InventoryTransactionType.SALE_SHIP,
      InventoryTransactionType.MANUFACTURE_CONSUME,
      InventoryTransactionType.RETURN_SHIP,
      InventoryTransactionType.ADJUSTMENT_DECREASE,
      InventoryTransactionType.TRANSFER_OUT,
      InventoryTransactionType.DAMAGE_LOSS,
      InventoryTransactionType.EXPIRED_LOSS,
      InventoryTransactionType.OTHER_OUT,
    ].includes(this.type)
  }
}