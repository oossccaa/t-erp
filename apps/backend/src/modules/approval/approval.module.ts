import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ApprovalFlow } from './entities/approval-flow.entity'
import { ApprovalStep } from './entities/approval-step.entity'
import { ApprovalStepUser } from './entities/approval-step-user.entity'
import { ApprovalInstance } from './entities/approval-instance.entity'
import { ApprovalRecord } from './entities/approval-record.entity'
import { ApprovalController } from './approval.controller'
import { ApprovalService } from './approval.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApprovalFlow,
      ApprovalStep,
      ApprovalStepUser,
      ApprovalInstance,
      ApprovalRecord,
    ])
  ],
  controllers: [ApprovalController],
  providers: [ApprovalService],
  exports: [ApprovalService],
})
export class ApprovalModule {}