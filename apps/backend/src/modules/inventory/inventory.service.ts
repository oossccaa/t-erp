import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Between, Like } from 'typeorm'
import { InventoryTransaction, InventoryTransactionType } from './entities/inventory-transaction.entity'
import { InventoryAdjustment, InventoryAdjustmentStatus } from './entities/inventory-adjustment.entity'
import { InventoryAdjustmentItem } from './entities/inventory-adjustment-item.entity'
import { Product } from '../products/entities/product.entity'

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryTransaction)
    private transactionRepository: Repository<InventoryTransaction>,
    @InjectRepository(InventoryAdjustment)
    private adjustmentRepository: Repository<InventoryAdjustment>,
    @InjectRepository(InventoryAdjustmentItem)
    private adjustmentItemRepository: Repository<InventoryAdjustmentItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  // 記錄庫存異動
  async recordTransaction(data: {
    productId: number
    type: InventoryTransactionType
    quantityChanged: number
    unitCost?: number
    batchNumber?: string
    expiryDate?: Date
    warehouse?: string
    location?: string
    referenceType?: string
    referenceId?: number
    referenceNumber?: string
    reason?: string
    notes?: string
    createdById?: number
  }): Promise<InventoryTransaction> {
    const product = await this.productRepository.findOne({ where: { id: data.productId } })
    if (!product) {
      throw new NotFoundException('產品不存在')
    }

    const quantityBefore = product.stockQuantity
    const quantityAfter = quantityBefore + data.quantityChanged

    if (quantityAfter < 0) {
      throw new BadRequestException('庫存不足，無法執行此操作')
    }

    // 創建庫存異動記錄
    const transaction = this.transactionRepository.create({
      ...data,
      quantityBefore,
      quantityAfter,
      totalCost: data.unitCost ? data.quantityChanged * data.unitCost : null,
      transactionDate: new Date(),
    })

    await this.transactionRepository.save(transaction)

    // 更新產品庫存
    await this.productRepository.update(data.productId, {
      stockQuantity: quantityAfter,
      updatedAt: new Date(),
    })

    return transaction
  }

  // 獲取產品庫存異動記錄
  async getProductTransactions(productId: number, query?: {
    startDate?: string
    endDate?: string
    type?: InventoryTransactionType
    page?: number
    limit?: number
  }) {
    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.product', 'product')
      .leftJoinAndSelect('transaction.createdBy', 'createdBy')
      .where('transaction.productId = :productId', { productId })

    if (query?.type) {
      queryBuilder.andWhere('transaction.type = :type', { type: query.type })
    }

    if (query?.startDate && query?.endDate) {
      queryBuilder.andWhere('transaction.transactionDate BETWEEN :startDate AND :endDate', {
        startDate: query.startDate,
        endDate: query.endDate
      })
    }

    const page = query?.page || 1
    const limit = query?.limit || 20
    const total = await queryBuilder.getCount()

    const transactions = await queryBuilder
      .orderBy('transaction.transactionDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany()

    return {
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  // 獲取庫存統計
  async getInventoryStats(query?: {
    warehouse?: string
    categoryId?: number
    lowStockOnly?: boolean
  }) {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .select([
        'product.id',
        'product.name',
        'product.sku',
        'product.stockQuantity',
        'product.minStockLevel',
        'product.unitCost',
        'category.name'
      ])

    if (query?.categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId: query.categoryId })
    }

    if (query?.lowStockOnly) {
      queryBuilder.andWhere('product.stockQuantity <= product.minStockLevel')
    }

    const products = await queryBuilder.getMany()

    const totalProducts = products.length
    const totalInventoryValue = products.reduce((sum, product) => 
      sum + (product.stockQuantity * (product.unitCost || 0)), 0
    )
    const lowStockProducts = products.filter(product => 
      product.stockQuantity <= product.minStockLevel
    ).length
    const outOfStockProducts = products.filter(product => 
      product.stockQuantity === 0
    ).length

    return {
      overview: {
        totalProducts,
        totalInventoryValue,
        lowStockProducts,
        outOfStockProducts,
      },
      products: query?.lowStockOnly ? products.filter(p => p.stockQuantity <= p.minStockLevel) : products
    }
  }

  // 創建庫存調整單
  async createAdjustment(data: {
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
  }, userId: number): Promise<InventoryAdjustment> {
    // 驗證產品是否存在
    const productIds = data.items.map(item => item.productId)
    const products = await this.productRepository.findByIds(productIds)
    if (products.length !== productIds.length) {
      throw new BadRequestException('部分產品不存在')
    }

    // 生成調整單號
    const adjustmentNumber = await this.generateAdjustmentNumber()

    const items = data.items.map(item => {
      const product = products.find(p => p.id === item.productId)
      const adjustmentQuantity = item.actualQuantity - item.systemQuantity

      const adjustmentItem = new InventoryAdjustmentItem()
      adjustmentItem.productId = item.productId
      adjustmentItem.productName = product.name
      adjustmentItem.productSku = product.sku
      adjustmentItem.systemQuantity = item.systemQuantity
      adjustmentItem.actualQuantity = item.actualQuantity
      adjustmentItem.adjustmentQuantity = adjustmentQuantity
      adjustmentItem.unitCost = item.unitCost || product.unitCost
      adjustmentItem.batchNumber = item.batchNumber
      adjustmentItem.expiryDate = item.expiryDate ? new Date(item.expiryDate) : null
      adjustmentItem.location = item.location
      adjustmentItem.reason = item.reason
      adjustmentItem.notes = item.notes
      
      return adjustmentItem
    })

    const adjustment = this.adjustmentRepository.create({
      adjustmentNumber,
      type: data.type as any, // 強制轉換類型
      adjustmentDate: new Date(data.adjustmentDate),
      createdById: userId,
      warehouse: data.warehouse,
      reason: data.reason,
      notes: data.notes,
      items,
    })

    return this.adjustmentRepository.save(adjustment)
  }

  // 審批調整單
  async approveAdjustment(id: number, userId: number): Promise<InventoryAdjustment> {
    const adjustment = await this.adjustmentRepository.findOne({
      where: { id },
      relations: ['items', 'items.product']
    })

    if (!adjustment) {
      throw new NotFoundException('調整單不存在')
    }

    if (!adjustment.canApprove) {
      throw new BadRequestException('調整單狀態不允許審批')
    }

    // 執行庫存調整
    for (const item of adjustment.items) {
      if (item.adjustmentQuantity !== 0) {
        const transactionType = item.adjustmentQuantity > 0 
          ? InventoryTransactionType.ADJUSTMENT_INCREASE 
          : InventoryTransactionType.ADJUSTMENT_DECREASE

        await this.recordTransaction({
          productId: item.productId,
          type: transactionType,
          quantityChanged: item.adjustmentQuantity,
          unitCost: item.unitCost,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate,
          warehouse: adjustment.warehouse,
          location: item.location,
          referenceType: 'adjustment',
          referenceId: adjustment.id,
          referenceNumber: adjustment.adjustmentNumber,
          reason: item.reason || adjustment.reason,
          notes: item.notes,
          createdById: userId,
        })
      }
    }

    await this.adjustmentRepository.update(id, {
      status: InventoryAdjustmentStatus.COMPLETED,
      approvedById: userId,
      approvedAt: new Date(),
    })

    return this.adjustmentRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'createdBy', 'approvedBy']
    })
  }

  // 獲取調整單列表
  async getAdjustments(query?: {
    status?: InventoryAdjustmentStatus
    type?: string
    startDate?: string
    endDate?: string
    page?: number
    limit?: number
  }) {
    const queryBuilder = this.adjustmentRepository
      .createQueryBuilder('adjustment')
      .leftJoinAndSelect('adjustment.createdBy', 'createdBy')
      .leftJoinAndSelect('adjustment.approvedBy', 'approvedBy')
      .leftJoinAndSelect('adjustment.items', 'items')
      .leftJoinAndSelect('items.product', 'product')

    if (query?.status) {
      queryBuilder.andWhere('adjustment.status = :status', { status: query.status })
    }

    if (query?.type) {
      queryBuilder.andWhere('adjustment.type = :type', { type: query.type })
    }

    if (query?.startDate && query?.endDate) {
      queryBuilder.andWhere('adjustment.adjustmentDate BETWEEN :startDate AND :endDate', {
        startDate: query.startDate,
        endDate: query.endDate
      })
    }

    const page = query?.page || 1
    const limit = query?.limit || 10
    const total = await queryBuilder.getCount()

    const adjustments = await queryBuilder
      .orderBy('adjustment.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany()

    return {
      data: adjustments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  private async generateAdjustmentNumber(): Promise<string> {
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    
    const lastAdjustment = await this.adjustmentRepository.findOne({
      where: {
        adjustmentNumber: Like(`ADJ${dateStr}%`)
      },
      order: { adjustmentNumber: 'DESC' }
    })

    let sequence = 1
    if (lastAdjustment) {
      const lastSequence = parseInt(lastAdjustment.adjustmentNumber.slice(-4))
      sequence = lastSequence + 1
    }

    return `ADJ${dateStr}${sequence.toString().padStart(4, '0')}`
  }
}