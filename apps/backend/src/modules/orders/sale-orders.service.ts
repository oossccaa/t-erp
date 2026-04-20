import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Like, DataSource } from 'typeorm'
import { SaleOrder, SaleOrderStatus, PaymentStatus, ShippingStatus } from './entities/sale-order.entity'
import { SaleOrderItem } from './entities/sale-order-item.entity'
import { CreateSaleOrderDto } from './dto/create-sale-order.dto'
import { UpdateSaleOrderDto } from './dto/update-sale-order.dto'
import { QuerySaleOrderDto } from './dto/query-order.dto'
import { CancelOrderDto } from './dto/cancel-order.dto'
import { RevertOrderDto } from './dto/revert-order.dto'
import { Product } from '../products/entities/product.entity'
import { User } from '../users/entities/user.entity'
import { InventoryService } from '../inventory/inventory.service'
import { InventoryTransactionType } from '../inventory/entities/inventory-transaction.entity'

@Injectable()
export class SaleOrdersService {
  constructor(
    @InjectRepository(SaleOrder)
    private saleOrderRepository: Repository<SaleOrder>,
    @InjectRepository(SaleOrderItem)
    private saleOrderItemRepository: Repository<SaleOrderItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private inventoryService: InventoryService,
    private dataSource: DataSource,
  ) {}

  async create(createDto: CreateSaleOrderDto, userId: number): Promise<SaleOrder> {
    // 驗證產品是否存在和庫存是否充足
    const productIds = createDto.items.map(item => item.productId)
    const products = await this.productRepository.findByIds(productIds)
    if (products.length !== productIds.length) {
      throw new BadRequestException('部分產品不存在')
    }

    // 檢查庫存
    for (const item of createDto.items) {
      const product = products.find(p => p.id === item.productId)
      if (product.stockQuantity < item.quantity) {
        throw new BadRequestException(`產品 ${product.name} 庫存不足`)
      }
    }

    // 生成訂單號
    const orderNumber = await this.generateOrderNumber()

    // 計算總金額
    let subtotal = 0
    const items = createDto.items.map((item, index) => {
      const product = products.find(p => p.id === item.productId)
      const itemDiscountAmount = item.discountAmount || (item.unitPrice * item.quantity * (item.discountRate || 0) / 100)
      const totalPrice = (item.quantity * item.unitPrice) - itemDiscountAmount
      subtotal += totalPrice

      const orderItem = new SaleOrderItem()
      orderItem.productId = item.productId
      orderItem.productName = product.name
      orderItem.productSku = product.sku
      orderItem.unit = product.unit
      orderItem.quantity = item.quantity
      orderItem.unitPrice = item.unitPrice
      orderItem.discountRate = item.discountRate || 0
      orderItem.discountAmount = itemDiscountAmount
      orderItem.totalPrice = totalPrice
      orderItem.notes = item.notes
      orderItem.lineNumber = index + 1
      return orderItem
    })

    // 計算稅額和總金額
    const taxAmount = subtotal * (createDto.taxRate || 0) / 100
    const discountAmount = createDto.discountAmount || (subtotal * (createDto.discountRate || 0) / 100)
    const totalAmount = subtotal + taxAmount - discountAmount + (createDto.shippingCost || 0)

    const saleOrder = this.saleOrderRepository.create({
      ...createDto,
      orderNumber,
      createdById: userId,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      items,
    })

    return this.saleOrderRepository.save(saleOrder)
  }

  async findAll(query: QuerySaleOrderDto) {
    const queryBuilder = this.saleOrderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.createdBy', 'createdBy')
      .leftJoinAndSelect('order.approvedBy', 'approvedBy')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')

    if (query.keyword) {
      queryBuilder.andWhere(
        '(order.orderNumber LIKE :keyword OR customer.name LIKE :keyword OR customer.contactPerson LIKE :keyword)',
        { keyword: `%${query.keyword}%` }
      )
    }

    if (query.orderNumber) {
      queryBuilder.andWhere('order.orderNumber LIKE :orderNumber', {
        orderNumber: `%${query.orderNumber}%`
      })
    }

    if (query.status) {
      queryBuilder.andWhere('order.status = :status', { status: query.status })
    }

    if (query.paymentStatus) {
      queryBuilder.andWhere('order.paymentStatus = :paymentStatus', {
        paymentStatus: query.paymentStatus
      })
    }

    if (query.shippingStatus) {
      queryBuilder.andWhere('order.shippingStatus = :shippingStatus', {
        shippingStatus: query.shippingStatus
      })
    }

    if (query.customerId) {
      queryBuilder.andWhere('order.customerId = :customerId', {
        customerId: query.customerId
      })
    }

    if (query.startDate && query.endDate) {
      queryBuilder.andWhere('order.orderDate BETWEEN :startDate AND :endDate', {
        startDate: query.startDate,
        endDate: query.endDate
      })
    }

    const total = await queryBuilder.getCount()

    queryBuilder
      .orderBy(`order.${query.sortBy}`, query.sortOrder)
      .skip((query.page - 1) * query.limit)
      .take(query.limit)

    const items = await queryBuilder.getMany()
    const totalPages = Math.ceil(total / query.limit)

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages
    }
  }

  async findOne(id: number): Promise<SaleOrder> {
    const order = await this.saleOrderRepository.findOne({
      where: { id },
      relations: ['customer', 'createdBy', 'approvedBy', 'items', 'items.product']
    })

    if (!order) {
      throw new NotFoundException('銷售單不存在')
    }

    return order
  }

  async update(id: number, updateDto: UpdateSaleOrderDto): Promise<SaleOrder> {
    const order = await this.findOne(id)

    if (order.status !== SaleOrderStatus.PENDING) {
      throw new BadRequestException('只能修改待確認狀態的銷售單')
    }

    // 如果更新了明細項目，需要重新計算金額
    if (updateDto.items) {
      await this.saleOrderItemRepository.delete({ saleOrderId: id })
      
      const productIds = updateDto.items.map(item => item.productId)
      const products = await this.productRepository.findByIds(productIds)
      
      let subtotal = 0
      const items = updateDto.items.map((item, index) => {
        const product = products.find(p => p.id === item.productId)
        const itemDiscountAmount = item.discountAmount || (item.unitPrice * item.quantity * (item.discountRate || 0) / 100)
        const totalPrice = (item.quantity * item.unitPrice) - itemDiscountAmount
        subtotal += totalPrice

        const orderItem = new SaleOrderItem()
        orderItem.saleOrderId = id
        orderItem.productId = item.productId
        orderItem.productName = product.name
        orderItem.productSku = product.sku
        orderItem.unit = product.unit
        orderItem.quantity = item.quantity
        orderItem.unitPrice = item.unitPrice
        orderItem.discountRate = item.discountRate || 0
        orderItem.discountAmount = itemDiscountAmount
        orderItem.totalPrice = totalPrice
        orderItem.notes = item.notes
        orderItem.lineNumber = index + 1
        return orderItem
      })

      await this.saleOrderItemRepository.save(items)

      const taxAmount = subtotal * (updateDto.taxRate || order.taxRate) / 100
      const discountAmount = updateDto.discountAmount || (subtotal * (updateDto.discountRate || order.discountRate) / 100)
      const totalAmount = subtotal + taxAmount - discountAmount + (updateDto.shippingCost || order.shippingCost)

      updateDto.subtotal = subtotal
      updateDto.taxAmount = taxAmount
      updateDto.discountAmount = discountAmount
      updateDto.totalAmount = totalAmount
    }

    // 從 updateDto 中排除 items，避免 TypeORM 嘗試處理 one-to-many 關係
    const { items: _, ...updateData } = updateDto
    await this.saleOrderRepository.update(id, updateData)
    return this.findOne(id)
  }

  async submit(id: number): Promise<SaleOrder> {
    const order = await this.findOne(id)

    if (order.status !== SaleOrderStatus.DRAFT) {
      throw new BadRequestException('只能提交草稿狀態的銷售單')
    }

    await this.saleOrderRepository.update(id, {
      status: SaleOrderStatus.PENDING
    })

    return this.findOne(id)
  }

  async confirm(id: number): Promise<SaleOrder> {
    const order = await this.findOne(id)

    if (order.status !== SaleOrderStatus.PENDING) {
      throw new BadRequestException('只能確認待確認狀態的銷售單')
    }

    // 再次檢查庫存
    for (const item of order.items) {
      const product = await this.productRepository.findOne({ where: { id: item.productId } })
      if (product.stockQuantity < item.quantity) {
        throw new BadRequestException(`產品 ${product.name} 庫存不足`)
      }
    }

    await this.saleOrderRepository.update(id, {
      status: SaleOrderStatus.CONFIRMED
    })

    return this.findOne(id)
  }

  async cancel(id: number, cancelDto: CancelOrderDto, userId: number): Promise<SaleOrder> {
    const order = await this.findOne(id)

    if (!order.canCancel) {
      throw new BadRequestException('當前狀態不允許取消')
    }

    return this.dataSource.transaction(async (manager) => {
      // 記錄狀態變更歷史
      const statusHistory = order.statusHistory || []
      const user = await this.userRepository.findOne({ where: { id: userId } })

      statusHistory.push({
        fromStatus: order.status,
        toStatus: SaleOrderStatus.CANCELLED,
        reason: cancelDto.reason,
        operatedAt: new Date(),
        operatedById: userId,
        operatedByName: user?.username || 'Unknown',
        inventoryAction: cancelDto.adjustInventory ? 'restore' : 'none'
      })

      // 如果選擇調整庫存且已有出貨記錄
      if (cancelDto.adjustInventory) {
        for (const item of order.items) {
          if (item.shippedQuantity > 0) {
            // 記錄庫存異動並增加產品庫存（回補）
            await this.inventoryService.recordTransaction({
              productId: item.productId,
              type: InventoryTransactionType.RETURN_RECEIVE,
              quantityChanged: item.shippedQuantity,
              unitCost: item.product.unitCost,
              referenceType: 'sale_order',
              referenceId: order.id,
              referenceNumber: order.orderNumber,
              reason: `取消銷售單 ${order.orderNumber}，回補庫存。原因：${cancelDto.reason}`,
              createdById: userId,
            })
          }
        }
      }

      // 更新訂單
      await manager.update(SaleOrder, id, {
        status: SaleOrderStatus.CANCELLED,
        cancelReason: cancelDto.reason,
        cancelledAt: new Date(),
        cancelledById: userId,
        statusHistory,
      })

      return this.findOne(id)
    })
  }

  async revert(id: number, revertDto: RevertOrderDto, userId: number): Promise<SaleOrder> {
    const order = await this.findOne(id)

    if (!order.canRevert) {
      throw new BadRequestException('當前狀態不允許退回')
    }

    const targetStatus = order.revertToStatus
    if (!targetStatus) {
      throw new BadRequestException('無法確定退回狀態')
    }

    // 檢查是否有出貨記錄
    if ([
      SaleOrderStatus.PROCESSING,
      SaleOrderStatus.PARTIALLY_SHIPPED,
      SaleOrderStatus.SHIPPED,
      SaleOrderStatus.DELIVERED
    ].includes(order.status)) {
      const hasShippedItems = order.items.some(item => item.shippedQuantity > 0)
      if (hasShippedItems) {
        throw new BadRequestException(
          '該訂單已有出貨記錄，不能直接退回。請使用「取消」功能並選擇回補庫存。'
        )
      }
    }

    return this.dataSource.transaction(async (manager) => {
      // 記錄狀態變更
      const statusHistory = order.statusHistory || []
      const user = await this.userRepository.findOne({ where: { id: userId } })

      statusHistory.push({
        fromStatus: order.status,
        toStatus: targetStatus,
        reason: revertDto.reason || '退回上一步',
        operatedAt: new Date(),
        operatedById: userId,
        operatedByName: user?.username || 'Unknown',
        inventoryAction: 'none'
      })

      // 清除確認相關欄位（如果從 CONFIRMED 退回）
      const updateData: any = {
        status: targetStatus,
        statusHistory,
      }

      if (order.status === SaleOrderStatus.CONFIRMED && targetStatus === SaleOrderStatus.PENDING) {
        updateData.approvedById = null
        updateData.approvedAt = null
      }

      await manager.update(SaleOrder, id, updateData)
      return this.findOne(id)
    })
  }

  async shipItems(id: number, items: Array<{ itemId: number; shippedQuantity: number }>) {
    const order = await this.findOne(id)

    if (!order.canShip) {
      throw new BadRequestException('當前狀態不允許出貨')
    }

    for (const item of items) {
      const orderItem = order.items.find(i => i.id === item.itemId)
      if (!orderItem) {
        throw new NotFoundException(`訂單明細 ${item.itemId} 不存在`)
      }

      if (orderItem.shippedQuantity + item.shippedQuantity > orderItem.quantity) {
        throw new BadRequestException(`出貨數量超過訂購數量`)
      }

      // 檢查庫存
      const product = await this.productRepository.findOne({ where: { id: orderItem.productId } })
      if (product.stockQuantity < item.shippedQuantity) {
        throw new BadRequestException(`產品 ${product.name} 庫存不足`)
      }

      await this.saleOrderItemRepository.update(item.itemId, {
        shippedQuantity: orderItem.shippedQuantity + item.shippedQuantity
      })

      // 記錄庫存異動並減少產品庫存
      await this.inventoryService.recordTransaction({
        productId: orderItem.productId,
        type: InventoryTransactionType.SALE_SHIP,
        quantityChanged: -item.shippedQuantity,
        unitCost: orderItem.product.unitCost,
        referenceType: 'sale_order',
        referenceId: order.id,
        referenceNumber: order.orderNumber,
        reason: `銷售單 ${order.orderNumber} 出庫`,
        createdById: order.createdById,
      })
    }

    // 檢查是否全部出貨完成
    const updatedOrder = await this.findOne(id)
    const allFullyShipped = updatedOrder.items.every(item => item.isFullyShipped)
    const partiallyShipped = updatedOrder.items.some(item => item.shippedQuantity > 0)

    let newStatus = order.status
    let newShippingStatus = order.shippingStatus
    if (allFullyShipped) {
      newStatus = SaleOrderStatus.SHIPPED
      newShippingStatus = ShippingStatus.SHIPPED
    } else if (partiallyShipped) {
      newStatus = SaleOrderStatus.PARTIALLY_SHIPPED
      newShippingStatus = ShippingStatus.PARTIALLY_SHIPPED
    }

    if (newStatus !== order.status || newShippingStatus !== order.shippingStatus) {
      await this.saleOrderRepository.update(id, { 
        status: newStatus, 
        shippingStatus: newShippingStatus,
        actualShippingDate: new Date()
      })
    }

    return this.findOne(id)
  }

  async updateShippingInfo(id: number, info: { trackingNumber?: string; shippingMethod?: string }) {
    const order = await this.findOne(id)
    
    if (order.shippingStatus === ShippingStatus.NOT_SHIPPED) {
      throw new BadRequestException('訂單尚未出貨')
    }

    await this.saleOrderRepository.update(id, info)
    return this.findOne(id)
  }

  async markDelivered(id: number): Promise<SaleOrder> {
    const order = await this.findOne(id)

    if (order.shippingStatus !== ShippingStatus.SHIPPED && order.shippingStatus !== ShippingStatus.IN_TRANSIT) {
      throw new BadRequestException('只能標記已出貨或運送中的訂單為已送達')
    }

    await this.saleOrderRepository.update(id, {
      status: SaleOrderStatus.DELIVERED,
      shippingStatus: ShippingStatus.DELIVERED,
      actualDeliveryDate: new Date()
    })

    return this.findOne(id)
  }

  async complete(id: number): Promise<SaleOrder> {
    const order = await this.findOne(id)

    if (!order.canComplete) {
      throw new BadRequestException('訂單必須已送達且付款完成才能標記為完成')
    }

    await this.saleOrderRepository.update(id, {
      status: SaleOrderStatus.COMPLETED
    })

    return this.findOne(id)
  }

  async getStatistics() {
    const stats = await this.saleOrderRepository
      .createQueryBuilder('order')
      .select('order.status, COUNT(*) as count, SUM(order.totalAmount) as totalAmount')
      .groupBy('order.status')
      .getRawMany()

    return stats.reduce((acc, stat) => {
      acc[stat.status] = {
        count: parseInt(stat.count),
        totalAmount: parseFloat(stat.totalAmount) || 0
      }
      return acc
    }, {})
  }

  /**
   * 獲取月度銷售報表
   */
  async getMonthlySalesReport(year: number, month: number, status?: SaleOrderStatus) {
    // 計算月份的起始和結束日期
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999)

    return this.getSalesReportByDateRange(
      startDate,
      endDate,
      `${year}年${month}月`,
      status
    )
  }

  /**
   * 獲取日期範圍銷售報表
   */
  async getDateRangeSalesReport(
    startDateStr: string,
    endDateStr: string,
    status?: SaleOrderStatus
  ) {
    const startDate = new Date(startDateStr)
    const endDate = new Date(endDateStr + 'T23:59:59.999Z')

    // 驗證日期範圍
    if (startDate > endDate) {
      throw new BadRequestException('開始日期不能晚於結束日期')
    }

    const label = `${startDateStr} 至 ${endDateStr}`
    return this.getSalesReportByDateRange(startDate, endDate, label, status)
  }

  /**
   * 核心報表查詢方法（被月度和日期範圍方法共用）
   */
  private async getSalesReportByDateRange(
    startDate: Date,
    endDate: Date,
    label: string,
    status?: SaleOrderStatus
  ) {
    // 構建基礎查詢條件
    const baseWhere = 'order.orderDate BETWEEN :startDate AND :endDate'
    const baseParams: any = { startDate, endDate }

    if (status) {
      baseParams.status = status
    }

    // 1. 查詢彙總數據
    const summaryQueryBuilder = this.saleOrderRepository
      .createQueryBuilder('order')
      .where(baseWhere, baseParams)

    if (status) {
      summaryQueryBuilder.andWhere('order.status = :status', { status })
    }

    const summaryQuery = await summaryQueryBuilder
      .select('COUNT(*)', 'totalOrders')
      .addSelect('COALESCE(SUM(order.totalAmount), 0)', 'totalAmount')
      .addSelect('COALESCE(AVG(order.totalAmount), 0)', 'avgOrderValue')
      .addSelect(
        'SUM(CASE WHEN order.status = :completedStatus THEN 1 ELSE 0 END)',
        'completedOrders'
      )
      .addSelect(
        'COALESCE(SUM(CASE WHEN order.status = :completedStatus THEN order.totalAmount ELSE 0 END), 0)',
        'completedAmount'
      )
      .setParameter('completedStatus', SaleOrderStatus.COMPLETED)
      .getRawOne()

    // 2. 查詢每日趨勢數據
    const trendQueryBuilder = this.saleOrderRepository
      .createQueryBuilder('order')
      .select('DATE(order.orderDate)', 'date')
      .addSelect('COALESCE(SUM(order.totalAmount), 0)', 'amount')
      .addSelect('COUNT(*)', 'orderCount')
      .addSelect('COALESCE(AVG(order.totalAmount), 0)', 'avgAmount')
      .where(baseWhere, baseParams)
      .groupBy('DATE(order.orderDate)')
      .orderBy('DATE(order.orderDate)', 'ASC')

    if (status) {
      trendQueryBuilder.andWhere('order.status = :status', { status })
    }

    const trendData = await trendQueryBuilder.getRawMany()

    // 3. 查詢狀態分布
    const statusQueryBuilder = this.saleOrderRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(order.totalAmount), 0)', 'amount')
      .where(baseWhere, baseParams)
      .groupBy('order.status')

    if (status) {
      statusQueryBuilder.andWhere('order.status = :status', { status })
    }

    const statusBreakdown = await statusQueryBuilder.getRawMany()

    // 計算百分比
    const totalAmount = parseFloat(summaryQuery.totalAmount) || 0
    const statusBreakdownWithPercentage = statusBreakdown.map(item => ({
      status: item.status,
      count: parseInt(item.count) || 0,
      amount: parseFloat(item.amount) || 0,
      percentage: totalAmount > 0 ? (parseFloat(item.amount) / totalAmount) * 100 : 0
    }))

    // 格式化返回數據
    return {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        label
      },
      summary: {
        totalAmount: parseFloat(summaryQuery.totalAmount) || 0,
        totalOrders: parseInt(summaryQuery.totalOrders) || 0,
        avgOrderValue: parseFloat(summaryQuery.avgOrderValue) || 0,
        completedOrders: parseInt(summaryQuery.completedOrders) || 0,
        completedAmount: parseFloat(summaryQuery.completedAmount) || 0
      },
      trend: trendData.map(item => ({
        date: item.date,
        amount: parseFloat(item.amount) || 0,
        orderCount: parseInt(item.orderCount) || 0,
        avgAmount: parseFloat(item.avgAmount) || 0
      })),
      statusBreakdown: statusBreakdownWithPercentage
    }
  }

  private async generateOrderNumber(): Promise<string> {
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    
    const lastOrder = await this.saleOrderRepository.findOne({
      where: {
        orderNumber: Like(`SO${dateStr}%`)
      },
      order: { orderNumber: 'DESC' }
    })

    let sequence = 1
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.slice(-4))
      sequence = lastSequence + 1
    }

    return `SO${dateStr}${sequence.toString().padStart(4, '0')}`
  }
}