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
import { ProductsService } from './products.service'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { QueryProductDto } from './dto/query-product.dto'
import { UserRole } from '../users/entities/user.entity'

@ApiTags('產品管理')
@Controller('products')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '創建產品' })
  async create(@Body() createProductDto: CreateProductDto) {
    const product = await this.productsService.create(createProductDto)
    return {
      success: true,
      data: product,
      message: '產品創建成功',
    }
  }

  @Get()
  @ApiOperation({ summary: '獲取產品列表（支持分頁和篩選）' })
  async findAll(@Query() queryDto: QueryProductDto) {
    const result = await this.productsService.findAll(queryDto)
    return {
      success: true,
      data: result,
      message: '獲取產品列表成功',
    }
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '獲取產品統計信息' })
  async getStats() {
    const stats = await this.productsService.getProductStats()
    return {
      success: true,
      data: stats,
      message: '獲取產品統計成功',
    }
  }

  @Get('low-stock')
  @ApiOperation({ summary: '獲取低庫存產品列表' })
  async findLowStockProducts() {
    const products = await this.productsService.findLowStockProducts()
    return {
      success: true,
      data: products,
      message: '獲取低庫存產品列表成功',
    }
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: '根據分類獲取產品' })
  @ApiParam({ name: 'categoryId', description: '分類 ID' })
  async findByCategory(@Param('categoryId', ParseIntPipe) categoryId: number) {
    const products = await this.productsService.findByCategory(categoryId)
    return {
      success: true,
      data: products,
      message: '獲取分類產品列表成功',
    }
  }

  @Get('sku/:sku')
  @ApiOperation({ summary: '根據 SKU 獲取產品' })
  @ApiParam({ name: 'sku', description: '產品 SKU' })
  async findBySku(@Param('sku') sku: string) {
    const product = await this.productsService.findBySku(sku)
    if (!product) {
      return {
        success: false,
        message: '產品不存在',
      }
    }
    return {
      success: true,
      data: product,
      message: '獲取產品詳情成功',
    }
  }

  @Get(':id')
  @ApiOperation({ summary: '根據 ID 獲取產品詳情' })
  @ApiParam({ name: 'id', description: '產品 ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const product = await this.productsService.findById(id)
    return {
      success: true,
      data: product,
      message: '獲取產品詳情成功',
    }
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '更新產品信息' })
  @ApiParam({ name: 'id', description: '產品 ID' })
  async update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateProductDto: UpdateProductDto
  ) {
    const product = await this.productsService.update(id, updateProductDto)
    return {
      success: true,
      data: product,
      message: '產品更新成功',
    }
  }

  @Patch(':id/stock')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '調整產品庫存' })
  @ApiParam({ name: 'id', description: '產品 ID' })
  async updateStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { quantity: number; operation: 'add' | 'subtract' }
  ) {
    const { quantity, operation } = body
    const product = await this.productsService.updateStock(id, quantity, operation)
    return {
      success: true,
      data: product,
      message: `庫存${operation === 'add' ? '增加' : '減少'}成功`,
    }
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '刪除產品' })
  @ApiParam({ name: 'id', description: '產品 ID' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.productsService.remove(id)
    return {
      success: true,
      message: '產品刪除成功',
    }
  }
}