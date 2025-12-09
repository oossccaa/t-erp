import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { BaseEntity } from '../../../common/entities/base.entity'
import { ApprovalStep } from './approval-step.entity'

export enum ApprovalFlowType {
  PURCHASE_ORDER = 'purchase_order',
  SALE_ORDER = 'sale_order',
  INVENTORY_ADJUSTMENT = 'inventory_adjustment',
  EXPENSE_CLAIM = 'expense_claim',
  CUSTOM = 'custom',
}

@Entity('approval_flows')
export class ApprovalFlow extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ length: 100 })
  name: string

  @Column({ type: 'enum', enum: ApprovalFlowType })
  type: ApprovalFlowType

  @Column('text', { nullable: true })
  description: string

  @Column({ default: true })
  isActive: boolean

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  minAmount: number

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  maxAmount: number

  @Column('json', { nullable: true })
  conditions: Record<string, any>

  @OneToMany(() => ApprovalStep, step => step.flow, { cascade: true })
  steps: ApprovalStep[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // 檢查金額是否在範圍內
  isAmountInRange(amount: number): boolean {
    if (this.minAmount !== null && amount < this.minAmount) return false
    if (this.maxAmount !== null && amount > this.maxAmount) return false
    return true
  }

  // 檢查條件是否匹配
  matchesConditions(data: Record<string, any>): boolean {
    if (!this.conditions) return true
    
    for (const [key, value] of Object.entries(this.conditions)) {
      if (data[key] !== value) return false
    }
    return true
  }
}