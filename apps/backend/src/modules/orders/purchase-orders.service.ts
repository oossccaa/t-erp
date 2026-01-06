import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Between, Like, In, DataSource } from 'typeorm'
import { PurchaseOrder, PurchaseOrderStatus, PaymentStatus } from './entities/purchase-order.entity'
import { PurchaseOrderItem } from './entities/purchase-order-item.entity'
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto'
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto'
import { QueryPurchaseOrderDto } from './dto/query-order.dto'
import { CancelOrderDto } from './dto/cancel-order.dto'
import { RevertOrderDto } from './dto/revert-order.dto'
import { Product } from '../products/entities/product.entity'
import { User } from '../users/entities/user.entity'
import { InventoryService } from '../inventory/inventory.service'
import { InventoryTransactionType } from '../inventory/entities/inventory-transaction.entity'
import { ApprovalService } from '../approval/approval.service'

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private purchaseOrderItemRepository: Repository<PurchaseOrderItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private inventoryService: InventoryService,
    private approvalService: ApprovalService,
    private dataSource: DataSource,
  ) {}

  async create(createDto: CreatePurchaseOrderDto, userId: number): Promise<PurchaseOrder> {
    // 驗證產品是否存在
    const productIds = createDto.items.map(item => item.productId)
    const products = await this.productRepository.findByIds(productIds)
    if (products.length !== productIds.length) {
      throw new BadRequestException('部分產品不存在')
    }

    // 生成訂單號
    const orderNumber = await this.generateOrderNumber()

    // 計算總金額
    let subtotal = 0
    const items = createDto.items.map((item, index) => {
      const product = products.find(p => p.id === item.productId)
      const totalPrice = item.quantity * item.unitPrice
      subtotal += totalPrice

      const orderItem = new PurchaseOrderItem()
      orderItem.productId = item.productId
      orderItem.productName = product.name
      orderItem.productSku = product.sku
      orderItem.unit = product.unit
      orderItem.quantity = item.quantity
      orderItem.unitPrice = item.unitPrice
      orderItem.totalPrice = totalPrice
      orderItem.notes = item.notes
      orderItem.lineNumber = index + 1
      return orderItem
    })

    // 計算稅額和總金額
    const taxAmount = subtotal * (createDto.taxRate || 0) / 100
    const discountAmount = createDto.discountAmount || (subtotal * (createDto.discountRate || 0) / 100)
    const totalAmount = subtotal + taxAmount - discountAmount + (createDto.shippingCost || 0)

    const purchaseOrder = this.purchaseOrderRepository.create({
      ...createDto,
      orderNumber,
      createdById: userId,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      items,
    })

    const savedOrder = await this.purchaseOrderRepository.save(purchaseOrder)

    // 如果需要審批，創建審批實例
    if (savedOrder.status === PurchaseOrderStatus.PENDING || savedOrder.totalAmount > 0) {
      try {
        await this.approvalService.createApprovalInstance({
          documentType: 'purchase_order',
          documentId: savedOrder.id,
          documentNumber: savedOrder.orderNumber,
          title: `採購單 ${savedOrder.orderNumber}`,
          description: `供應商: ${savedOrder.supplier?.name || ''}, 金額: ${savedOrder.totalAmount}`,
          amount: savedOrder.totalAmount,
          documentData: {
            supplierId: savedOrder.supplierId,
            orderDate: savedOrder.orderDate,
            itemCount: savedOrder.items.length
          },
          submittedById: userId,
        })
      } catch (error) {
        // 如果沒有匹配的審批流程，直接批准
        console.log('No matching approval flow found, auto-approving')
      }
    }

    return savedOrder
  }

  async findAll(query: QueryPurchaseOrderDto) {
    const queryBuilder = this.purchaseOrderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.supplier', 'supplier')
      .leftJoinAndSelect('order.createdBy', 'createdBy')
      .leftJoinAndSelect('order.approvedBy', 'approvedBy')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')

    if (query.search) {
      queryBuilder.andWhere(
        '(order.orderNumber LIKE :search OR supplier.name LIKE :search OR supplier.contactPerson LIKE :search)',
        { search: `%${query.search}%` }
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

    if (query.supplierId) {
      queryBuilder.andWhere('order.supplierId = :supplierId', {
        supplierId: query.supplierId
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

    // 映射 supplierName 以便前端使用
    const mappedItems = items.map(item => ({
      ...item,
      supplierName: item.supplier?.name || ''
    }))

    return {
      items: mappedItems,
      total,
      page: query.page,
      limit: query.limit,
      totalPages
    }
  }

  async findOne(id: number): Promise<PurchaseOrder> {
    const order = await this.purchaseOrderRepository.findOne({
      where: { id },
      relations: ['supplier', 'createdBy', 'approvedBy', 'items', 'items.product']
    })

    if (!order) {
      throw new NotFoundException('採購單不存在')
    }

    return order
  }

  async update(id: number, updateDto: UpdatePurchaseOrderDto): Promise<PurchaseOrder> {
    const order = await this.findOne(id)

    if (order.status !== PurchaseOrderStatus.DRAFT) {
      throw new BadRequestException('只能修改草稿狀態的採購單')
    }

    // 如果更新了明細項目，需要重新計算金額
    if (updateDto.items) {
      await this.purchaseOrderItemRepository.delete({ purchaseOrderId: id })
      
      const productIds = updateDto.items.map(item => item.productId)
      const products = await this.productRepository.findByIds(productIds)
      
      let subtotal = 0
      const items = updateDto.items.map((item, index) => {
        const product = products.find(p => p.id === item.productId)
        const totalPrice = item.quantity * item.unitPrice
        subtotal += totalPrice

        const orderItem = new PurchaseOrderItem()
        orderItem.purchaseOrderId = id
        orderItem.productId = item.productId
        orderItem.productName = product.name
        orderItem.productSku = product.sku
        orderItem.unit = product.unit
        orderItem.quantity = item.quantity
        orderItem.unitPrice = item.unitPrice
        orderItem.totalPrice = totalPrice
        orderItem.notes = item.notes
        orderItem.lineNumber = index + 1
        return orderItem
      })

      await this.purchaseOrderItemRepository.save(items)

      const taxAmount = subtotal * (updateDto.taxRate || order.taxRate) / 100
      const discountAmount = updateDto.discountAmount || (subtotal * (updateDto.discountRate || order.discountRate) / 100)
      const totalAmount = subtotal + taxAmount - discountAmount + (updateDto.shippingCost || order.shippingCost)

      updateDto.subtotal = subtotal
      updateDto.taxAmount = taxAmount
      updateDto.discountAmount = discountAmount
      updateDto.totalAmount = totalAmount
    }

    // 從 updateDto 中移除 items，因為 TypeORM 不能在 update 中處理一對多關聯
    const { items, ...updateData } = updateDto
    
    await this.purchaseOrderRepository.update(id, updateData)
    return this.findOne(id)
  }

  async approve(id: number, userId: number): Promise<PurchaseOrder> {
    const order = await this.findOne(id)

    if (order.status !== PurchaseOrderStatus.PENDING) {
      throw new BadRequestException('只能審批待審批狀態的採購單')
    }

    await this.purchaseOrderRepository.update(id, {
      status: PurchaseOrderStatus.APPROVED,
      approvedById: userId,
      approvedAt: new Date(),
    })

    return this.findOne(id)
  }

  async cancel(id: number, cancelDto: CancelOrderDto, userId: number): Promise<PurchaseOrder> {
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
        toStatus: PurchaseOrderStatus.CANCELLED,
        reason: cancelDto.reason,
        operatedAt: new Date(),
        operatedById: userId,
        operatedByName: user?.username || 'Unknown',
        inventoryAction: cancelDto.adjustInventory ? 'deduct' : 'none'
      })

      // 如果選擇調整庫存且已有入庫記錄
      if (cancelDto.adjustInventory) {
        for (const item of order.items) {
          if (item.receivedQuantity > 0) {
            // 記錄庫存異動（負數扣減）
            await this.inventoryService.recordTransaction({
              productId: item.productId,
              type: InventoryTransactionType.ADJUSTMENT_DECREASE,
              quantityChanged: -item.receivedQuantity,
              reason: `取消進貨單 ${order.orderNumber}，扣減庫存。原因：${cancelDto.reason}`,
              createdById: userId,
            })
          }
        }
      }

      // 更新訂單
      await manager.update(PurchaseOrder, id, {
        status: PurchaseOrderStatus.CANCELLED,
        cancelReason: cancelDto.reason,
        cancelledAt: new Date(),
        cancelledById: userId,
        statusHistory,
      })

      return this.findOne(id)
    })
  }

  async revert(id: number, revertDto: RevertOrderDto, userId: number): Promise<PurchaseOrder> {
    const order = await this.findOne(id)

    if (!order.canRevert) {
      throw new BadRequestException('當前狀態不允許退回')
    }

    const targetStatus = order.revertToStatus
    if (!targetStatus) {
      throw new BadRequestException('無法確定退回狀態')
    }

    // 檢查是否有入庫記錄
    if ([
      PurchaseOrderStatus.PROCESSING,
      PurchaseOrderStatus.PARTIALLY_RECEIVED,
      PurchaseOrderStatus.RECEIVED
    ].includes(order.status)) {
      const hasReceivedItems = order.items.some(item => item.receivedQuantity > 0)
      if (hasReceivedItems) {
        throw new BadRequestException(
          '該訂單已有入庫記錄，不能直接退回。請使用「取消」功能並選擇扣減庫存。'
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

      // 清除審批相關欄位（如果從 APPROVED 退回）
      const updateData: any = {
        status: targetStatus,
        statusHistory,
      }

      if (order.status === PurchaseOrderStatus.APPROVED && targetStatus === PurchaseOrderStatus.PENDING) {
        updateData.approvedById = null
        updateData.approvedAt = null
      }

      await manager.update(PurchaseOrder, id, updateData)
      return this.findOne(id)
    })
  }

  async receiveItems(id: number, items: Array<{ itemId: number; receivedQuantity: number }>) {
    const order = await this.findOne(id)

    if (!order.canReceive) {
      throw new BadRequestException('當前狀態不允許接收貨物')
    }

    for (const item of items) {
      const orderItem = order.items.find(i => i.id === item.itemId)
      if (!orderItem) {
        throw new NotFoundException(`訂單明細 ${item.itemId} 不存在`)
      }

      if (orderItem.receivedQuantity + item.receivedQuantity > orderItem.quantity) {
        throw new BadRequestException(`接收數量超過訂購數量`)
      }

      await this.purchaseOrderItemRepository.update(item.itemId, {
        receivedQuantity: orderItem.receivedQuantity + item.receivedQuantity
      })

      // 記錄庫存異動並更新產品庫存
      await this.inventoryService.recordTransaction({
        productId: orderItem.productId,
        type: InventoryTransactionType.PURCHASE_RECEIVE,
        quantityChanged: item.receivedQuantity,
        unitCost: orderItem.unitPrice,
        referenceType: 'purchase_order',
        referenceId: order.id,
        referenceNumber: order.orderNumber,
        reason: `採購單 ${order.orderNumber} 入庫`,
        createdById: order.createdById,
      })
    }

    // 檢查是否全部接收完成
    const updatedOrder = await this.findOne(id)
    const allFullyReceived = updatedOrder.items.every(item => item.isFullyReceived)
    const partiallyReceived = updatedOrder.items.some(item => item.receivedQuantity > 0)

    let newStatus = order.status
    if (allFullyReceived) {
      newStatus = PurchaseOrderStatus.RECEIVED
    } else if (partiallyReceived) {
      newStatus = PurchaseOrderStatus.PARTIALLY_RECEIVED
    }

    if (newStatus !== order.status) {
      await this.purchaseOrderRepository.update(id, { status: newStatus })
    }

    return this.findOne(id)
  }

  async getStatistics() {
    const stats = await this.purchaseOrderRepository
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
   * 獲取月度採購報表
   */
  async getMonthlyPurchaseReport(year: number, month: number, status?: PurchaseOrderStatus) {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999)

    return this.getPurchaseReportByDateRange(
      startDate,
      endDate,
      `${year}年${month}月`,
      status
    )
  }

  /**
   * 獲取日期範圍採購報表
   */
  async getDateRangePurchaseReport(
    startDateStr: string,
    endDateStr: string,
    status?: PurchaseOrderStatus
  ) {
    const startDate = new Date(startDateStr)
    const endDate = new Date(endDateStr + 'T23:59:59.999Z')

    if (startDate > endDate) {
      throw new BadRequestException('開始日期不能晚於結束日期')
    }

    const label = `${startDateStr} 至 ${endDateStr}`
    return this.getPurchaseReportByDateRange(startDate, endDate, label, status)
  }

  /**
   * 核心報表查詢方法（被月度和日期範圍方法共用）
   */
  private async getPurchaseReportByDateRange(
    startDate: Date,
    endDate: Date,
    label: string,
    status?: PurchaseOrderStatus
  ) {
    const baseWhere = 'order.orderDate BETWEEN :startDate AND :endDate'
    const baseParams: any = { startDate, endDate }

    if (status) {
      baseParams.status = status
    }

    // 1. 查詢彙總數據
    const summaryQueryBuilder = this.purchaseOrderRepository
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
      .setParameter('completedStatus', PurchaseOrderStatus.COMPLETED)
      .getRawOne()

    // 2. 查詢每日趨勢數據
    const trendQueryBuilder = this.purchaseOrderRepository
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
    const statusQueryBuilder = this.purchaseOrderRepository
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

    const lastOrder = await this.purchaseOrderRepository.findOne({
      where: {
        orderNumber: Like(`PO${dateStr}%`)
      },
      order: { orderNumber: 'DESC' }
    })

    let sequence = 1
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.slice(-4))
      sequence = lastSequence + 1
    }

    return `PO${dateStr}${sequence.toString().padStart(4, '0')}`
  }
}