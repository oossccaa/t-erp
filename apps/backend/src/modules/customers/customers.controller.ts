import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  UseGuards, 
  ParseIntPipe 
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { CustomersService } from './customers.service'
import { CreateCustomerDto } from './dto/create-customer.dto'
import { UpdateCustomerDto } from './dto/update-customer.dto'
import { UserRole } from '../users/entities/user.entity'

@ApiTags('客戶管理')
@Controller('customers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '創建客戶' })
  async create(@Body() createCustomerDto: CreateCustomerDto) {
    const customer = await this.customersService.create(createCustomerDto)
    return {
      success: true,
      data: customer,
      message: '客戶創建成功',
    }
  }

  @Get()
  @ApiOperation({ summary: '獲取客戶列表' })
  @ApiQuery({ name: 'search', description: '搜索關鍵詞', required: false })
  async findAll(@Query('search') search?: string) {
    const customers = await this.customersService.findAll(search)
    return {
      success: true,
      data: customers,
      message: '獲取客戶列表成功',
    }
  }

  @Get('active')
  @ApiOperation({ summary: '獲取啟用的客戶列表' })
  async findActive() {
    const customers = await this.customersService.findActive()
    return {
      success: true,
      data: customers,
      message: '獲取啟用客戶列表成功',
    }
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '獲取客戶統計信息' })
  async getStats() {
    const stats = await this.customersService.getCustomerStats()
    return {
      success: true,
      data: stats,
      message: '獲取客戶統計成功',
    }
  }

  @Get(':id')
  @ApiOperation({ summary: '根據 ID 獲取客戶詳情' })
  @ApiParam({ name: 'id', description: '客戶 ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const customer = await this.customersService.findById(id)
    return {
      success: true,
      data: customer,
      message: '獲取客戶詳情成功',
    }
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '更新客戶信息' })
  @ApiParam({ name: 'id', description: '客戶 ID' })
  async update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateCustomerDto: UpdateCustomerDto
  ) {
    const customer = await this.customersService.update(id, updateCustomerDto)
    return {
      success: true,
      data: customer,
      message: '客戶更新成功',
    }
  }

  @Patch(':id/toggle-status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '切換客戶啟用狀態' })
  @ApiParam({ name: 'id', description: '客戶 ID' })
  async toggleStatus(@Param('id', ParseIntPipe) id: number) {
    const customer = await this.customersService.toggleStatus(id)
    return {
      success: true,
      data: customer,
      message: `客戶已${customer.isActive ? '啟用' : '禁用'}`,
    }
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '刪除客戶' })
  @ApiParam({ name: 'id', description: '客戶 ID' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.customersService.remove(id)
    return {
      success: true,
      message: '客戶刪除成功',
    }
  }
}