<template>
  <div class="products-view">
    <!-- 頁面標題 -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">產品管理</h2>
        <p class="page-description">管理您的產品資料，包括庫存、價格、分類等</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新增產品
        </el-button>
      </div>
    </div>
    
    <!-- 搜尋和篩選 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="searchForm" :inline="true" class="search-form" @submit.prevent>
        <el-form-item label="產品名稱">
          <el-input
            v-model="searchForm.keyword"
            placeholder="輸入產品名稱或 SKU"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="產品分類">
          <el-select
            v-model="searchForm.categoryId"
            placeholder="選擇分類"
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

        <el-form-item label="狀態">
          <el-select
            v-model="searchForm.isActive"
            placeholder="選擇狀態"
            clearable
            style="width: 120px"
          >
            <el-option label="啟用" :value="true" />
            <el-option label="停用" :value="false" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重設
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 產品列表 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="card-title">產品列表</span>
            <el-tag v-if="selectedRows.length" type="primary">
              已選擇 {{ selectedRows.length }} 項
            </el-tag>
          </div>
          <div class="header-right">
            <el-button-group v-if="selectedRows.length">
              <el-button size="small" @click="handleBatchEnable">
                <el-icon><Check /></el-icon>
                批次啟用
              </el-button>
              <el-button size="small" @click="handleBatchDisable">
                <el-icon><Close /></el-icon>
                批次停用
              </el-button>
              <el-button size="small" type="danger" @click="handleBatchDelete">
                <el-icon><Delete /></el-icon>
                批次刪除
              </el-button>
            </el-button-group>
            <el-button size="small" @click="handleExport">
              <el-icon><Download /></el-icon>
              匯出
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
        <el-table-column prop="name" label="產品名稱" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="product-name-link" @click="handleView(row)">
              {{ row.name }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分類" width="120">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.category?.name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="unitPrice" label="單價" width="100" sortable="custom">
          <template #default="{ row }">
            <span class="price price-sale">{{ formatMoney(row.unitPrice) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="costPrice" label="成本價" width="100" sortable="custom">
          <template #default="{ row }">
            <span class="price price-cost">{{ formatMoney(row.costPrice) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="毛利率" width="90" align="right">
          <template #default="{ row }">
            <span :class="getMarginClass(row)">{{ formatMargin(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="stockQuantity" label="庫存" width="80" sortable="custom">
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
        <el-table-column prop="minStockLevel" label="最低庫存" width="90" />
        <el-table-column v-if="features.weight" prop="weight" label="重量(kg)" width="100" align="right">
          <template #default="{ row }">{{ Number(row.weight || 0).toFixed(3) }}</template>
        </el-table-column>
        <el-table-column prop="isActive" label="狀態" width="80">
          <template #default="{ row }">
            <el-switch
              v-model="row.isActive"
              @change="handleToggleStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="建立時間" width="160" sortable="custom">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button size="small" @click="handleEdit(row)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button size="small" @click="handleCopy(row)">
                <el-icon><CopyDocument /></el-icon>
              </el-button>
              <el-button size="small" type="danger" @click="handleDelete(row)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分頁 -->
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
    
    <!-- 產品詳情對話框 -->
    <ProductDialog
      v-model="dialogVisible"
      :mode="dialogMode"
      :product="currentProduct"
      @confirm="handleDialogConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onActivated, watch } from 'vue'
import { watchDebounced } from '@vueuse/core'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Search,
  Refresh,
  Check,
  Close,
  Delete,
  Download,
  Edit,
  CopyDocument,
} from '@element-plus/icons-vue'
import type { Product, Category } from '@/types'
import { productsApi } from '@/api/products'
import { categoriesApi } from '@/api/categories'
import ProductDialog from '@/components/products/ProductDialog.vue'
import { features } from '@/config/features'
import { formatMoney, formatDateTime } from '@/utils/format'

const getMargin = (row: Product): number | null => {
  const price = Number(row.unitPrice) || 0
  const cost = Number(row.costPrice) || 0
  if (price <= 0) return null
  return ((price - cost) / price) * 100
}

const formatMargin = (row: Product): string => {
  const m = getMargin(row)
  return m === null ? '-' : `${m.toFixed(1)}%`
}

const getMarginClass = (row: Product): string => {
  const m = getMargin(row)
  if (m === null) return ''
  if (m < 0) return 'margin-loss'
  if (m < 15) return 'margin-low'
  return 'margin-ok'
}

// 響應式資料
const loading = ref(false)
const selectedRows = ref<Product[]>([])
const tableData = ref<Product[]>([])
const categories = ref<Category[]>([])
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit' | 'view'>('create')
const currentProduct = ref<Product | null>(null)

// 搜尋表單
const searchForm = reactive({
  keyword: '',
  categoryId: null as number | null,
  isActive: null as boolean | null,
})

// 分頁資訊
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
})

// 排序資訊
const sortInfo = reactive({
  prop: 'createdAt',
  order: 'descending',
})

// 計算屬性
const queryParams = computed(() => ({
  page: pagination.page,
  limit: pagination.limit,
  keyword: searchForm.keyword || undefined,
  categoryId: searchForm.categoryId || undefined,
  isActive: searchForm.isActive === null ? undefined : searchForm.isActive,
  sortBy: sortInfo.prop,
  sortOrder: (sortInfo.order === 'descending' ? 'DESC' : 'ASC') as 'ASC' | 'DESC',
}))

// 取得產品列表
const getProductsList = async () => {
  loading.value = true
  try {
    const response = await productsApi.getProducts(queryParams.value)
    tableData.value = response.data?.items || []
    pagination.total = response.data?.total || 0
  } catch (error) {
    ElMessage.error('取得產品列表失敗')
  } finally {
    loading.value = false
  }
}

// 取得分類列表
const getCategoriesList = async () => {
  try {
    const response = await categoriesApi.getCategories()
    categories.value = Array.isArray(response.data) ? response.data : []
  } catch (error) {
    console.error('取得分類列表失敗:', error)
  }
}

// 搜尋處理（即時）
const triggerSearch = () => {
  pagination.page = 1
  getProductsList()
}

// keyword 輸入 debounce 300ms
watchDebounced(() => searchForm.keyword, triggerSearch, { debounce: 300 })

// 分類、狀態變動立即觸發
watch(() => [searchForm.categoryId, searchForm.isActive], triggerSearch)

// 重設處理
const handleReset = () => {
  Object.assign(searchForm, {
    keyword: '',
    categoryId: null,
    isActive: null,
  })
  pagination.page = 1
  getProductsList()
}

// 分頁處理
const handleSizeChange = (limit: number) => {
  pagination.limit = limit
  pagination.page = 1
  getProductsList()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  getProductsList()
}

// 排序處理
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

// 選擇處理
const handleSelectionChange = (selection: Product[]) => {
  selectedRows.value = selection
}

// 新增產品
const handleCreate = () => {
  currentProduct.value = null
  dialogMode.value = 'create'
  dialogVisible.value = true
}

// 檢視產品
const handleView = (row: Product) => {
  currentProduct.value = row
  dialogMode.value = 'view'
  dialogVisible.value = true
}

// 編輯產品
const handleEdit = (row: Product) => {
  currentProduct.value = row
  dialogMode.value = 'edit'
  dialogVisible.value = true
}

// 複製產品
const handleCopy = (row: Product) => {
  currentProduct.value = { ...row, id: 0, sku: '', name: `${row.name} - 複本` }
  dialogMode.value = 'create'
  dialogVisible.value = true
}

// 刪除產品
const handleDelete = async (row: Product) => {
  try {
    await ElMessageBox.confirm(
      `確定要刪除產品 "${row.name}" 嗎？`,
      '刪除確認',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await productsApi.deleteProduct(row.id!)
    ElMessage.success('刪除成功')
    getProductsList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('刪除失敗')
    }
  }
}

// 切換狀態
const handleToggleStatus = async (row: Product) => {
  try {
    // 使用 updateProduct API 更新 isActive 狀態
    await productsApi.updateProduct(row.id!, { isActive: row.isActive })
    ElMessage.success(row.isActive ? '啟用成功' : '停用成功')
  } catch (error) {
    // 還原狀態
    row.isActive = !row.isActive
    // 錯誤訊息已由 request.ts 攔截器處理
  }
}

// 批次啟用
const handleBatchEnable = async () => {
  const ids = selectedRows.value.map(row => row.id!)
  try {
    // 使用 updateProduct API 批次處理
    await Promise.all(ids.map(id => productsApi.updateProduct(id, { isActive: true })))
    ElMessage.success('批次啟用成功')
    getProductsList()
  } catch (error) {
    // 錯誤訊息已由 request.ts 攔截器處理
  }
}

// 批次停用
const handleBatchDisable = async () => {
  const ids = selectedRows.value.map(row => row.id!)
  try {
    // 使用 updateProduct API 批次處理
    await Promise.all(ids.map(id => productsApi.updateProduct(id, { isActive: false })))
    ElMessage.success('批次停用成功')
    getProductsList()
  } catch (error) {
    // 錯誤訊息已由 request.ts 攔截器處理
  }
}

// 批次刪除
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `確定要刪除選取的 ${selectedRows.value.length} 個產品嗎？`,
      '批次刪除確認',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    const ids = selectedRows.value.map(row => row.id!)
    await productsApi.deleteProducts(ids)
    ElMessage.success('批次刪除成功')
    getProductsList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('批次刪除失敗')
    }
  }
}

// 匯出資料
const handleExport = async () => {
  ElMessage.info('匯出功能開發中')
}

// 對話框確認
const handleDialogConfirm = async (formData: any) => {
  try {
    if (dialogMode.value === 'create') {
      // 建立產品 - 移除 isActive 欄位（後端不接受）
      const { isActive, ...createData } = formData
      await productsApi.createProduct(createData)
      ElMessage.success('建立成功')
    } else if (dialogMode.value === 'edit') {
      // 更新產品 - 移除不允許更新的欄位（sku, stockQuantity）
      const { sku, stockQuantity, ...updateData } = formData
      await productsApi.updateProduct(currentProduct.value!.id!, updateData)
      ElMessage.success('更新成功')
    }

    dialogVisible.value = false
    getProductsList()
  } catch (error: any) {
    // 錯誤訊息已由 request.ts 攔截器處理
    throw error // 讓 dialog 知道失敗，不要關閉
  }
}

// 元件名稱
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

// keep-alive 頁面再次啟用時，清空搜尋條件
onActivated(() => {
  handleReset()
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
}

.price-sale {
  color: var(--el-color-primary);
}

.price-cost {
  color: var(--el-color-danger);
}

.margin-ok {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.margin-low {
  font-weight: 600;
  color: var(--el-color-warning);
}

.margin-loss {
  font-weight: 600;
  color: var(--el-color-danger);
}

.stock-warning {
  color: var(--el-color-warning);
  font-weight: 600;
}

.stock-danger {
  color: var(--el-color-danger);
  font-weight: 600;
}

.product-name-link {
  color: var(--el-color-primary);
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
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

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  .el-button + .el-button {
    margin-left: 0;
  }
}
</style>
