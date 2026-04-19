<template>
  <div class="inventory-view">
    <!-- 頁面標題 -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">庫存管理</h2>
        <p class="page-description">監控庫存狀態、查看異動記錄</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="stocktakeVisible = true">
          <el-icon><Finished /></el-icon>
          庫存盤點
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          匯出報表
        </el-button>
      </div>
    </div>

    <StocktakeDialog v-model="stocktakeVisible" @done="handleStocktakeDone" />

    <!-- 統計卡片 -->
    <el-row :gutter="16" class="stats-cards">
      <el-col :xs="12" :sm="6">
        <el-card class="stats-card" shadow="hover">
          <div class="stats-content">
            <div class="stats-icon primary">
              <el-icon><Box /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-value">{{ stats.totalProducts }}</div>
              <div class="stats-label">總商品數</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stats-card" shadow="hover">
          <div class="stats-content">
            <div class="stats-icon warning">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-value">{{ stats.lowStockProducts }}</div>
              <div class="stats-label">低庫存警告</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stats-card" shadow="hover">
          <div class="stats-content">
            <div class="stats-icon danger">
              <el-icon><CircleClose /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-value">{{ stats.outOfStockProducts }}</div>
              <div class="stats-label">缺貨商品</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stats-card" shadow="hover">
          <div class="stats-content">
            <div class="stats-icon success">
              <el-icon><Coin /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-value">{{ formatNumber(stats.totalValue) }}</div>
              <div class="stats-label">總庫存值</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜尋和篩選 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filters" :inline="true" class="search-form">
        <el-form-item label="商品名稱">
          <el-input
            v-model="filters.keyword"
            placeholder="請輸入商品名稱或 SKU"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="分類">
          <el-select v-model="filters.categoryId" placeholder="請選擇分類" clearable style="width: 150px">
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="庫存狀態">
          <el-select v-model="filters.lowStockOnly" placeholder="選擇狀態" clearable style="width: 150px">
            <el-option label="全部" :value="undefined" />
            <el-option label="僅顯示低庫存" :value="true" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜尋
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 庫存列表 -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="name" label="商品名稱" min-width="180" />
        <el-table-column prop="sku" label="SKU" width="140" />
        <el-table-column label="分類" width="120">
          <template #default="{ row }">{{ row.category?.name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="stockQuantity" label="目前庫存" width="90" align="right">
          <template #default="{ row }">
            <span :class="getStockClass(row)">
              <el-icon v-if="row.stockQuantity === 0"><CircleClose /></el-icon>
              <el-icon v-else-if="row.stockQuantity <= row.minStockLevel"><Warning /></el-icon>
              {{ row.stockQuantity }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="minStockLevel" label="最低庫存" width="90" align="right" />
        <el-table-column prop="unitPrice" label="售價" min-width="160" align="right">
          <template #default="{ row }">
            NT$ {{ row.unitPrice?.toLocaleString() || '0' }}
          </template>
        </el-table-column>
        <el-table-column label="庫存總值" min-width="180" align="right">
          <template #default="{ row }">
            NT$ {{ ((row.stockQuantity || 0) * (row.costPrice || 0)).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" link @click="handleViewTransactions(row)">
              <el-icon><Document /></el-icon>
              異動記錄
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <!-- 異動記錄抽屜 -->
    <el-drawer
      v-model="drawerVisible"
      :title="`${currentProduct?.name} - 庫存異動記錄`"
      size="70%"
      direction="rtl"
    >
      <el-table
        v-loading="transactionsLoading"
        :data="transactions"
        border
        style="width: 100%"
      >
        <el-table-column prop="type" label="類型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTransactionTypeColor(row.type)">
              {{ getTransactionTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="數量" width="100" align="right">
          <template #default="{ row }">
            <span :style="{ color: row.quantity > 0 ? '#67c23a' : '#f56c6c' }">
              {{ row.quantity > 0 ? '+' : '' }}{{ row.quantity }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="beforeQuantity" label="異動前" width="100" align="right" />
        <el-table-column prop="afterQuantity" label="異動後" width="100" align="right" />
        <el-table-column prop="unitCost" label="單位成本" width="120" align="right">
          <template #default="{ row }">
            {{ row.unitCost ? `NT$ ${row.unitCost.toLocaleString()}` : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="notes" label="備註" min-width="150" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="異動時間" width="160" />
      </el-table>

      <div class="drawer-pagination">
        <el-pagination
          v-model:current-page="transactionsPage"
          v-model:page-size="transactionsPageSize"
          :total="transactionsTotal"
          layout="total, prev, pager, next"
          @current-change="loadTransactions"
        />
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Box,
  Warning,
  CircleClose,
  Coin,
  Download,
  Search,
  Refresh,
  Document,
  Finished,
} from '@element-plus/icons-vue'
import StocktakeDialog from '@/components/inventory/StocktakeDialog.vue'
import { productsApi } from '@/api/products'
import { inventoryApi, InventoryTransactionType } from '@/api/inventory'
import { categoriesApi } from '@/api/categories'
import type { Product, Category } from '@/types'

const loading = ref(false)
const stocktakeVisible = ref(false)
const tableData = ref<Product[]>([])

// 盤點完成後刷新
const handleStocktakeDone = () => {
  loadStats()
  loadData()
}
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const categories = ref<Category[]>([])

const stats = reactive({
  totalProducts: 0,
  lowStockProducts: 0,
  outOfStockProducts: 0,
  totalValue: 0,
})

const filters = ref({
  keyword: '',
  categoryId: undefined as number | undefined,
  lowStockOnly: undefined as boolean | undefined,
})

// 異動記錄抽屜
const drawerVisible = ref(false)
const transactionsLoading = ref(false)
const currentProduct = ref<Product | null>(null)
const transactions = ref<any[]>([])
const transactionsPage = ref(1)
const transactionsPageSize = ref(10)
const transactionsTotal = ref(0)

// 格式化數字
const formatNumber = (num: number) => {
  return num.toLocaleString()
}

// 獲取庫存狀態樣式
const getStockClass = (row: Product) => {
  if (row.stockQuantity === 0) return 'stock-out'
  if (row.stockQuantity <= row.minStockLevel) return 'stock-low'
  return 'stock-normal'
}

// 獲取交易類型顏色
const getTransactionTypeColor = (type: InventoryTransactionType) => {
  const colors: Record<InventoryTransactionType, string> = {
    [InventoryTransactionType.PURCHASE]: 'success',
    [InventoryTransactionType.SALE]: 'primary',
    [InventoryTransactionType.ADJUSTMENT]: 'warning',
    [InventoryTransactionType.RETURN]: 'info',
    [InventoryTransactionType.TRANSFER]: '',
  }
  return colors[type] || ''
}

// 獲取交易類型文字
const getTransactionTypeText = (type: InventoryTransactionType) => {
  const texts: Record<InventoryTransactionType, string> = {
    [InventoryTransactionType.PURCHASE]: '進貨',
    [InventoryTransactionType.SALE]: '銷售',
    [InventoryTransactionType.ADJUSTMENT]: '調整',
    [InventoryTransactionType.RETURN]: '退貨',
    [InventoryTransactionType.TRANSFER]: '調撥',
  }
  return texts[type] || type
}

// 獲取統計資料
const loadStats = async () => {
  try {
    const response = await inventoryApi.getStats()
    Object.assign(stats, response.data)
  } catch (error) {
    console.error('獲取統計資料失敗:', error)
  }
}

// 獲取分類列表
const loadCategories = async () => {
  try {
    const response = await categoriesApi.getCategories()
    categories.value = response.data || []
  } catch (error) {
    console.error('獲取分類列表失敗:', error)
  }
}

// 獲取產品列表
const loadData = async () => {
  loading.value = true
  try {
    const response = await productsApi.getProducts({
      page: currentPage.value,
      limit: pageSize.value,
      keyword: filters.value.keyword || undefined,
      categoryId: filters.value.categoryId,
      isActive: true,
    })

    let products = response.data.items || []

    // 客戶端過濾低庫存
    if (filters.value.lowStockOnly) {
      products = products.filter(p => p.stockQuantity <= p.minStockLevel)
    }

    tableData.value = products
    total.value = response.data.total || 0
  } catch (error) {
    ElMessage.error('獲取庫存列表失敗')
  } finally {
    loading.value = false
  }
}

// 查看異動記錄
const handleViewTransactions = async (row: Product) => {
  currentProduct.value = row
  drawerVisible.value = true
  transactionsPage.value = 1
  await loadTransactions()
}

// 載入異動記錄
const loadTransactions = async () => {
  if (!currentProduct.value?.id) return

  transactionsLoading.value = true
  try {
    const response = await inventoryApi.getProductTransactions(
      currentProduct.value.id,
      {
        page: transactionsPage.value,
        limit: transactionsPageSize.value,
      }
    )
    transactions.value = response.data.items || []
    transactionsTotal.value = response.data.total || 0
  } catch (error) {
    ElMessage.error('獲取異動記錄失敗')
  } finally {
    transactionsLoading.value = false
  }
}

// 匯出報表
const handleExport = () => {
  ElMessage.info('匯出功能開發中')
}

// 搜尋
const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

// 重置
const handleReset = () => {
  filters.value = {
    keyword: '',
    categoryId: undefined,
    lowStockOnly: undefined,
  }
  currentPage.value = 1
  loadData()
}

// 頁碼變更
const handlePageChange = (page: number) => {
  currentPage.value = page
  loadData()
}

// 每頁數量變更
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadData()
}

// 組件名稱
defineOptions({
  name: 'Inventory',
})

onMounted(() => {
  loadStats()
  loadCategories()
  loadData()
})
</script>

<style lang="scss" scoped>
.inventory-view {
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

.stats-cards {
  margin-bottom: 16px;
}

.stats-card {
  .stats-content {
    display: flex;
    align-items: center;
    gap: 16px;

    .stats-icon {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;

      &.primary {
        background-color: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
      }

      &.success {
        background-color: var(--el-color-success-light-9);
        color: var(--el-color-success);
      }

      &.warning {
        background-color: var(--el-color-warning-light-9);
        color: var(--el-color-warning);
      }

      &.danger {
        background-color: var(--el-color-danger-light-9);
        color: var(--el-color-danger);
      }
    }

    .stats-info {
      flex: 1;

      .stats-value {
        font-size: 24px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin-bottom: 4px;
      }

      .stats-label {
        color: var(--el-text-color-secondary);
        font-size: 14px;
      }
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
  min-height: 400px;
}

.stock-normal {
  color: var(--el-color-success);
  font-weight: 500;
}

.stock-low {
  color: var(--el-color-warning);
  font-weight: 500;
}

.stock-out {
  color: var(--el-color-danger);
  font-weight: 500;
}

.pagination {
  margin-top: 16px;
  text-align: right;
}

.drawer-pagination {
  margin-top: 16px;
  text-align: center;
}

// 響應式設計
@media (max-width: 768px) {
  .inventory-view {
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
}
</style>