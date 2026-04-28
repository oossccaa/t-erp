import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, Request, ParseIntPipe } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { PurchaseOrdersService } from './purchase-orders.service'
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto'
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto'
import { QueryPurchaseOrderDto } from './dto/query-order.dto'
import { CancelOrderDto } from './dto/cancel-order.dto'
import { RevertOrderDto } from './dto/revert-order.dto'
import { MonthlyPurchaseReportDto, DateRangePurchaseReportDto } from './dto/purchase-report.dto'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { UserRole } from '../users/entities/user.entity'

@ApiTags('採購單管理')
@ApiBearerAuth()
@Controller('purchase-orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Post()
  @ApiOperation({ summary: '創建採購單' })
  @ApiResponse({ status: 201, description: '創建成功' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async create(@Body() createDto: CreatePurchaseOrderDto, @Request() req) {
    return this.purchaseOrdersService.create(createDto, req.user.id)
  }

  @Get()
  @ApiOperation({ summary: '獲取採購單列表' })
  @ApiResponse({ status: 200, description: '獲取成功' })
  async findAll(@Query() query: QueryPurchaseOrderDto) {
    const result = await this.purchaseOrdersService.findAll(query)
    return {
      success: true,
      data: result,
      message: '獲取採購單列表成功'
    }
  }

  @Get('statistics')
  @ApiOperation({ summary: '獲取採購統計' })
  @ApiResponse({ status: 200, description: '獲取成功' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getStatistics() {
    return this.purchaseOrdersService.getStatistics()
  }

  @Get('report/monthly')
  @ApiOperation({ summary: '獲取月度採購報表' })
  @ApiResponse({ status: 200, description: '獲取成功' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getMonthlyPurchaseReport(@Query() dto: MonthlyPurchaseReportDto) {
    const result = await this.purchaseOrdersService.getMonthlyPurchaseReport(dto.year, dto.month, dto.status)
    return {
      success: true,
      data: result,
      message: '獲取月度採購報表成功'
    }
  }

  @Get('report/date-range')
  @ApiOperation({ summary: '獲取日期範圍採購報表' })
  @ApiResponse({ status: 200, description: '獲取成功' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getDateRangePurchaseReport(@Query() dto: DateRangePurchaseReportDto) {
    const result = await this.purchaseOrdersService.getDateRangePurchaseReport(dto.startDate, dto.endDate, dto.status)
    return {
      success: true,
      data: result,
      message: '獲取日期範圍採購報表成功'
    }
  }

  @Get(':id')
  @ApiOperation({ summary: '獲取採購單詳情' })
  @ApiResponse({ status: 200, description: '獲取成功' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.purchaseOrdersService.findOne(id)
  }

  @Put(':id')
  @ApiOperation({ summary: '更新採購單' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePurchaseOrderDto
  ) {
    return this.purchaseOrdersService.update(id, updateDto)
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: '審批採購單' })
  @ApiResponse({ status: 200, description: '審批成功' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async approve(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.purchaseOrdersService.approve(id, req.user.id)
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: '取消採購單' })
  @ApiResponse({ status: 200, description: '取消成功' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @Body() cancelDto: CancelOrderDto,
    @Request() req
  ) {
    return this.purchaseOrdersService.cancel(id, cancelDto, req.user.id)
  }

  @Patch(':id/revert')
  @ApiOperation({ summary: '退回到上一步' })
  @ApiResponse({ status: 200, description: '退回成功' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async revert(
    @Param('id', ParseIntPipe) id: number,
    @Body() revertDto: RevertOrderDto,
    @Request() req
  ) {
    return this.purchaseOrdersService.revert(id, revertDto, req.user.id)
  }

  @Patch(':id/receive')
  @ApiOperation({ summary: '接收採購貨物' })
  @ApiResponse({ status: 200, description: '接收成功' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async receiveItems(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { items: Array<{ itemId: number; receivedQuantity: number }> }
  ) {
    return this.purchaseOrdersService.receiveItems(id, body.items)
  }

  @Patch(':id/payment-status')
  @ApiOperation({ summary: '切換付款狀態（已付 / 未付）' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async setPaymentStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { paid: boolean }
  ) {
    const result = await this.purchaseOrdersService.setPaymentStatus(id, body.paid)
    return {
      success: true,
      data: result,
      message: body.paid ? '已標記為已付款' : '已標記為未付款'
    }
  }
}