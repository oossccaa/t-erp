import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request, ParseIntPipe } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { ApprovalService } from './approval.service'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { UserRole } from '../users/entities/user.entity'
import { ApprovalAction } from './entities/approval-record.entity'

@ApiTags('審批管理')
@ApiBearerAuth()
@Controller('approvals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  @Post('instances')
  @ApiOperation({ summary: '創建審批實例' })
  @ApiResponse({ status: 201, description: '創建成功' })
  async createApprovalInstance(
    @Body() createDto: {
      documentType: string
      documentId: number
      documentNumber?: string
      title?: string
      description?: string
      amount?: number
      documentData?: Record<string, any>
      notes?: string
    },
    @Request() req
  ) {
    return this.approvalService.createApprovalInstance({
      ...createDto,
      submittedById: req.user.id
    })
  }

  @Get('pending')
  @ApiOperation({ summary: '獲取待審批列表' })
  @ApiResponse({ status: 200, description: '獲取成功' })
  async getPendingApprovals(
    @Request() req,
    @Query('documentType') documentType?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.approvalService.getPendingApprovals(req.user.id, {
      documentType,
      page,
      limit
    })
  }

  @Get('instances/:id')
  @ApiOperation({ summary: '獲取審批實例詳情' })
  @ApiResponse({ status: 200, description: '獲取成功' })
  async getApprovalInstance(@Param('id', ParseIntPipe) id: number) {
    return this.approvalService.getApprovalHistory(id)
  }

  @Get('instances/:id/history')
  @ApiOperation({ summary: '獲取審批歷史' })
  @ApiResponse({ status: 200, description: '獲取成功' })
  async getApprovalHistory(@Param('id', ParseIntPipe) id: number) {
    return this.approvalService.getApprovalHistory(id)
  }

  @Patch('instances/:id/process')
  @ApiOperation({ summary: '處理審批' })
  @ApiResponse({ status: 200, description: '處理成功' })
  async processApproval(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() body: {
      action: ApprovalAction
      comments?: string
      reason?: string
      delegateToId?: number
      attachments?: string[]
    }
  ) {
    return this.approvalService.processApproval(id, req.user.id, body)
  }

  @Patch('instances/:id/cancel')
  @ApiOperation({ summary: '取消審批' })
  @ApiResponse({ status: 200, description: '取消成功' })
  async cancelApproval(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() body: { reason?: string }
  ) {
    return this.approvalService.cancelApproval(id, req.user.id, body.reason)
  }
}