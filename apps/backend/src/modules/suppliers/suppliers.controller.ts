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
import { SuppliersService } from './suppliers.service'
import { CreateSupplierDto } from './dto/create-supplier.dto'
import { UpdateSupplierDto } from './dto/update-supplier.dto'
import { UserRole } from '../users/entities/user.entity'

@ApiTags('供應商管理')
@Controller('suppliers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '創建供應商' })
  async create(@Body() createSupplierDto: CreateSupplierDto) {
    const supplier = await this.suppliersService.create(createSupplierDto)
    return {
      success: true,
      data: supplier,
      message: '供應商創建成功',
    }
  }

  @Get()
  @ApiOperation({ summary: '獲取供應商列表' })
  @ApiQuery({ name: 'search', description: '搜索關鍵詞', required: false })
  async findAll(@Query('search') search?: string) {
    const suppliers = await this.suppliersService.findAll(search)
    return {
      success: true,
      data: suppliers,
      message: '獲取供應商列表成功',
    }
  }

  @Get('active')
  @ApiOperation({ summary: '獲取啟用的供應商列表' })
  async findActive() {
    const suppliers = await this.suppliersService.findActive()
    return {
      success: true,
      data: suppliers,
      message: '獲取啟用供應商列表成功',
    }
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '獲取供應商統計信息' })
  async getStats() {
    const stats = await this.suppliersService.getSupplierStats()
    return {
      success: true,
      data: stats,
      message: '獲取供應商統計成功',
    }
  }

  @Get(':id')
  @ApiOperation({ summary: '根據 ID 獲取供應商詳情' })
  @ApiParam({ name: 'id', description: '供應商 ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const supplier = await this.suppliersService.findById(id)
    return {
      success: true,
      data: supplier,
      message: '獲取供應商詳情成功',
    }
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '更新供應商信息' })
  @ApiParam({ name: 'id', description: '供應商 ID' })
  async update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateSupplierDto: UpdateSupplierDto
  ) {
    const supplier = await this.suppliersService.update(id, updateSupplierDto)
    return {
      success: true,
      data: supplier,
      message: '供應商更新成功',
    }
  }

  @Patch(':id/toggle-status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '切換供應商啟用狀態' })
  @ApiParam({ name: 'id', description: '供應商 ID' })
  async toggleStatus(@Param('id', ParseIntPipe) id: number) {
    const supplier = await this.suppliersService.toggleStatus(id)
    return {
      success: true,
      data: supplier,
      message: `供應商已${supplier.isActive ? '啟用' : '禁用'}`,
    }
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '刪除供應商' })
  @ApiParam({ name: 'id', description: '供應商 ID' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.suppliersService.remove(id)
    return {
      success: true,
      message: '供應商刪除成功',
    }
  }
}