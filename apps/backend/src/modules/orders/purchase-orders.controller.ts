import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, Request, ParseIntPipe } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { PurchaseOrdersService } from './purchase-orders.service'
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto'
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto'
import { QueryPurchaseOrderDto } from './dto/query-order.dto'
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
    return this.purchaseOrdersService.findAll(query)
  }

  @Get('statistics')
  @ApiOperation({ summary: '獲取採購統計' })
  @ApiResponse({ status: 200, description: '獲取成功' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getStatistics() {
    return this.purchaseOrdersService.getStatistics()
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
  async cancel(@Param('id', ParseIntPipe) id: number) {
    return this.purchaseOrdersService.cancel(id)
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
}