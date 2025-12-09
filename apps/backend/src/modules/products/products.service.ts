import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Like } from 'typeorm'
import { Product } from './entities/product.entity'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { QueryProductDto } from './dto/query-product.dto'

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const { sku, name, description, categoryId, unitPrice, costPrice, stockQuantity, minStockLevel } = createProductDto

    // 檢查 SKU 是否已存在
    const existingProduct = await this.findBySku(sku)
    if (existingProduct) {
      throw new ConflictException('商品編號已存在')
    }

    const product = this.productsRepository.create({
      sku,
      name,
      description,
      categoryId,
      unitPrice,
      costPrice,
      stockQuantity,
      minStockLevel,
    })

    return this.productsRepository.save(product)
  }

  async findAll(queryDto: QueryProductDto = {}): Promise<{ 
    items: Product[], 
    total: number, 
    page: number, 
    limit: number,
    totalPages: number 
  }> {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      categoryId, 
      isActive, 
      lowStock, 
      sortBy = 'createdAt', 
      sortOrder = 'DESC' 
    } = queryDto

    const queryBuilder = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')

    // 搜索條件
    if (search) {
      queryBuilder.andWhere(
        '(product.name LIKE :search OR product.sku LIKE :search)',
        { search: `%${search}%` }
      )
    }

    // 分類篩選
    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId })
    }

    // 啟用狀態篩選
    if (isActive !== undefined) {
      queryBuilder.andWhere('product.isActive = :isActive', { isActive })
    }

    // 低庫存篩選
    if (lowStock) {
      queryBuilder.andWhere('product.stockQuantity <= product.minStockLevel')
    }

    // 排序
    const allowedSortFields = ['name', 'sku', 'unitPrice', 'costPrice', 'stockQuantity', 'createdAt', 'updatedAt']
    if (allowedSortFields.includes(sortBy)) {
      queryBuilder.orderBy(`product.${sortBy}`, sortOrder)
    } else {
      queryBuilder.orderBy('product.createdAt', 'DESC')
    }

    // 分頁
    const skip = (page - 1) * limit
    queryBuilder.skip(skip).take(limit)

    const [items, total] = await queryBuilder.getManyAndCount()
    const totalPages = Math.ceil(total / limit)

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    }
  }

  async findById(id: number): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['category'],
    })
    if (!product) {
      throw new NotFoundException(`產品 ID ${id} 不存在`)
    }
    return product
  }

  async findBySku(sku: string): Promise<Product | null> {
    return this.productsRepository.findOne({
      where: { sku },
      relations: ['category'],
    })
  }

  async findByCategory(categoryId: number): Promise<Product[]> {
    return this.productsRepository.find({
      where: { categoryId },
      relations: ['category'],
    })
  }

  async findLowStockProducts(): Promise<Product[]> {
    return this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.stockQuantity <= product.minStockLevel')
      .andWhere('product.isActive = :isActive', { isActive: true })
      .getMany()
  }

  async update(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findById(id)

    await this.productsRepository.update(id, updateProductDto)
    return this.findById(id)
  }

  async updateStock(id: number, quantity: number, operation: 'add' | 'subtract'): Promise<Product> {
    const product = await this.findById(id)
    
    let newQuantity: number
    if (operation === 'add') {
      newQuantity = product.stockQuantity + quantity
    } else {
      newQuantity = product.stockQuantity - quantity
      if (newQuantity < 0) {
        throw new ConflictException('庫存不足')
      }
    }

    await this.productsRepository.update(id, { stockQuantity: newQuantity })
    return this.findById(id)
  }

  async remove(id: number): Promise<void> {
    const product = await this.findById(id)
    await this.productsRepository.softRemove(product)
  }

  async getProductStats(): Promise<{
    totalProducts: number
    activeProducts: number
    lowStockProducts: number
    totalValue: number
  }> {
    const totalProducts = await this.productsRepository.count()
    const activeProducts = await this.productsRepository.count({
      where: { isActive: true }
    })
    
    const lowStockProducts = await this.productsRepository
      .createQueryBuilder('product')
      .where('product.stockQuantity <= product.minStockLevel')
      .andWhere('product.isActive = :isActive', { isActive: true })
      .getCount()

    const valueResult = await this.productsRepository
      .createQueryBuilder('product')
      .select('SUM(product.stockQuantity * product.costPrice)', 'totalValue')
      .where('product.isActive = :isActive', { isActive: true })
      .getRawOne()

    return {
      totalProducts,
      activeProducts,
      lowStockProducts,
      totalValue: parseFloat(valueResult?.totalValue) || 0,
    }
  }
}