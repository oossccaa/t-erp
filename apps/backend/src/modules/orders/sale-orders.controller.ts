import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseGuards, Request, ParseIntPipe } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { SaleOrdersService } from './sale-orders.service'
import { CreateSaleOrderDto } from './dto/create-sale-order.dto'
import { UpdateSaleOrderDto } from './dto/update-sale-order.dto'
import { QuerySaleOrderDto } from './dto/query-order.dto'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { UserRole } from '../users/entities/user.entity'

@ApiTags('銷售單管理')
@ApiBearerAuth()
@Controller('sale-orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SaleOrdersController {
  constructor(private readonly saleOrdersService: SaleOrdersService) {}

  @Post()
  @ApiOperation({ summary: '創建銷售單' })
  @ApiResponse({ status: 201, description: '創建成功' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async create(@Body() createDto: CreateSaleOrderDto, @Request() req) {
    return this.saleOrdersService.create(createDto, req.user.id)
  }

  @Get()
  @ApiOperation({ summary: '獲取銷售單列表' })
  @ApiResponse({ status: 200, description: '獲取成功' })
  async findAll(@Query() query: QuerySaleOrderDto) {
    return this.saleOrdersService.findAll(query)
  }

  @Get('statistics')
  @ApiOperation({ summary: '獲取銷售統計' })
  @ApiResponse({ status: 200, description: '獲取成功' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getStatistics() {
    return this.saleOrdersService.getStatistics()
  }

  @Get(':id')
  @ApiOperation({ summary: '獲取銷售單詳情' })
  @ApiResponse({ status: 200, description: '獲取成功' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.saleOrdersService.findOne(id)
  }

  @Put(':id')
  @ApiOperation({ summary: '更新銷售單' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateSaleOrderDto
  ) {
    return this.saleOrdersService.update(id, updateDto)
  }

  @Patch(':id/confirm')
  @ApiOperation({ summary: '確認銷售單' })
  @ApiResponse({ status: 200, description: '確認成功' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async confirm(@Param('id', ParseIntPipe) id: number) {
    return this.saleOrdersService.confirm(id)
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: '取消銷售單' })
  @ApiResponse({ status: 200, description: '取消成功' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async cancel(@Param('id', ParseIntPipe) id: number) {
    return this.saleOrdersService.cancel(id)
  }

  @Patch(':id/ship')
  @ApiOperation({ summary: '出貨' })
  @ApiResponse({ status: 200, description: '出貨成功' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async shipItems(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { items: Array<{ itemId: number; shippedQuantity: number }> }
  ) {
    return this.saleOrdersService.shipItems(id, body.items)
  }

  @Patch(':id/shipping-info')
  @ApiOperation({ summary: '更新物流信息' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async updateShippingInfo(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { trackingNumber?: string; shippingMethod?: string }
  ) {
    return this.saleOrdersService.updateShippingInfo(id, body)
  }

  @Patch(':id/delivered')
  @ApiOperation({ summary: '標記為已送達' })
  @ApiResponse({ status: 200, description: '標記成功' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  async markDelivered(@Param('id', ParseIntPipe) id: number) {
    return this.saleOrdersService.markDelivered(id)
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: '完成訂單' })
  @ApiResponse({ status: 200, description: '完成成功' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async complete(@Param('id', ParseIntPipe) id: number) {
    return this.saleOrdersService.complete(id)
  }
}