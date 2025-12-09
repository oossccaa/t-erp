import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm'
import { BaseEntity } from '../../../common/entities/base.entity'
import { ApprovalInstance } from './approval-instance.entity'
import { ApprovalStep } from './approval-step.entity'
import { User } from '../../users/entities/user.entity'

export enum ApprovalAction {
  APPROVE = 'approve',
  REJECT = 'reject',
  DELEGATE = 'delegate',
  WITHDRAW = 'withdraw',
  TIMEOUT = 'timeout',
}

@Entity('approval_records')
export class ApprovalRecord extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column('int')
  instanceId: number

  @ManyToOne(() => ApprovalInstance, instance => instance.records, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'instanceId' })
  instance: ApprovalInstance

  @Column('int')
  stepId: number

  @ManyToOne(() => ApprovalStep, { eager: true })
  @JoinColumn({ name: 'stepId' })
  step: ApprovalStep

  @Column('int')
  stepOrder: number

  @Column('int')
  approverId: number

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'approverId' })
  approver: User

  @Column({ type: 'enum', enum: ApprovalAction })
  action: ApprovalAction

  @Column('text', { nullable: true })
  comments: string

  @Column('text', { nullable: true })
  reason: string

  @Column('int', { nullable: true })
  delegateToId: number

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'delegateToId' })
  delegateTo: User

  @Column('json', { nullable: true })
  attachments: string[]

  @CreateDateColumn()
  actionDate: Date

  // 檢查是否為批准操作
  get isApproved(): boolean {
    return this.action === ApprovalAction.APPROVE
  }

  // 檢查是否為拒絕操作
  get isRejected(): boolean {
    return this.action === ApprovalAction.REJECT
  }

  // 檢查是否為委派操作
  get isDelegated(): boolean {
    return this.action === ApprovalAction.DELEGATE
  }
}