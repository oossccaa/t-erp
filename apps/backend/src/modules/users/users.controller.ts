import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  Request, 
  ParseIntPipe 
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { UsersService } from './users.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UserRole } from './entities/user.entity'
import { AuthService } from '../../auth/auth.service'

@ApiTags('用戶管理')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '創建用戶（管理員專用）' })
  async create(@Body() createUserDto: CreateUserDto) {
    const hashedPassword = await this.authService.hashPassword(createUserDto.password)
    const user = await this.usersService.create({
      ...createUserDto,
      password: hashedPassword,
    })

    const { password: _, ...userResult } = user
    return {
      success: true,
      data: userResult,
      message: '用戶創建成功',
    }
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '獲取所有用戶（管理員/經理專用）' })
  async findAll() {
    const users = await this.usersService.findAll()
    return {
      success: true,
      data: users,
      message: '獲取用戶列表成功',
    }
  }

  @Get('profile')
  @ApiOperation({ summary: '獲取當前用戶資料' })
  async getProfile(@Request() req) {
    const { password: _, ...userProfile } = req.user
    return {
      success: true,
      data: userProfile,
      message: '獲取用戶資料成功',
    }
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '根據 ID 獲取用戶（管理員/經理專用）' })
  @ApiParam({ name: 'id', description: '用戶 ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findById(id)
    const { password: _, ...userResult } = user
    return {
      success: true,
      data: userResult,
      message: '獲取用戶資料成功',
    }
  }

  @Patch('profile')
  @ApiOperation({ summary: '更新當前用戶資料' })
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    // 普通用戶不能修改自己的角色
    const { role: _, ...allowedUpdates } = updateUserDto
    const user = await this.usersService.update(req.user.id, allowedUpdates)
    const { password: __, ...userResult } = user
    return {
      success: true,
      data: userResult,
      message: '用戶資料更新成功',
    }
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '更新指定用戶（管理員專用）' })
  @ApiParam({ name: 'id', description: '用戶 ID' })
  async update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateUserDto: UpdateUserDto
  ) {
    const user = await this.usersService.update(id, updateUserDto)
    const { password: _, ...userResult } = user
    return {
      success: true,
      data: userResult,
      message: '用戶資料更新成功',
    }
  }

  @Patch(':id/toggle-status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '切換用戶啟用狀態（管理員專用）' })
  @ApiParam({ name: 'id', description: '用戶 ID' })
  async toggleStatus(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.toggleStatus(id)
    const { password: _, ...userResult } = user
    return {
      success: true,
      data: userResult,
      message: `用戶已${user.isActive ? '啟用' : '禁用'}`,
    }
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '刪除用戶（軟刪除，管理員專用）' })
  @ApiParam({ name: 'id', description: '用戶 ID' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.usersService.remove(id)
    return {
      success: true,
      message: '用戶刪除成功',
    }
  }
}