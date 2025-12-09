import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Like } from 'typeorm'
import { SaleOrder, SaleOrderStatus, PaymentStatus, ShippingStatus } from './entities/sale-order.entity'
import { SaleOrderItem } from './entities/sale-order-item.entity'
import { CreateSaleOrderDto } from './dto/create-sale-order.dto'
import { UpdateSaleOrderDto } from './dto/update-sale-order.dto'
import { QuerySaleOrderDto } from './dto/query-order.dto'
import { Product } from '../products/entities/product.entity'
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
    private inventoryService: InventoryService,
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

    if (query.search) {
      queryBuilder.andWhere(
        '(order.orderNumber LIKE :search OR customer.name LIKE :search OR customer.contactPerson LIKE :search)',
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

    if (order.status !== SaleOrderStatus.DRAFT) {
      throw new BadRequestException('只能修改草稿狀態的銷售單')
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

    await this.saleOrderRepository.update(id, updateDto)
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

  async cancel(id: number): Promise<SaleOrder> {
    const order = await this.findOne(id)

    if (!order.canCancel) {
      throw new BadRequestException('當前狀態不允許取消')
    }

    await this.saleOrderRepository.update(id, {
      status: SaleOrderStatus.CANCELLED
    })

    return this.findOne(id)
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