import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request, ParseIntPipe } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { InventoryService } from './inventory.service'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { UserRole } from '../users/entities/user.entity'
import { InventoryTransactionType } from './entities/inventory-transaction.entity'
import { InventoryAdjustmentStatus } from './entities/inventory-adjustment.entity'

@ApiTags('庫存管理')
@ApiBearerAuth()
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('stats')
  @ApiOperation({ summary: '獲取庫存統計' })
  @ApiResponse({ status: 200, description: '獲取成功' })
  async getStats(
    @Query('warehouse') warehouse?: string,
    @Query('categoryId') categoryId?: number,
    @Query('lowStockOnly') lowStockOnly?: boolean
  ) {
    return this.inventoryService.getInventoryStats({
      warehouse,
      categoryId,
      lowStockOnly
    })
  }

  @Get('transactions/product/:productId')
  @ApiOperation({ summary: '獲取產品庫存異動記錄' })
  @ApiResponse({ status: 200, description: '獲取成功' })
  async getProductTransactions(
    @Param('productId', ParseIntPipe) productId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: InventoryTransactionType,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.inventoryService.getProductTransactions(productId, {
      startDate,
      endDate,
      type,
      page,
      limit
    })
  }

  @Post('adjustments')
  @ApiOperation({ summary: '創建庫存調整單' })
  @ApiResponse({ status: 201, description: '創建成功' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async createAdjustment(
    @Body() createDto: {
      type: string
      adjustmentDate: string
      warehouse?: string
      reason?: string
      notes?: string
      items: Array<{
        productId: number
        systemQuantity: number
        actualQuantity: number
        unitCost?: number
        batchNumber?: string
        expiryDate?: string
        location?: string
        reason?: string
        notes?: string
      }>
    },
    @Request() req
  ) {
    return this.inventoryService.createAdjustment(createDto, req.user.id)
  }

  @Get('adjustments')
  @ApiOperation({ summary: '獲取調整單列表' })
  @ApiResponse({ status: 200, description: '獲取成功' })
  async getAdjustments(
    @Query('status') status?: InventoryAdjustmentStatus,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.inventoryService.getAdjustments({
      status,
      type,
      startDate,
      endDate,
      page,
      limit
    })
  }

  @Patch('adjustments/:id/approve')
  @ApiOperation({ summary: '審批調整單' })
  @ApiResponse({ status: 200, description: '審批成功' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async approveAdjustment(
    @Param('id', ParseIntPipe) id: number,
    @Request() req
  ) {
    return this.inventoryService.approveAdjustment(id, req.user.id)
  }
}