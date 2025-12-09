import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { UsersService } from '../modules/users/users.service'
import { User } from '../modules/users/entities/user.entity'
import { RegisterDto } from './dto/register.dto'

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.findByUsername(username)
    if (user && await bcrypt.compare(password, user.password)) {
      const { password: _, ...result } = user
      return result
    }
    return null
  }

  async register(registerDto: RegisterDto) {
    const { username, email, password } = registerDto

    // 檢查用戶名是否已存在
    const existingUser = await this.usersService.findByUsername(username)
    if (existingUser) {
      throw new ConflictException('用戶名已存在')
    }

    // 檢查郵箱是否已存在
    const existingEmail = await this.usersService.findByEmail(email)
    if (existingEmail) {
      throw new ConflictException('電子郵件已被使用')
    }

    // 創建新用戶
    const hashedPassword = await this.hashPassword(password)
    const newUser = await this.usersService.create({
      username,
      email,
      password: hashedPassword,
    })

    const { password: _, ...userResult } = newUser
    return {
      success: true,
      data: userResult,
      message: '註冊成功',
    }
  }

  async login(user: User) {
    if (!user.isActive) {
      throw new UnauthorizedException('帳戶已被禁用，請聯繫管理員')
    }

    const payload = { 
      username: user.username, 
      sub: user.id, 
      role: user.role 
    }
    return {
      success: true,
      data: {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
      message: '登入成功',
    }
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    const user = await this.usersService.findById(userId)
    if (!user) {
      throw new UnauthorizedException('用戶不存在')
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password)
    if (!isOldPasswordValid) {
      throw new BadRequestException('舊密碼不正確')
    }

    const hashedNewPassword = await this.hashPassword(newPassword)
    await this.usersService.updatePassword(userId, hashedNewPassword)

    return {
      success: true,
      message: '密碼修改成功',
    }
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10
    return bcrypt.hash(password, saltRounds)
  }

  async validateToken(payload: any): Promise<User> {
    const user = await this.usersService.findById(payload.sub)
    if (!user || !user.isActive) {
      throw new UnauthorizedException('用戶不存在或已被禁用')
    }
    return user
  }
}