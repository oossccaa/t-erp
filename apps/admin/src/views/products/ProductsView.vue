<template>
  <div class="products-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">产品管理</h2>
        <p class="page-description">管理您的产品信息，包括库存、价格、分类等</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新增产品
        </el-button>
      </div>
    </div>
    
    <!-- 搜索和过滤 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="searchForm" :inline="true" class="search-form">
        <el-form-item label="产品名称">
          <el-input
            v-model="searchForm.keyword"
            placeholder="输入产品名称或 SKU"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item label="产品分类">
          <el-select
            v-model="searchForm.categoryId"
            placeholder="选择分类"
            clearable
            style="width: 180px"
          >
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.isActive"
            placeholder="选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="正常" :value="true" />
            <el-option label="停用" :value="false" />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 产品列表 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="card-title">产品列表</span>
            <el-tag v-if="selectedRows.length" type="primary">
              已选择 {{ selectedRows.length }} 项
            </el-tag>
          </div>
          <div class="header-right">
            <el-button-group v-if="selectedRows.length">
              <el-button size="small" @click="handleBatchEnable">
                <el-icon><Check /></el-icon>
                批量启用
              </el-button>
              <el-button size="small" @click="handleBatchDisable">
                <el-icon><Close /></el-icon>
                批量停用
              </el-button>
              <el-button size="small" type="danger" @click="handleBatchDelete">
                <el-icon><Delete /></el-icon>
                批量删除
              </el-button>
            </el-button-group>
            <el-button size="small" @click="handleExport">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
            <el-button size="small" @click="handleImport">
              <el-icon><Upload /></el-icon>
              导入
            </el-button>
          </div>
        </div>
      </template>
      
      <el-table
        v-loading="loading"
        :data="tableData"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
        stripe
        style="width: 100%"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="sku" label="SKU" width="120" sortable="custom" />
        <el-table-column prop="name" label="产品名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="category" label="分类" width="120">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.category?.name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="unitPrice" label="单价" width="100" sortable="custom">
          <template #default="{ row }">
            <span class="price">{{ formatMoney(row.unitPrice) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="costPrice" label="成本" width="100" sortable="custom">
          <template #default="{ row }">
            <span class="price">{{ formatMoney(row.costPrice) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="stockQuantity" label="库存" width="80" sortable="custom">
          <template #default="{ row }">
            <span 
              :class="{
                'stock-warning': row.stockQuantity <= row.minStockLevel,
                'stock-danger': row.stockQuantity === 0
              }"
            >
              {{ row.stockQuantity }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="minStockLevel" label="最低库存" width="90" />
        <el-table-column prop="isActive" label="状态" width="80">
          <template #default="{ row }">
            <el-switch
              v-model="row.isActive"
              @change="handleToggleStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160" sortable="custom">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-button size="small" type="primary" @click="handleView(row)">
                <el-icon><View /></el-icon>
              </el-button>
              <el-button size="small" @click="handleEdit(row)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button size="small" @click="handleCopy(row)">
                <el-icon><CopyDocument /></el-icon>
              </el-button>
              <el-button size="small" type="danger" @click="handleDelete(row)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 产品详情对话框 -->
    <ProductDialog
      v-model="dialogVisible"
      :mode="dialogMode"
      :product="currentProduct"
      @confirm="handleDialogConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Search,
  Refresh,
  Check,
  Close,
  Delete,
  Download,
  Upload,
  View,
  Edit,
  CopyDocument,
} from '@element-plus/icons-vue'
import type { Product, Category } from '@t-erp/shared'
import { productsApi } from '@/api/products'
import { categoriesApi } from '@/api/categories'
import ProductDialog from '@/components/products/ProductDialog.vue'
import { formatMoney, formatDateTime } from '@/utils/format'

// 可响式数据
const loading = ref(false)
const selectedRows = ref<Product[]>([])
const tableData = ref<Product[]>([])
const categories = ref<Category[]>([])
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit' | 'view'>('create')
const currentProduct = ref<Product | null>(null)

// 搜索表单
const searchForm = reactive({
  keyword: '',
  categoryId: null as number | null,
  isActive: null as boolean | null,
})

// 分页信息
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
})

// 排序信息
const sortInfo = reactive({
  prop: 'createdAt',
  order: 'descending',
})

// 计算属性
const queryParams = computed(() => ({
  page: pagination.page,
  limit: pagination.limit,
  keyword: searchForm.keyword || undefined,
  categoryId: searchForm.categoryId || undefined,
  isActive: searchForm.isActive === null ? undefined : searchForm.isActive,
  sortBy: sortInfo.prop,
  sortOrder: (sortInfo.order === 'descending' ? 'DESC' : 'ASC') as 'ASC' | 'DESC',
}))

// 获取产品列表
const getProductsList = async () => {
  loading.value = true
  try {
    const response = await productsApi.getProducts(queryParams.value)
    tableData.value = response.data?.items || []
    pagination.total = response.data?.total || 0
  } catch (error) {
    ElMessage.error('获取产品列表失败')
  } finally {
    loading.value = false
  }
}

// 获取分类列表
const getCategoriesList = async () => {
  try {
    const response = await categoriesApi.getCategories()
    categories.value = Array.isArray(response.data) ? response.data : []
  } catch (error) {
    console.error('获取分类列表失败:', error)
  }
}

// 搜索处理
const handleSearch = () => {
  pagination.page = 1
  getProductsList()
}

// 重置处理
const handleReset = () => {
  Object.assign(searchForm, {
    keyword: '',
    categoryId: null,
    isActive: null,
  })
  pagination.page = 1
  getProductsList()
}

// 分页处理
const handleSizeChange = (limit: number) => {
  pagination.limit = limit
  pagination.page = 1
  getProductsList()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  getProductsList()
}

// 排序处理
const handleSortChange = ({ prop, order }: any) => {
  if (order) {
    sortInfo.prop = prop
    sortInfo.order = order
  } else {
    sortInfo.prop = 'createdAt'
    sortInfo.order = 'descending'
  }
  getProductsList()
}

// 选择处理
const handleSelectionChange = (selection: Product[]) => {
  selectedRows.value = selection
}

// 新增产品
const handleCreate = () => {
  currentProduct.value = null
  dialogMode.value = 'create'
  dialogVisible.value = true
}

// 查看产品
const handleView = (row: Product) => {
  currentProduct.value = row
  dialogMode.value = 'view'
  dialogVisible.value = true
}

// 编辑产品
const handleEdit = (row: Product) => {
  currentProduct.value = row
  dialogMode.value = 'edit'
  dialogVisible.value = true
}

// 复制产品
const handleCopy = (row: Product) => {
  currentProduct.value = { ...row, id: 0, sku: '', name: `${row.name} - 复制` }
  dialogMode.value = 'create'
  dialogVisible.value = true
}

// 删除产品
const handleDelete = async (row: Product) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除产品 "${row.name}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await productsApi.deleteProduct(row.id!)
    ElMessage.success('删除成功')
    getProductsList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 切换状态
const handleToggleStatus = async (row: Product) => {
  try {
    await productsApi.updateProductStatus(row.id!, row.isActive)
    ElMessage.success(row.isActive ? '启用成功' : '停用成功')
    getProductsList()
  } catch (error) {
    ElMessage.error('操作失败')
    // 还原状态
    row.isActive = !row.isActive
  }
}

// 批量启用
const handleBatchEnable = async () => {
  const ids = selectedRows.value.map(row => row.id!)
  try {
    // 使用單個 API 批量處理
    await Promise.all(ids.map(id => productsApi.updateProductStatus(id, true)))
    ElMessage.success('批量启用成功')
    getProductsList()
  } catch (error) {
    ElMessage.error('批量启用失败')
  }
}

// 批量停用
const handleBatchDisable = async () => {
  const ids = selectedRows.value.map(row => row.id!)
  try {
    // 使用單個 API 批量處理
    await Promise.all(ids.map(id => productsApi.updateProductStatus(id, false)))
    ElMessage.success('批量停用成功')
    getProductsList()
  } catch (error) {
    ElMessage.error('批量停用失败')
  }
}

// 批量删除
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 个产品吗？`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    const ids = selectedRows.value.map(row => row.id!)
    await productsApi.deleteProducts(ids)
    ElMessage.success('批量删除成功')
    getProductsList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败')
    }
  }
}

// 导出数据
const handleExport = async () => {
  ElMessage.info('導出功能開發中')
}

// 导入数据
const handleImport = () => {
  // 这里可以打开导入对话框
  ElMessage.info('导入功能开发中...')
}

// 对话框确认
const handleDialogConfirm = () => {
  dialogVisible.value = false
  getProductsList()
}

// 组件名称
defineOptions({
  name: 'Products',
})

// 初始化
onMounted(async () => {
  await Promise.all([
    getProductsList(),
    getCategoriesList(),
  ])
})
</script>

<style lang="scss" scoped>
.products-view {
  padding: 24px;
  background-color: var(--el-bg-color-page);
  min-height: calc(100vh - 120px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  
  .header-content {
    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin: 0 0 8px 0;
    }
    
    .page-description {
      color: var(--el-text-color-secondary);
      margin: 0;
    }
  }
}

.filter-card {
  margin-bottom: 16px;
  
  .search-form {
    margin-bottom: 0;
  }
}

.table-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .card-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
    }
    
    .header-right {
      display: flex;
      gap: 8px;
    }
  }
}

.price {
  font-weight: 600;
  color: var(--el-color-primary);
}

.stock-warning {
  color: var(--el-color-warning);
  font-weight: 600;
}

.stock-danger {
  color: var(--el-color-danger);
  font-weight: 600;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

// 响应式设计
@media (max-width: 768px) {
  .products-view {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
    
    .header-actions {
      align-self: flex-end;
    }
  }
  
  .search-form {
    :deep(.el-form-item) {
      margin-bottom: 16px;
      
      .el-form-item__label {
        display: block;
        text-align: left;
        margin-bottom: 4px;
      }
      
      .el-form-item__content {
        margin-left: 0 !important;
      }
    }
  }
  
  .card-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch !important;
    
    .header-right {
      justify-content: flex-end;
    }
  }
  
  .pagination-wrapper {
    :deep(.el-pagination) {
      justify-content: center;
      
      .el-pagination__sizes,
      .el-pagination__jump {
        display: none;
      }
    }
  }
}
</style>
