import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from '../../../common/entities/base.entity'
import { ApprovalStep } from './approval-step.entity'
import { User } from '../../users/entities/user.entity'

@Entity('approval_step_users')
export class ApprovalStepUser extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column('int')
  stepId: number

  @ManyToOne(() => ApprovalStep, step => step.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stepId' })
  step: ApprovalStep

  @Column('int')
  userId: number

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User

  @Column('int', { default: 1 })
  userOrder: number

  @Column({ default: true })
  isActive: boolean
}