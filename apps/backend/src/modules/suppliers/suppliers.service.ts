import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Like } from 'typeorm'
import { Supplier } from './entities/supplier.entity'
import { CreateSupplierDto } from './dto/create-supplier.dto'
import { UpdateSupplierDto } from './dto/update-supplier.dto'

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private suppliersRepository: Repository<Supplier>
  ) {}

  async create(createSupplierDto: CreateSupplierDto): Promise<Supplier> {
    const supplier = this.suppliersRepository.create(createSupplierDto)
    return this.suppliersRepository.save(supplier)
  }

  async findAll(search?: string): Promise<Supplier[]> {
    if (search) {
      return this.suppliersRepository.find({
        where: [
          { name: Like(`%${search}%`) },
          { contactPerson: Like(`%${search}%`) },
          { email: Like(`%${search}%`) },
        ],
        order: { createdAt: 'DESC' },
      })
    }
    
    return this.suppliersRepository.find({
      order: { createdAt: 'DESC' },
    })
  }

  async findById(id: number): Promise<Supplier> {
    const supplier = await this.suppliersRepository.findOne({ where: { id } })
    if (!supplier) {
      throw new NotFoundException(`供應商 ID ${id} 不存在`)
    }
    return supplier
  }

  async findActive(): Promise<Supplier[]> {
    return this.suppliersRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    })
  }

  async update(id: number, updateSupplierDto: UpdateSupplierDto): Promise<Supplier> {
    await this.findById(id) // 確保供應商存在
    await this.suppliersRepository.update(id, updateSupplierDto)
    return this.findById(id)
  }

  async toggleStatus(id: number): Promise<Supplier> {
    const supplier = await this.findById(id)
    supplier.isActive = !supplier.isActive
    return this.suppliersRepository.save(supplier)
  }

  async remove(id: number): Promise<void> {
    const supplier = await this.findById(id)
    await this.suppliersRepository.softRemove(supplier)
  }

  async getSupplierStats(): Promise<{
    totalSuppliers: number
    activeSuppliers: number
  }> {
    const totalSuppliers = await this.suppliersRepository.count()
    const activeSuppliers = await this.suppliersRepository.count({
      where: { isActive: true }
    })

    return {
      totalSuppliers,
      activeSuppliers,
    }
  }
}