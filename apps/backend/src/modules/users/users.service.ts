import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './entities/user.entity'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>
  ) {}

  async create(createUserDto: CreateUserDto & { password: string }): Promise<User> {
    const { username, email, password, role } = createUserDto

    // 檢查用戶名是否已存在
    const existingUser = await this.findByUsername(username)
    if (existingUser) {
      throw new ConflictException('用戶名已存在')
    }

    // 檢查郵箱是否已存在
    const existingEmail = await this.findByEmail(email)
    if (existingEmail) {
      throw new ConflictException('電子郵件已被使用')
    }

    const user = this.usersRepository.create({
      username,
      email,
      password,
      role,
    })

    return this.usersRepository.save(user)
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      select: ['id', 'username', 'email', 'role', 'isActive', 'createdAt', 'updatedAt'],
    })
  }

  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } })
    if (!user) {
      throw new NotFoundException(`用戶 ID ${id} 不存在`)
    }
    return user
  }

  async findByUsername(username: string): Promise<User> {
    return this.usersRepository.findOne({ where: { username } })
  }

  async findByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({ where: { email } })
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id)

    // 檢查用戶名是否已被其他用戶使用
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUser = await this.findByUsername(updateUserDto.username)
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('用戶名已存在')
      }
    }

    // 檢查郵箱是否已被其他用戶使用
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingEmail = await this.findByEmail(updateUserDto.email)
      if (existingEmail && existingEmail.id !== id) {
        throw new ConflictException('電子郵件已被使用')
      }
    }

    await this.usersRepository.update(id, updateUserDto)
    return this.findById(id)
  }

  async updatePassword(id: number, hashedPassword: string): Promise<void> {
    await this.usersRepository.update(id, { password: hashedPassword })
  }

  async remove(id: number): Promise<void> {
    const user = await this.findById(id)
    await this.usersRepository.softRemove(user)
  }

  async toggleStatus(id: number): Promise<User> {
    const user = await this.findById(id)
    user.isActive = !user.isActive
    return this.usersRepository.save(user)
  }
}