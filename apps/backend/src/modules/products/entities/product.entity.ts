import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import { BaseEntity } from '../../../common/entities/base.entity'
import { Category } from '../../categories/entities/category.entity'

@Entity('products')
export class Product extends BaseEntity {
  @ApiProperty({ description: '商品編號', uniqueItems: true })
  @Column({ unique: true, length: 50, comment: '商品編號' })
  @Index('UK_products_sku', { unique: true })
  sku: string

  @ApiProperty({ description: '商品名稱' })
  @Column({ length: 200, comment: '商品名稱' })
  name: string

  @ApiProperty({ description: '商品描述', required: false })
  @Column({ type: 'text', nullable: true, comment: '商品描述' })
  description?: string

  @ApiProperty({ description: '分類 ID', required: false })
  @Column({ name: 'category_id', nullable: true, comment: '分類 ID' })
  categoryId?: number

  @ApiProperty({ description: '商品分類', required: false })
  @ManyToOne(() => Category, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category?: Category

  @ApiProperty({ description: '銷售單價', example: 100.00 })
  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.00,
    comment: '銷售單價',
  })
  unitPrice: number

  @ApiProperty({ description: '成本單價', example: 80.00 })
  @Column({
    name: 'cost_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.00,
    comment: '成本單價',
  })
  costPrice: number

  @ApiProperty({ description: '單位成本', example: 75.00 })
  @Column({
    name: 'unit_cost',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.00,
    comment: '單位成本',
  })
  unitCost: number

  @ApiProperty({ description: '計量單位', example: '個', default: '個' })
  @Column({ length: 10, default: '個', comment: '計量單位' })
  unit: string

  @ApiProperty({ description: '庫存數量', example: 100 })
  @Column({ name: 'stock_quantity', default: 0, comment: '庫存數量' })
  stockQuantity: number

  @ApiProperty({ description: '最低庫存警告', example: 10 })
  @Column({ name: 'min_stock_level', default: 0, comment: '最低庫存警告' })
  minStockLevel: number

  @ApiProperty({ description: '是否啟用', default: true })
  @Column({ name: 'is_active', default: true, comment: '是否啟用' })
  isActive: boolean
}