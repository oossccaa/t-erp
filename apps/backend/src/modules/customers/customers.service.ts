import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Like } from 'typeorm'
import { Customer } from './entities/customer.entity'
import { CreateCustomerDto } from './dto/create-customer.dto'
import { UpdateCustomerDto } from './dto/update-customer.dto'

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const customer = this.customersRepository.create(createCustomerDto)
    return this.customersRepository.save(customer)
  }

  async findAll(search?: string): Promise<Customer[]> {
    if (search) {
      return this.customersRepository.find({
        where: [
          { name: Like(`%${search}%`) },
          { contactPerson: Like(`%${search}%`) },
          { email: Like(`%${search}%`) },
        ],
        order: { createdAt: 'DESC' },
      })
    }
    
    return this.customersRepository.find({
      order: { createdAt: 'DESC' },
    })
  }

  async findById(id: number): Promise<Customer> {
    const customer = await this.customersRepository.findOne({ where: { id } })
    if (!customer) {
      throw new NotFoundException(`客戶 ID ${id} 不存在`)
    }
    return customer
  }

  async findActive(): Promise<Customer[]> {
    return this.customersRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    })
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    await this.findById(id) // 確保客戶存在
    await this.customersRepository.update(id, updateCustomerDto)
    return this.findById(id)
  }

  async toggleStatus(id: number): Promise<Customer> {
    const customer = await this.findById(id)
    customer.isActive = !customer.isActive
    return this.customersRepository.save(customer)
  }

  async remove(id: number): Promise<void> {
    const customer = await this.findById(id)
    await this.customersRepository.softRemove(customer)
  }

  async getCustomerStats(): Promise<{
    totalCustomers: number
    activeCustomers: number
  }> {
    const totalCustomers = await this.customersRepository.count()
    const activeCustomers = await this.customersRepository.count({
      where: { isActive: true }
    })

    return {
      totalCustomers,
      activeCustomers,
    }
  }
}