import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm'
import { BaseEntity } from '../../../common/entities/base.entity'
import { ApprovalFlow } from './approval-flow.entity'
import { ApprovalStepUser } from './approval-step-user.entity'

export enum ApprovalStepType {
  SINGLE = 'single',      // 單人審批（任一人審批即可）
  ALL = 'all',           // 所有人審批（需要所有人都審批）
  MAJORITY = 'majority', // 多數審批（超過一半人審批即可）
  SEQUENTIAL = 'sequential', // 順序審批（按順序逐一審批）
}

@Entity('approval_steps')
export class ApprovalStep extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column('int')
  flowId: number

  @ManyToOne(() => ApprovalFlow, flow => flow.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'flowId' })
  flow: ApprovalFlow

  @Column({ length: 100 })
  name: string

  @Column('text', { nullable: true })
  description: string

  @Column('int')
  stepOrder: number

  @Column({ type: 'enum', enum: ApprovalStepType, default: ApprovalStepType.SINGLE })
  type: ApprovalStepType

  @Column({ default: false })
  isOptional: boolean

  @Column('int', { nullable: true })
  timeoutHours: number

  @Column('json', { nullable: true })
  conditions: Record<string, any>

  @OneToMany(() => ApprovalStepUser, stepUser => stepUser.step, { cascade: true })
  users: ApprovalStepUser[]

  // 檢查條件是否匹配
  matchesConditions(data: Record<string, any>): boolean {
    if (!this.conditions) return true
    
    for (const [key, value] of Object.entries(this.conditions)) {
      if (data[key] !== value) return false
    }
    return true
  }
}