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
      keyword,
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
    if (keyword) {
      queryBuilder.andWhere(
        '(product.name LIKE :keyword OR product.sku LIKE :keyword)',
        { keyword: `%${keyword}%` }
      )
    }

    // 分類篩選（若為主分類，需一併包含所有子孫分類）
    if (categoryId) {
      const categoryIds = await this.getCategoryDescendantIds(categoryId)
      queryBuilder.andWhere('product.categoryId IN (:...categoryIds)', { categoryIds })
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
    const categoryIds = await this.getCategoryDescendantIds(categoryId)
    return this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.categoryId IN (:...categoryIds)', { categoryIds })
      .getMany()
  }

  private async getCategoryDescendantIds(rootId: number): Promise<number[]> {
    const rows: Array<{ id: number }> = await this.productsRepository.query(
      `WITH RECURSIVE category_tree AS (
         SELECT id FROM categories WHERE id = $1
         UNION ALL
         SELECT c.id FROM categories c
         INNER JOIN category_tree ct ON c.parent_id = ct.id
       )
       SELECT id FROM category_tree`,
      [rootId],
    )
    return rows.length > 0 ? rows.map((r) => r.id) : [rootId]
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

  async batchRemove(ids: number[]): Promise<void> {
    // 批次獲取產品
    const products = await this.productsRepository.findByIds(ids)

    if (products.length === 0) {
      throw new NotFoundException('找不到要刪除的產品')
    }

    // 批次軟刪除
    await this.productsRepository.softRemove(products)
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