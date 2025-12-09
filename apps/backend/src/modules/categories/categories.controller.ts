import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  ParseIntPipe 
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { CategoriesService } from './categories.service'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'
import { UserRole } from '../users/entities/user.entity'

@ApiTags('產品分類')
@Controller('categories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '創建產品分類' })
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    const category = await this.categoriesService.create(createCategoryDto)
    return {
      success: true,
      data: category,
      message: '分類創建成功',
    }
  }

  @Get()
  @ApiOperation({ summary: '獲取所有產品分類' })
  async findAll() {
    const categories = await this.categoriesService.findAll()
    return {
      success: true,
      data: categories,
      message: '獲取分類列表成功',
    }
  }

  @Get('tree')
  @ApiOperation({ summary: '獲取分類樹形結構' })
  async getCategoryTree() {
    const tree = await this.categoriesService.getCategoryTree()
    return {
      success: true,
      data: tree,
      message: '獲取分類樹成功',
    }
  }

  @Get('root')
  @ApiOperation({ summary: '獲取根分類' })
  async findRootCategories() {
    const categories = await this.categoriesService.findRootCategories()
    return {
      success: true,
      data: categories,
      message: '獲取根分類成功',
    }
  }

  @Get(':id')
  @ApiOperation({ summary: '根據 ID 獲取分類' })
  @ApiParam({ name: 'id', description: '分類 ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const category = await this.categoriesService.findById(id)
    return {
      success: true,
      data: category,
      message: '獲取分類詳情成功',
    }
  }

  @Get(':id/children')
  @ApiOperation({ summary: '獲取指定分類的子分類' })
  @ApiParam({ name: 'id', description: '父分類 ID' })
  async findChildren(@Param('id', ParseIntPipe) id: number) {
    const children = await this.categoriesService.findByParentId(id)
    return {
      success: true,
      data: children,
      message: '獲取子分類列表成功',
    }
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '更新產品分類' })
  @ApiParam({ name: 'id', description: '分類 ID' })
  async update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateCategoryDto: UpdateCategoryDto
  ) {
    const category = await this.categoriesService.update(id, updateCategoryDto)
    return {
      success: true,
      data: category,
      message: '分類更新成功',
    }
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '刪除產品分類' })
  @ApiParam({ name: 'id', description: '分類 ID' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.categoriesService.remove(id)
    return {
      success: true,
      message: '分類刪除成功',
    }
  }
}