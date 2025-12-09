import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { BaseEntity } from '../../../common/entities/base.entity'
import { ApprovalFlow } from './approval-flow.entity'
import { User } from '../../users/entities/user.entity'
import { ApprovalRecord } from './approval-record.entity'

export enum ApprovalStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout',
}

@Entity('approval_instances')
export class ApprovalInstance extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column('int')
  flowId: number

  @ManyToOne(() => ApprovalFlow, { eager: true })
  @JoinColumn({ name: 'flowId' })
  flow: ApprovalFlow

  @Column({ length: 50 })
  documentType: string

  @Column('int')
  documentId: number

  @Column({ length: 100, nullable: true })
  documentNumber: string

  @Column({ length: 200, nullable: true })
  title: string

  @Column('text', { nullable: true })
  description: string

  @Column({ type: 'enum', enum: ApprovalStatus, default: ApprovalStatus.PENDING })
  status: ApprovalStatus

  @Column('int')
  currentStepOrder: number

  @Column('int')
  submittedById: number

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'submittedById' })
  submittedBy: User

  @Column({ type: 'timestamp' })
  submittedAt: Date

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  amount: number

  @Column('json', { nullable: true })
  documentData: Record<string, any>

  @Column('text', { nullable: true })
  notes: string

  @OneToMany(() => ApprovalRecord, record => record.instance, { cascade: true })
  records: ApprovalRecord[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // 檢查是否已完成
  get isCompleted(): boolean {
    return [ApprovalStatus.APPROVED, ApprovalStatus.REJECTED, ApprovalStatus.CANCELLED].includes(this.status)
  }

  // 檢查是否可以取消
  get canCancel(): boolean {
    return [ApprovalStatus.PENDING, ApprovalStatus.IN_PROGRESS].includes(this.status)
  }

  // 檢查是否超時
  get isTimeout(): boolean {
    return this.status === ApprovalStatus.TIMEOUT
  }
}