import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Between, Like, In } from 'typeorm'
import { PurchaseOrder, PurchaseOrderStatus, PaymentStatus } from './entities/purchase-order.entity'
import { PurchaseOrderItem } from './entities/purchase-order-item.entity'
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto'
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto'
import { QueryPurchaseOrderDto } from './dto/query-order.dto'
import { Product } from '../products/entities/product.entity'
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
    private inventoryService: InventoryService,
    private approvalService: ApprovalService,
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

    const orders = await queryBuilder.getMany()

    return {
      data: orders,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit)
      }
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

    await this.purchaseOrderRepository.update(id, updateDto)
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

  async cancel(id: number): Promise<PurchaseOrder> {
    const order = await this.findOne(id)

    if (!order.canCancel) {
      throw new BadRequestException('當前狀態不允許取消')
    }

    await this.purchaseOrderRepository.update(id, {
      status: PurchaseOrderStatus.CANCELLED
    })

    return this.findOne(id)
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