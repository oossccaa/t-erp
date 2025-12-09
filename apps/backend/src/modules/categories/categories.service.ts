import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Category } from './entities/category.entity'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const { name, description, parentId } = createCategoryDto

    // 檢查父分類是否存在
    if (parentId) {
      const parentCategory = await this.findById(parentId)
      if (!parentCategory) {
        throw new NotFoundException(`父分類 ID ${parentId} 不存在`)
      }
    }

    // 檢查同層級下分類名稱是否重複
    const existingCategory = await this.categoriesRepository.findOne({
      where: { name, parentId: parentId || null },
    })
    if (existingCategory) {
      throw new BadRequestException('同層級下分類名稱已存在')
    }

    const category = this.categoriesRepository.create({
      name,
      description,
      parentId,
    })

    return this.categoriesRepository.save(category)
  }

  async findAll(): Promise<Category[]> {
    return this.categoriesRepository.find({
      relations: ['parent', 'children'],
      order: { id: 'ASC' },
    })
  }

  async findById(id: number): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
    })
    if (!category) {
      throw new NotFoundException(`分類 ID ${id} 不存在`)
    }
    return category
  }

  async findRootCategories(): Promise<Category[]> {
    return this.categoriesRepository.find({
      where: { parentId: null },
      relations: ['children'],
      order: { id: 'ASC' },
    })
  }

  async findByParentId(parentId: number): Promise<Category[]> {
    return this.categoriesRepository.find({
      where: { parentId },
      relations: ['children'],
      order: { id: 'ASC' },
    })
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findById(id)
    const { name, description, parentId } = updateCategoryDto

    // 檢查父分類是否存在
    if (parentId && parentId !== category.parentId) {
      const parentCategory = await this.findById(parentId)
      if (!parentCategory) {
        throw new NotFoundException(`父分類 ID ${parentId} 不存在`)
      }

      // 檢查是否會造成循環引用
      if (await this.wouldCreateCycle(id, parentId)) {
        throw new BadRequestException('不能將分類設為其子分類的子分類')
      }
    }

    // 檢查同層級下分類名稱是否重複
    if (name && name !== category.name) {
      const existingCategory = await this.categoriesRepository.findOne({
        where: { 
          name, 
          parentId: parentId !== undefined ? parentId : category.parentId 
        },
      })
      if (existingCategory && existingCategory.id !== id) {
        throw new BadRequestException('同層級下分類名稱已存在')
      }
    }

    await this.categoriesRepository.update(id, updateCategoryDto)
    return this.findById(id)
  }

  async remove(id: number): Promise<void> {
    const category = await this.findById(id)
    
    // 檢查是否有子分類
    const childrenCount = await this.categoriesRepository.count({
      where: { parentId: id },
    })
    if (childrenCount > 0) {
      throw new BadRequestException('請先刪除所有子分類')
    }

    // 這裡應該檢查是否有產品使用此分類，但產品模組還未完成，先跳過

    await this.categoriesRepository.softRemove(category)
  }

  private async wouldCreateCycle(categoryId: number, newParentId: number): Promise<boolean> {
    // 檢查新父分類的所有上級分類中是否包含當前分類
    let currentParentId = newParentId
    while (currentParentId) {
      if (currentParentId === categoryId) {
        return true
      }
      const parentCategory = await this.categoriesRepository.findOne({
        where: { id: currentParentId },
      })
      currentParentId = parentCategory?.parentId || null
    }
    return false
  }

  async getCategoryTree(): Promise<Category[]> {
    const allCategories = await this.findAll()
    return this.buildTree(allCategories)
  }

  private buildTree(categories: Category[]): Category[] {
    const categoryMap = new Map<number, Category>()
    const rootCategories: Category[] = []

    // 創建分類映射
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] })
    })

    // 構建樹形結構
    categories.forEach(category => {
      const categoryNode = categoryMap.get(category.id)!
      
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId)
        if (parent) {
          parent.children.push(categoryNode)
        }
      } else {
        rootCategories.push(categoryNode)
      }
    })

    return rootCategories
  }
}