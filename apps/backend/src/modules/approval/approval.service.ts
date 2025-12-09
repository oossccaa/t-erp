import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ApprovalFlow, ApprovalFlowType } from './entities/approval-flow.entity'
import { ApprovalStep, ApprovalStepType } from './entities/approval-step.entity'
import { ApprovalInstance, ApprovalStatus } from './entities/approval-instance.entity'
import { ApprovalRecord, ApprovalAction } from './entities/approval-record.entity'

interface CreateApprovalRequest {
  documentType: string
  documentId: number
  documentNumber?: string
  title?: string
  description?: string
  amount?: number
  documentData?: Record<string, any>
  submittedById: number
  notes?: string
}

interface ApprovalActionRequest {
  action: ApprovalAction
  comments?: string
  reason?: string
  delegateToId?: number
  attachments?: string[]
}

@Injectable()
export class ApprovalService {
  constructor(
    @InjectRepository(ApprovalFlow)
    private flowRepository: Repository<ApprovalFlow>,
    @InjectRepository(ApprovalStep)
    private stepRepository: Repository<ApprovalStep>,
    @InjectRepository(ApprovalInstance)
    private instanceRepository: Repository<ApprovalInstance>,
    @InjectRepository(ApprovalRecord)
    private recordRepository: Repository<ApprovalRecord>,
  ) {}

  // 創建審批實例
  async createApprovalInstance(request: CreateApprovalRequest): Promise<ApprovalInstance> {
    // 找到適合的審批流程
    const flow = await this.findMatchingFlow(request)
    if (!flow) {
      throw new NotFoundException('未找到匹配的審批流程')
    }

    // 創建審批實例
    const instance = this.instanceRepository.create({
      ...request,
      flowId: flow.id,
      currentStepOrder: 1,
      submittedAt: new Date(),
      status: ApprovalStatus.PENDING,
    })

    const savedInstance = await this.instanceRepository.save(instance)

    // 開始審批流程
    await this.startApprovalProcess(savedInstance.id)

    return this.instanceRepository.findOne({
      where: { id: savedInstance.id },
      relations: ['flow', 'submittedBy', 'records', 'records.approver', 'records.step']
    })
  }

  // 處理審批操作
  async processApproval(instanceId: number, userId: number, request: ApprovalActionRequest): Promise<ApprovalInstance> {
    const instance = await this.instanceRepository.findOne({
      where: { id: instanceId },
      relations: ['flow', 'flow.steps', 'flow.steps.users', 'records', 'records.approver']
    })

    if (!instance) {
      throw new NotFoundException('審批實例不存在')
    }

    if (instance.isCompleted) {
      throw new BadRequestException('審批已完成，無法進行操作')
    }

    // 檢查用戶是否有權限進行此操作
    const canApprove = await this.canUserApprove(instance, userId)
    if (!canApprove) {
      throw new BadRequestException('您沒有權限進行此審批操作')
    }

    // 創建審批記錄
    const currentStep = instance.flow.steps.find(s => s.stepOrder === instance.currentStepOrder)
    const record = this.recordRepository.create({
      instanceId: instance.id,
      stepId: currentStep.id,
      stepOrder: instance.currentStepOrder,
      approverId: userId,
      ...request,
      actionDate: new Date(),
    })

    await this.recordRepository.save(record)

    // 處理審批結果
    if (request.action === ApprovalAction.REJECT) {
      await this.instanceRepository.update(instanceId, {
        status: ApprovalStatus.REJECTED,
        completedAt: new Date(),
      })
    } else if (request.action === ApprovalAction.APPROVE) {
      await this.processApprovalStep(instance, currentStep)
    }

    return this.instanceRepository.findOne({
      where: { id: instanceId },
      relations: ['flow', 'submittedBy', 'records', 'records.approver', 'records.step']
    })
  }

  // 獲取待審批列表
  async getPendingApprovals(userId: number, query?: {
    documentType?: string
    page?: number
    limit?: number
  }) {
    const queryBuilder = this.instanceRepository
      .createQueryBuilder('instance')
      .leftJoinAndSelect('instance.flow', 'flow')
      .leftJoinAndSelect('flow.steps', 'steps')
      .leftJoinAndSelect('steps.users', 'stepUsers')
      .leftJoinAndSelect('stepUsers.user', 'user')
      .leftJoinAndSelect('instance.submittedBy', 'submittedBy')
      .leftJoinAndSelect('instance.records', 'records')
      .where('instance.status IN (:...statuses)', { 
        statuses: [ApprovalStatus.PENDING, ApprovalStatus.IN_PROGRESS] 
      })
      .andWhere('user.id = :userId', { userId })
      .andWhere('steps.stepOrder = instance.currentStepOrder')

    if (query?.documentType) {
      queryBuilder.andWhere('instance.documentType = :documentType', { 
        documentType: query.documentType 
      })
    }

    const page = query?.page || 1
    const limit = query?.limit || 10
    const total = await queryBuilder.getCount()

    const instances = await queryBuilder
      .orderBy('instance.submittedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany()

    return {
      data: instances,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  // 獲取審批歷史
  async getApprovalHistory(instanceId: number): Promise<ApprovalRecord[]> {
    return this.recordRepository.find({
      where: { instanceId },
      relations: ['step', 'approver', 'delegateTo'],
      order: { actionDate: 'ASC' }
    })
  }

  // 取消審批
  async cancelApproval(instanceId: number, userId: number, reason?: string): Promise<ApprovalInstance> {
    const instance = await this.instanceRepository.findOne({ where: { id: instanceId } })
    
    if (!instance) {
      throw new NotFoundException('審批實例不存在')
    }

    if (!instance.canCancel) {
      throw new BadRequestException('當前狀態不允許取消')
    }

    if (instance.submittedById !== userId) {
      throw new BadRequestException('只有提交人可以取消審批')
    }

    await this.instanceRepository.update(instanceId, {
      status: ApprovalStatus.CANCELLED,
      completedAt: new Date(),
      notes: reason
    })

    return this.instanceRepository.findOne({
      where: { id: instanceId },
      relations: ['flow', 'submittedBy', 'records']
    })
  }

  // 尋找匹配的審批流程
  private async findMatchingFlow(request: CreateApprovalRequest): Promise<ApprovalFlow | null> {
    const flows = await this.flowRepository.find({
      where: { 
        type: request.documentType as ApprovalFlowType,
        isActive: true 
      },
      relations: ['steps', 'steps.users'],
      order: { id: 'ASC' }
    })

    for (const flow of flows) {
      if (request.amount && !flow.isAmountInRange(request.amount)) {
        continue
      }

      if (!flow.matchesConditions(request.documentData || {})) {
        continue
      }

      return flow
    }

    return null
  }

  // 開始審批流程
  private async startApprovalProcess(instanceId: number): Promise<void> {
    await this.instanceRepository.update(instanceId, {
      status: ApprovalStatus.IN_PROGRESS
    })
  }

  // 處理審批步驟
  private async processApprovalStep(instance: ApprovalInstance, currentStep: ApprovalStep): Promise<void> {
    // 檢查當前步驟是否完成
    const stepCompleted = await this.isStepCompleted(instance, currentStep)
    
    if (stepCompleted) {
      // 檢查是否還有下一步
      const nextStep = instance.flow.steps.find(s => s.stepOrder === instance.currentStepOrder + 1)
      
      if (nextStep) {
        // 進入下一步
        await this.instanceRepository.update(instance.id, {
          currentStepOrder: nextStep.stepOrder
        })
      } else {
        // 審批完成
        await this.instanceRepository.update(instance.id, {
          status: ApprovalStatus.APPROVED,
          completedAt: new Date()
        })
      }
    }
  }

  // 檢查步驟是否完成
  private async isStepCompleted(instance: ApprovalInstance, step: ApprovalStep): Promise<boolean> {
    const approvalRecords = await this.recordRepository.find({
      where: {
        instanceId: instance.id,
        stepId: step.id,
        action: ApprovalAction.APPROVE
      }
    })

    const totalUsers = step.users.filter(u => u.isActive).length
    const approvedCount = approvalRecords.length

    switch (step.type) {
      case ApprovalStepType.SINGLE:
        return approvedCount >= 1
      
      case ApprovalStepType.ALL:
        return approvedCount >= totalUsers
      
      case ApprovalStepType.MAJORITY:
        return approvedCount > totalUsers / 2
      
      case ApprovalStepType.SEQUENTIAL:
        // 順序審批需要按順序檢查
        const sortedUsers = step.users.sort((a, b) => a.userOrder - b.userOrder)
        return approvedCount >= sortedUsers.findIndex(u => !approvalRecords.some(r => r.approverId === u.userId)) + 1
      
      default:
        return false
    }
  }

  // 檢查用戶是否可以審批
  private async canUserApprove(instance: ApprovalInstance, userId: number): Promise<boolean> {
    const currentStep = instance.flow.steps.find(s => s.stepOrder === instance.currentStepOrder)
    if (!currentStep) return false

    const userInStep = currentStep.users.some(u => u.userId === userId && u.isActive)
    if (!userInStep) return false

    // 檢查是否已經審批過
    const existingRecord = await this.recordRepository.findOne({
      where: {
        instanceId: instance.id,
        stepId: currentStep.id,
        approverId: userId
      }
    })

    return !existingRecord
  }
}